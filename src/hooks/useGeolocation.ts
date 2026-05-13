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
        const addr = await doReverseGeocode(lat, lng);
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
  }, [doReverseGeocode]);

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

  // Real-time position via watchPosition. Re-geocode only when moved > 60m
  // to avoid spamming the Geocoding API.
  useEffect(() => {
    if (permission !== "granted" || !navigator.geolocation) return;

    let lastGeo: { lat: number; lng: number } | null = null;
    const distM = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
      const R = 6371000;
      const dLat = ((b.lat - a.lat) * Math.PI) / 180;
      const dLng = ((b.lng - a.lng) * Math.PI) / 180;
      const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    };

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        // Ignore very inaccurate fixes (> 200m) to evitar marker pulando
        if (accuracy && accuracy > 200) return;
        const next = { lat, lng };
        setPosition(next);
        if (!lastGeo || distM(lastGeo, next) > 60) {
          lastGeo = next;
          const addr = await doReverseGeocode(lat, lng);
          setEndereco(addr);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setPermission("denied");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [permission, doReverseGeocode]);

  return { position, endereco, permission, loading, error, requestLocation, showGpsModal, acceptGpsModal, dismissGpsModal };
};
