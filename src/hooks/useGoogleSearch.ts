import { useState, useCallback } from "react";
import { GOOGLE_MAPS_KEY_RAW } from "@/lib/google-maps";

export interface GooglePlace {
  id: string;
  place_name: string;
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
        input: query,
        key: GOOGLE_MAPS_KEY_RAW,
        language: "pt-BR",
        components: "country:br",
      });
      if (proximity) {
        params.set("location", `${proximity[1]},${proximity[0]}`);
        params.set("radius", "50000");
      }

      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
      );
      const data = await res.json();

      if (data.predictions?.length) {
        // Get details for each prediction
        const places: GooglePlace[] = [];
        for (const pred of data.predictions.slice(0, 5)) {
          const detailRes = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${pred.place_id}&fields=geometry,formatted_address&key=${GOOGLE_MAPS_KEY_RAW}&language=pt-BR`
          );
          const detailData = await detailRes.json();
          const loc = detailData.result?.geometry?.location;
          if (loc) {
            places.push({
              id: pred.place_id,
              place_name: pred.description,
              center: [loc.lng, loc.lat],
            });
          }
        }
        setResults(places);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, loading, search, clear };
};
