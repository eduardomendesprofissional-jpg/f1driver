import { useEffect, useState } from "react";
import { nearbyGooglePlaces, GooglePlaceResult } from "@/lib/googleMaps";

export interface SuggestedPlace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: "airport" | "bus_station" | "shopping_mall" | "hospital";
  categoryLabel: string;
  icon: "plane" | "bus" | "shopping" | "hospital";
}

const CATEGORIES: Array<{
  type: SuggestedPlace["category"];
  label: string;
  icon: SuggestedPlace["icon"];
}> = [
  { type: "airport", label: "Aeroporto", icon: "plane" },
  { type: "bus_station", label: "Rodoviária", icon: "bus" },
  { type: "shopping_mall", label: "Shopping", icon: "shopping" },
  { type: "hospital", label: "Hospital", icon: "hospital" },
];

export const useSuggestedPlaces = (
  position: { lat: number; lng: number } | null,
) => {
  const [places, setPlaces] = useState<SuggestedPlace[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!position) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const results = await Promise.all(
          CATEGORIES.map(async (cat) => {
            try {
              const res = await nearbyGooglePlaces(cat.type, position.lat, position.lng, 15000);
              const top = res[0];
              if (!top) return null;
              return {
                id: top.id || `${cat.type}-${top.lat}-${top.lng}`,
                name: top.displayName || cat.label,
                address: top.formattedAddress || top.shortFormattedAddress || "",
                lat: top.lat,
                lng: top.lng,
                category: cat.type,
                categoryLabel: cat.label,
                icon: cat.icon,
              } as SuggestedPlace;
            } catch {
              return null;
            }
          }),
        );
        if (!cancelled) setPlaces(results.filter(Boolean) as SuggestedPlace[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [position?.lat, position?.lng]);

  return { places, loading };
};
