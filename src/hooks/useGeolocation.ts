import { useState, useEffect, useCallback, useRef } from "react";
import { reverseGeocode } from "@/lib/googleMaps";

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
  const [showGpsModal, setShowGpsModal] = useState(false);
  const initialRequestDone = useRef(false);

  const doReverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      return await reverseGeocode(lat, lng);
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

    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        setPermission(result.state as PermissionStatus);
        result.onchange = () => setPermission(result.state as PermissionStatus);
        if (result.state === "granted" && !initialRequestDone.current) {
          initialRequestDone.current = true;
          requestLocation();
        } else if (result.state === "prompt" && !initialRequestDone.current) {
          // Show justification modal before requesting
          setShowGpsModal(true);
        }
      }).catch(() => {
        if (!initialRequestDone.current) {
          setShowGpsModal(true);
        }
      });
    } else {
      // iOS Safari fallback — show modal first
      if (!initialRequestDone.current) {
        setShowGpsModal(true);
      }
    }
  }, [requestLocation]);

  const acceptGpsModal = useCallback(() => {
    setShowGpsModal(false);
    if (!initialRequestDone.current) {
      initialRequestDone.current = true;
      requestLocation();
    }
  }, [requestLocation]);

  const dismissGpsModal = useCallback(() => {
    setShowGpsModal(false);
  }, []);

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

  return { position, endereco, permission, loading, error, requestLocation, showGpsModal, acceptGpsModal, dismissGpsModal };
};
