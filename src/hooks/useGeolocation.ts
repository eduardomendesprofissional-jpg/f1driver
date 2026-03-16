import { useState, useEffect, useCallback } from "react";

export interface GeoPosition {
  lat: number;
  lng: number;
}

type PermissionStatus = "prompt" | "granted" | "denied" | "unsupported";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZmlkcml2ZXIiLCJhIjoiY21tcGJjbmtzMG9wZjJ3cHNsZ3oxaTYzZiJ9.TmAp9KCag5_-gQ0FsgOyJw";

export const useGeolocation = () => {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [endereco, setEndereco] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionStatus>("prompt");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check permission status on mount
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
    }).catch(() => {
      // permissions API not supported, try requesting directly
    });
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=pt-BR&limit=1`
      );
      const data = await res.json();
      return data.features?.[0]?.place_name || "Sua localização";
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

  // Watch position for continuous updates
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
