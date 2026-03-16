import { useState, useCallback } from "react";
import { MAPBOX_TOKEN } from "@/lib/mapbox";

export interface GooglePlace {
  id: string;
  place_name: string;
  text: string;
  center: [number, number]; // [lng, lat]
  distance?: string;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
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
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        language: "pt",
        country: "BR",
        limit: "5",
        types: "poi,address,place",
      });
      if (proximity) {
        params.set("proximity", `${proximity[0]},${proximity[1]}`);
      }

      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
      );
      const data = await res.json();

      const places: GooglePlace[] = (data.features || []).map((f: any) => {
        const center = f.center as [number, number];
        const dist = proximity
          ? haversineDistance(proximity[1], proximity[0], center[1], center[0])
          : undefined;
        return {
          id: f.id,
          text: f.text || "",
          place_name: f.place_name,
          center,
          distance: dist !== undefined ? formatDistance(dist) : undefined,
        };
      });
      // Sort by distance if proximity available
      if (proximity) {
        places.sort((a, b) => {
          const dA = haversineDistance(proximity[1], proximity[0], a.center[1], a.center[0]);
          const dB = haversineDistance(proximity[1], proximity[0], b.center[1], b.center[0]);
          return dA - dB;
        });
      }
      setResults(places);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, loading, search, clear };
};
