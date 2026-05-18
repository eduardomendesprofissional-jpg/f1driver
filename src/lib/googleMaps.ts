/// <reference types="google.maps" />
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { supabase } from "@/integrations/supabase/client";

export const GOOGLE_MAPS_KEY = "AIzaSyDE1pRwXHYINMp6fmtA9JTrvgNzxn5D5MQ";

let loadPromise: Promise<void> | null = null;
let optionsSet = false;

export const loadGoogleMaps = (): Promise<void> => {
  if (!optionsSet) {
    setOptions({ key: GOOGLE_MAPS_KEY, v: "weekly", language: "pt-BR", region: "BR" });
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

// ============ Proxy helper ============

async function callProxy<T = any>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("geo-proxy", { body: payload });
  if (error) throw new Error(error.message || "geo-proxy invoke failed");
  if (!data?.ok) throw new Error(`geo-proxy upstream ${data?.status || "error"}`);
  return data.data as T;
}

export interface GooglePlaceResult {
  id: string;
  displayName: string;
  formattedAddress: string;
  shortFormattedAddress?: string;
  lat: number;
  lng: number;
  types?: string[];
}

function mapGooglePlaces(data: any): GooglePlaceResult[] {
  return (data?.places || []).map((p: any) => ({
    id: p.id,
    displayName: p.displayName?.text || "",
    formattedAddress: p.formattedAddress || "",
    shortFormattedAddress: p.shortFormattedAddress,
    lat: p.location?.latitude || 0,
    lng: p.location?.longitude || 0,
    types: p.types,
  }));
}

function mapNominatim(arr: any[]): GooglePlaceResult[] {
  return (arr || []).map((p: any) => {
    const name = p.name || (p.display_name?.split(",")[0] ?? "");
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
}

/** Text search com fallback Nominatim — via proxy */
export async function searchGooglePlaces(
  query: string,
  lat: number,
  lng: number,
  radiusMeters = 35000,
): Promise<GooglePlaceResult[]> {
  try {
    const data = await callProxy({ op: "google_text", query, lat, lng, radiusMeters });
    const places = mapGooglePlaces(data);
    if (places.length > 0) return places;
    console.warn("[geo-proxy] Google vazio, tentando Nominatim");
  } catch (err) {
    console.warn("[geo-proxy] Google falhou, tentando Nominatim:", err);
  }
  try {
    const data = await callProxy<any[]>({ op: "nominatim_search", query, lat, lng, radiusMeters });
    return mapNominatim(data);
  } catch (err) {
    console.error("[geo-proxy] Nominatim falhou:", err);
    return [];
  }
}

/** Nearby search — via proxy */
export async function nearbyGooglePlaces(
  type: string,
  lat: number,
  lng: number,
  radiusMeters = 5000,
): Promise<GooglePlaceResult[]> {
  try {
    const data = await callProxy({ op: "google_nearby", type, lat, lng, radiusMeters });
    return mapGooglePlaces(data);
  } catch (err) {
    console.error("[geo-proxy] nearby falhou:", err);
    return [];
  }
}

/** Reverse geocode com fallback Nominatim — via proxy */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const data = await callProxy<any>({ op: "google_reverse", lat, lng });
    const addr = data?.results?.[0]?.formatted_address;
    if (addr) return addr;
  } catch {}
  try {
    const data = await callProxy<any>({ op: "nominatim_reverse", lat, lng });
    return data?.display_name || "Local selecionado";
  } catch {
    return "Local selecionado";
  }
}

export interface GoogleDirectionsResult {
  distance_m: number;
  duration_s: number;
  steps?: Array<{ instruction: string; distance_m: number; duration_s: number; maneuver?: string }>;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Directions — via proxy */
export async function getDirections(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  withSteps = false,
): Promise<GoogleDirectionsResult | null> {
  try {
    const data = await callProxy<any>({ op: "google_directions", originLat, originLng, destLat, destLng });
    const leg = data?.routes?.[0]?.legs?.[0];
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
