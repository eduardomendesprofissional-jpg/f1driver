import { Loader } from "@googlemaps/js-api-loader";

const GOOGLE_MAPS_KEY = "AIzaSyATM-_dHRXjCsdXyQYdN5KTg3Ile2DWzn0";

let loaderInstance: Loader | null = null;

export const getGoogleMapsLoader = () => {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: GOOGLE_MAPS_KEY,
      version: "weekly",
      libraries: ["places", "geometry", "marker"],
      language: "pt-BR",
      region: "BR",
    });
  }
  return loaderInstance;
};

export const GOOGLE_MAPS_KEY_RAW = GOOGLE_MAPS_KEY;
