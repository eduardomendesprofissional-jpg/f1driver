/// <reference types="google.maps" />
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

export const GOOGLE_MAPS_KEY = "AIzaSyDE1pRwXHYINMp6fmtA9JTrvgNzxn5D5MQ";

let loadPromise: Promise<void> | null = null;
let optionsSet = false;

export const loadGoogleMaps = (): Promise<void> => {
  if (!optionsSet) {
    setOptions({
      key: GOOGLE_MAPS_KEY,
      v: "weekly",
      language: "pt-BR",
      region: "BR",
    });
    optionsSet = true;
  }
  if (!loadPromise) {
    loadPromise = (async () => {
      await importLibrary("maps");
      await importLibrary("places");
      await importLibrary("visualization");
      await importLibrary("geometry");
      await importLibrary("marker");
    })();
  }
  return loadPromise;
};

// Custom dark map style (parecido com noite do Uber/Mapbox dark)
export const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d1d5db" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a2a" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a1a" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a3a3a" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4b5563" }] },
];

// ============ REST helpers ============

export interface GooglePlaceResult {
  id: string;
  displayName: string;
  formattedAddress: string;
  shortFormattedAddress?: string;
  lat: number;
  lng: number;
  types?: string[];
}

/** Places API (New) — Text Search */
export async function searchGooglePlaces(
  query: string,
  lat: number,
  lng: number,
  radiusMeters = 100000,
): Promise<GooglePlaceResult[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.location,places.types",
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "pt-BR",
      regionCode: "BR",
      maxResultCount: 10,
      locationBias: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters,
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`Google Places error: ${res.status}`);
  const data = await res.json();
  return (data.places || []).map((p: any) => ({
    id: p.id,
    displayName: p.displayName?.text || "",
    formattedAddress: p.formattedAddress || "",
    shortFormattedAddress: p.shortFormattedAddress,
    lat: p.location?.latitude || 0,
    lng: p.location?.longitude || 0,
    types: p.types,
  }));
}

/** Places API (New) — Nearby Search by type */
export async function nearbyGooglePlaces(
  type: string,
  lat: number,
  lng: number,
  radiusMeters = 5000,
): Promise<GooglePlaceResult[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.location,places.types",
    },
    body: JSON.stringify({
      includedTypes: [type],
      maxResultCount: 10,
      languageCode: "pt-BR",
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters,
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`Google Nearby error: ${res.status}`);
  const data = await res.json();
  return (data.places || []).map((p: any) => ({
    id: p.id,
    displayName: p.displayName?.text || "",
    formattedAddress: p.formattedAddress || "",
    shortFormattedAddress: p.shortFormattedAddress,
    lat: p.location?.latitude || 0,
    lng: p.location?.longitude || 0,
    types: p.types,
  }));
}

/** Geocoding API — reverse */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_KEY}&language=pt-BR&region=BR`,
    );
    const data = await res.json();
    return data.results?.[0]?.formatted_address || "Local selecionado";
  } catch {
    return "Local selecionado";
  }
}

export interface GoogleDirectionsResult {
  distance_m: number;
  duration_s: number;
  steps?: Array<{
    instruction: string;
    distance_m: number;
    duration_s: number;
    maneuver?: string;
  }>;
}

/** Directions API — driving */
export async function getDirections(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  withSteps = false,
): Promise<GoogleDirectionsResult | null> {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=driving&language=pt-BR&region=BR&key=${GOOGLE_MAPS_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const leg = data.routes?.[0]?.legs?.[0];
    if (!leg) return null;
    const result: GoogleDirectionsResult = {
      distance_m: leg.distance?.value || 0,
      duration_s: leg.duration?.value || 0,
    };
    if (withSteps && leg.steps) {
      result.steps = leg.steps.map((s: any) => ({
        instruction: stripHtml(s.html_instructions || ""),
        distance_m: s.distance?.value || 0,
        duration_s: s.duration?.value || 0,
        maneuver: s.maneuver,
      }));
    }
    return result;
  } catch {
    return null;
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
