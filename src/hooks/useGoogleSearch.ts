import { useState, useCallback } from "react";
import { loadMapsLibrary } from "@/lib/google-maps";

export interface GooglePlace {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}

let autocompleteService: google.maps.places.AutocompleteService | null = null;
let placesService: google.maps.places.PlacesService | null = null;
let dummyDiv: HTMLDivElement | null = null;

const ensureServices = async () => {
  await loadMapsLibrary();
  if (!autocompleteService) {
    autocompleteService = new google.maps.places.AutocompleteService();
  }
  if (!placesService) {
    if (!dummyDiv) {
      dummyDiv = document.createElement("div");
    }
    placesService = new google.maps.places.PlacesService(dummyDiv);
  }
};

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
      await ensureServices();

      const request: google.maps.places.AutocompletionRequest = {
        input: query,
        componentRestrictions: { country: "br" },
      };
      if (proximity) {
        request.location = new google.maps.LatLng(proximity[1], proximity[0]);
        request.radius = 50000;
      }

      autocompleteService!.getPlacePredictions(request, (predictions, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
          setResults([]);
          setLoading(false);
          return;
        }

        const places: GooglePlace[] = [];
        let completed = 0;
        const total = Math.min(predictions.length, 5);

        predictions.slice(0, 5).forEach((pred) => {
          placesService!.getDetails(
            { placeId: pred.place_id, fields: ["geometry", "formatted_address"] },
            (place, detailStatus) => {
              completed++;
              if (detailStatus === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                places.push({
                  id: pred.place_id,
                  place_name: pred.description,
                  center: [place.geometry.location.lng(), place.geometry.location.lat()],
                });
              }
              if (completed === total) {
                setResults(places);
                setLoading(false);
              }
            }
          );
        });
      });
    } catch {
      setResults([]);
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, loading, search, clear };
};
