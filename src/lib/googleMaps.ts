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

/** Nominatim (OpenStreetMap) — fallback search */
export async function searchNominatim(
  query: string,
  lat: number,
  lng: number,
  radiusMeters = 100000,
): Promise<GooglePlaceResult[]> {
  // viewbox aprox baseado no raio (1° lat ~ 111km)
  const dLat = radiusMeters / 111000;
  const dLng = radiusMeters / (111000 * Math.cos((lat * Math.PI) / 180));
  const viewbox = `${lng - dLng},${lat - dLat},${lng + dLng},${lat + dLat}`;
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query,
  )}&limit=10&accept-language=pt-BR&countrycodes=br&viewbox=${viewbox}&bounded=0&addressdetails=1`;
  try {
    const res = await fetch(url, {
      headers: { "Accept-Language": "pt-BR" },
    });
    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
    const data = await res.json();
    return (data || []).map((p: any) => {
      const name = p.name || p.display_name?.split(",")[0] || "";
      return {
        id: `osm-${p.osm_type}-${p.osm_id}`,
        displayName: name,
        formattedAddress: p.display_name || "",
        shortFormattedAddress: p.display_name,
        lat: parseFloat(p.lat),
        lng: parseFloat(p.lon),
        types: p.type ? [p.type] : ["geocode"],
      };
    });
  } catch (err) {
    console.error("[Nominatim] fallback failed:", err);
    return [];
  }
}

/** Places API (New) — Text Search com fallback Nominatim */
export async function searchGooglePlaces(
  query: string,
  lat: number,
  lng: number,
  radiusMeters = 100000,
): Promise<GooglePlaceResult[]> {
  try {
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
    if (!res.ok) {
      console.warn(`[Google Places] HTTP ${res.status} — usando Nominatim`);
      return await searchNominatim(query, lat, lng, radiusMeters);
    }
    const data = await res.json();
    const places = (data.places || []).map((p: any) => ({
      id: p.id,
      displayName: p.displayName?.text || "",
      formattedAddress: p.formattedAddress || "",
      shortFormattedAddress: p.shortFormattedAddress,
      lat: p.location?.latitude || 0,
      lng: p.location?.longitude || 0,
      types: p.types,
    }));
    if (places.length === 0) {
      console.warn("[Google Places] vazio — tentando Nominatim");
      return await searchNominatim(query, lat, lng, radiusMeters);
    }
    return places;
  } catch (err) {
    console.error("[Google Places] erro — fallback Nominatim:", err);
    return await searchNominatim(query, lat, lng, radiusMeters);
  }
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

/** Geocoding API — reverse com fallback Nominatim */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_KEY}&language=pt-BR&region=BR`,
    );
    const data = await res.json();
    const addr = data.results?.[0]?.formatted_address;
    if (addr) return addr;
  } catch {}
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=pt-BR`,
      { headers: { "Accept-Language": "pt-BR" } },
    );
    const data = await res.json();
    return data?.display_name || "Local selecionado";
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
