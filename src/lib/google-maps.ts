import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

const GOOGLE_MAPS_KEY = "AIzaSyATM-_dHRXjCsdXyQYdN5KTg3Ile2DWzn0";

let initialized = false;

export const initGoogleMaps = () => {
  if (!initialized) {
    setOptions({
      key: GOOGLE_MAPS_KEY,
      v: "weekly",
      libraries: ["places", "geometry"],
      language: "pt-BR",
      region: "BR",
    });
    initialized = true;
  }
};

export const loadMapsLibrary = async () => {
  initGoogleMaps();
  return importLibrary("maps") as Promise<google.maps.MapsLibrary>;
};

export const loadMarkerLibrary = async () => {
  initGoogleMaps();
  return importLibrary("marker") as Promise<google.maps.MarkerLibrary>;
};

export const GOOGLE_MAPS_KEY_RAW = GOOGLE_MAPS_KEY;
