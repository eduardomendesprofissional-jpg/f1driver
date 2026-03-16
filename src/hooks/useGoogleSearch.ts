import { useState, useCallback } from "react";
import { MAPBOX_TOKEN } from "@/lib/mapbox";

export interface GooglePlace {
  id: string;
  place_name: string;
  text: string; // establishment/POI name
  center: [number, number]; // [lng, lat]
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

      const places: GooglePlace[] = (data.features || []).map((f: any) => ({
        id: f.id,
        text: f.text || "",
        place_name: f.place_name,
        center: f.center as [number, number],
      }));
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
