import { useState, useEffect, useCallback, useRef } from "react";
import { TOMTOM_KEY } from "@/lib/tomtom";

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
  const initialRequestDone = useRef(false);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lng}.json?key=${TOMTOM_KEY}&language=pt-BR`
      );
      const data = await res.json();
      const addr = data.addresses?.[0]?.address;
      if (addr) {
        return addr.freeformAddress || addr.streetName || "Sua localização";
      }
      return "Sua localização";
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
        setError(null);
        const addr = await reverseGeocode(lat, lng);
        setEndereco(addr);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermission("denied");
          setError("Permissão de localização negada. Habilite nas configurações do navegador.");
        } else if (err.code === err.TIMEOUT) {
          setError("Tempo esgotado ao obter localização. Tente novamente.");
          // Don't change permission on timeout — user may have granted it
        } else {
          setError("Não foi possível obter sua localização. Tente novamente.");
        }
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 60000 }
    );
  }, [reverseGeocode]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setPermission("unsupported");
      return;
    }

    // navigator.permissions.query is not supported on iOS Safari for geolocation
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setPermission(result.state as PermissionStatus);
        result.onchange = () => setPermission(result.state as PermissionStatus);
        if (result.state === "granted" && !initialRequestDone.current) {
          initialRequestDone.current = true;
          requestLocation();
        }
      }).catch(() => {
        // Fallback: permissions API not available, try requesting directly
        if (!initialRequestDone.current) {
          initialRequestDone.current = true;
          requestLocation();
        }
      });
    } else {
      // iOS Safari fallback — just try to get location
      if (!initialRequestDone.current) {
        initialRequestDone.current = true;
        requestLocation();
      }
    }
  }, [requestLocation]);

  // Poll position every 15 seconds for real-time updates (reduced from 10s)
  useEffect(() => {
    if (permission !== "granted" || !navigator.geolocation) return;

    const updatePosition = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setPosition({ lat, lng });
          const addr = await reverseGeocode(lat, lng);
          setEndereco(addr);
        },
        () => {},
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 15000 }
      );
    };

    const intervalId = setInterval(updatePosition, 15000);
    return () => clearInterval(intervalId);
  }, [permission, reverseGeocode]);

  return { position, endereco, permission, loading, error, requestLocation };
};
