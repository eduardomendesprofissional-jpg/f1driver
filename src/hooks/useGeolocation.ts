import { useState, useEffect, useCallback } from "react";

export interface GeoPosition {
  lat: number;
  lng: number;
}

type PermissionStatus = "prompt" | "granted" | "denied" | "unsupported";

export const useGeolocation = () => {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [endereco, setEndereco] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionStatus>("prompt");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setPermission("unsupported");
      return;
    }
    navigator.permissions?.query({ name: "geolocation" }).then((result) => {
      setPermission(result.state as PermissionStatus);
      result.onchange = () => setPermission(result.state as PermissionStatus);
      if (result.state === "granted") {
        requestLocation();
      }
    }).catch(() => {});
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const { loadMapsLibrary } = await import("@/lib/google-maps");
      await loadMapsLibrary();
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      return response.results?.[0]?.formatted_address || "Sua localização";
    } catch {
      return "Sua localização";
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setPermission("unsupported");
      setError("Geolocalização não suportada neste navegador.");
      return;
    }
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPosition({ lat, lng });
        setPermission("granted");
        const addr = await reverseGeocode(lat, lng);
        setEndereco(addr);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermission("denied");
          setError("Permissão de localização negada. Habilite nas configurações do navegador.");
        } else {
          setError("Não foi possível obter sua localização. Tente novamente.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [reverseGeocode]);

  useEffect(() => {
    if (permission !== "granted" || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPosition({ lat, lng });
        const addr = await reverseGeocode(lat, lng);
        setEndereco(addr);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [permission, reverseGeocode]);

  return { position, endereco, permission, loading, error, requestLocation };
};
