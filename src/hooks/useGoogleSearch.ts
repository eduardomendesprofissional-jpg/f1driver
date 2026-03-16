import { useState, useCallback } from "react";
import { searchFoursquarePlaces, FoursquarePlace } from "@/lib/foursquare";

const MAX_DISTANCE_KM = 25;
const MAX_DISTANCE_M = MAX_DISTANCE_KM * 1000;

export interface GooglePlace {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [lng, lat]
  distance?: string;
  distanceMeters?: number;
  category?: string;
  blocked?: boolean;
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

async function searchNominatim(query: string, lat: number, lng: number): Promise<GooglePlace[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      addressdetails: "1",
      countrycodes: "br",
      limit: "10",
      lat: String(lat),
      lon: String(lng),
    });
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      { headers: { "Accept-Language": "pt-BR", "User-Agent": "F1DriverApp/1.0" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).map((item: any) => {
      const itemLat = parseFloat(item.lat);
      const itemLng = parseFloat(item.lon);
      const dist = haversineDistance(lat, lng, itemLat, itemLng);
      const name = item.name || item.display_name?.split(",")[0] || "";
      return {
        id: `nom-${item.place_id}`,
        text: name,
        place_name: item.display_name || "",
        center: [itemLng, itemLat] as [number, number],
        distance: formatDistance(dist),
        distanceMeters: dist,
        category: item.type ? item.type.replace(/_/g, " ") : "Endereço",
        blocked: dist > MAX_DISTANCE_M,
      };
    });
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

      // Busca híbrida: Foursquare (POIs) + Nominatim (endereços) em paralelo
      const [fsqResults, nominatimResults] = await Promise.all([
        searchFoursquarePlaces(query, lat, lng, 5, MAX_DISTANCE_M).catch(() => [] as FoursquarePlace[]),
        searchNominatim(query, lat, lng),
      ]);

      const foursquarePlaces: GooglePlace[] = fsqResults
        .filter((p) => p.geocodes?.main)
        .map((p) => {
          const coords = p.geocodes!.main!;
          const address = p.location.formatted_address || p.location.address || "";
          const category = p.categories?.[0]?.name || "";
          const fullName = [p.name, address].filter(Boolean).join(" - ");
          const dist = p.distance ?? haversineDistance(lat, lng, coords.latitude, coords.longitude);
          return {
            id: p.fsq_id,
            text: p.name,
            place_name: fullName,
            center: [coords.longitude, coords.latitude] as [number, number],
            distance: formatDistance(dist),
            distanceMeters: dist,
            category,
            blocked: dist > MAX_DISTANCE_M,
          };
        });

      // Mesclar sem duplicatas por coordenada
      const seen = new Set(foursquarePlaces.map((p) => `${p.center[0].toFixed(4)},${p.center[1].toFixed(4)}`));
      const uniqueNominatim = nominatimResults.filter(
        (p) => !seen.has(`${p.center[0].toFixed(4)},${p.center[1].toFixed(4)}`)
      );

      const all = [...foursquarePlaces, ...uniqueNominatim]
        .sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0))
        .slice(0, 10);

      setResults(all);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, loading, search, clear };
};
