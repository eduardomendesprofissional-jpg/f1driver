import { useState, useCallback } from "react";
import { searchFoursquarePlaces, FoursquarePlace } from "@/lib/foursquare";
import { MAPBOX_TOKEN } from "@/lib/mapbox";

export interface GooglePlace {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [lng, lat]
  distance?: string;
  category?: string;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function searchMapbox(query: string, lng: number, lat: number): Promise<GooglePlace[]> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&proximity=${lng},${lat}&language=pt-BR&limit=5&country=BR`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map((f: any) => ({
      id: f.id,
      text: f.text || f.place_name,
      place_name: f.place_name || "",
      center: f.center as [number, number],
      distance: formatDistance(haversineDistance(lat, lng, f.center[1], f.center[0])),
      category: "Endereço",
    }));
  } catch {
    return [];
  }
}

export const useGoogleSearch = () => {
  const [results, setResults] = useState<GooglePlace[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string, proximity?: [number, number]) => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const lat = proximity ? proximity[1] : -15.7801;
      const lng = proximity ? proximity[0] : -47.9292;

      // Busca híbrida: Foursquare (POIs) + Mapbox (endereços) em paralelo
      const [fsqResults, mapboxResults] = await Promise.all([
        searchFoursquarePlaces(query, lat, lng, 5).catch(() => [] as FoursquarePlace[]),
        searchMapbox(query, lng, lat),
      ]);

      const foursquarePlaces: GooglePlace[] = fsqResults
        .filter((p) => p.geocodes?.main)
        .map((p) => {
          const coords = p.geocodes!.main!;
          const address = p.location.formatted_address || p.location.address || "";
          const category = p.categories?.[0]?.name || "";
          const fullName = [p.name, address].filter(Boolean).join(" - ");
          return {
            id: p.fsq_id,
            text: p.name,
            place_name: fullName,
            center: [coords.longitude, coords.latitude] as [number, number],
            distance: p.distance !== undefined ? formatDistance(p.distance) : undefined,
            category,
          };
        });

      // Mesclar: Foursquare primeiro, depois Mapbox (sem duplicatas)
      const seen = new Set(foursquarePlaces.map((p) => `${p.center[0].toFixed(4)},${p.center[1].toFixed(4)}`));
      const uniqueMapbox = mapboxResults.filter(
        (p) => !seen.has(`${p.center[0].toFixed(4)},${p.center[1].toFixed(4)}`)
      );

      setResults([...foursquarePlaces, ...uniqueMapbox].slice(0, 10));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, loading, search, clear };
};
