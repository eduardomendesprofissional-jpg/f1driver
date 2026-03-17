import { useState, useCallback } from "react";
import { searchTomTom, TomTomResult } from "@/lib/tomtom";

console.log("[useGoogleSearch] Module loaded - TomTom version");

const MAX_DISTANCE_KM = 100;
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

function tomtomToPlace(item: TomTomResult, userLat: number, userLng: number): GooglePlace {
  const name = item.poi?.name || item.address.freeformAddress || "";
  const address = item.address.freeformAddress || "";
  const category = item.poi?.categories?.[0] || (item.type === "POI" ? "Estabelecimento" : "Endereço");
  const dist = item.dist ?? haversineDistance(userLat, userLng, item.position.lat, item.position.lon);

  return {
    id: item.id || `tt-${item.position.lat}-${item.position.lon}`,
    text: name,
    place_name: name !== address ? `${name} - ${address}` : address,
    center: [item.position.lon, item.position.lat],
    distance: formatDistance(dist),
    distanceMeters: dist,
    category,
    blocked: dist > MAX_DISTANCE_M,
  };
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
      console.log("[useGoogleSearch] Searching TomTom:", query, "lat:", lat, "lng:", lng);

      const ttResults = await searchTomTom(query, lat, lng);
      console.log("[useGoogleSearch] TomTom results:", ttResults.length);
      const places = ttResults
        .map((r) => tomtomToPlace(r, lat, lng))
        .sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0))
        .slice(0, 10);

      setResults(places);
    } catch (err) {
      console.error("[useGoogleSearch] Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, loading, search, clear };
};
