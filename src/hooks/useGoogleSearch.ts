import { useState, useCallback } from "react";
import { searchFoursquarePlaces, FoursquarePlace } from "@/lib/foursquare";

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
      // proximity is [lng, lat], Foursquare needs (lat, lng)
      const lat = proximity ? proximity[1] : -15.7801;
      const lng = proximity ? proximity[0] : -47.9292;

      const fsqResults = await searchFoursquarePlaces(query, lat, lng);

      const places: GooglePlace[] = fsqResults
        .filter((p: FoursquarePlace) => p.geocodes?.main)
        .map((p: FoursquarePlace) => {
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
