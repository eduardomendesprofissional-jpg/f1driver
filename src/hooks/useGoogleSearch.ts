import { useState, useCallback } from "react";
import { searchGooglePlaces, GooglePlaceResult } from "@/lib/googleMaps";

const MAX_DISTANCE_KM = 35;
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

function googleToPlace(item: GooglePlaceResult, userLat: number, userLng: number, hasUserPos: boolean): GooglePlace {
  const name = item.displayName || item.shortFormattedAddress || item.formattedAddress;
  const address = item.formattedAddress;
  const isPoi = item.types?.some(t => !["street_address", "route", "premise", "geocode", "plus_code"].includes(t));
  const category = isPoi ? (item.types?.[0] || "Estabelecimento") : "Endereço";
  const dist = haversineDistance(userLat, userLng, item.lat, item.lng);

  return {
    id: item.id || `g-${item.lat}-${item.lng}`,
    text: name,
    place_name: name !== address ? `${name} - ${address}` : address,
    center: [item.lng, item.lat],
    distance: hasUserPos ? formatDistance(dist) : undefined,
    distanceMeters: dist,
    category,
    blocked: hasUserPos && dist > MAX_DISTANCE_M,
  };
}

export const useGoogleSearch = () => {
  const [results, setResults] = useState<GooglePlace[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string, proximity?: [number, number]) => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const hasUserPos = !!proximity;
      const lat = proximity ? proximity[1] : -15.7801;
      const lng = proximity ? proximity[0] : -47.9292;
      console.log("[useGoogleSearch] searching:", q, { lat, lng });
      const googleResults = await searchGooglePlaces(q, lat, lng);
      console.log("[useGoogleSearch] got", googleResults.length, "results");
      const places = googleResults
        .map((r) => googleToPlace(r, lat, lng, hasUserPos))
        .sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0))
        .slice(0, 10);
      setResults(places);
    } catch (err: any) {
      console.error("[useGoogleSearch] Error:", err?.message || err);
      setResults([]);
      try {
        const { toast } = await import("sonner");
        toast.error(`Erro na busca: ${err?.message || "verifique sua conexão"}`);
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, loading, search, clear };
};
