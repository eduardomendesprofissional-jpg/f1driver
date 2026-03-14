import { useState, useCallback } from "react";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZmlkcml2ZXIiLCJhIjoiY21tcGJjbmtzMG9wZjJ3cHNsZ3oxaTYzZiJ9.TmAp9KCag5_-gQ0FsgOyJw";

export interface MapboxPlace {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}

export const useMapboxSearch = () => {
  const [results, setResults] = useState<MapboxPlace[]>([]);
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
        language: "pt-BR",
        country: "BR",
        limit: "5",
        types: "address,poi,place,locality,neighborhood",
      });
      if (proximity) {
        params.set("proximity", `${proximity[0]},${proximity[1]}`);
      }
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`
      );
      const data = await res.json();
      setResults(
        (data.features || []).map((f: any) => ({
          id: f.id,
          place_name: f.place_name,
          center: f.center,
        }))
      );
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, loading, search, clear };
};
