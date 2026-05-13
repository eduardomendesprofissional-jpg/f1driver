import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useDriverLocation = (online: boolean) => {
  const { user } = useAuth();
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<{ lat: number; lng: number; t: number } | null>(null);

  const pushLocation = useCallback(async (lat: number, lng: number) => {
    if (!user) return;
    await supabase.from("driver_locations").upsert(
      {
        driver_id: user.id,
        lat,
        lng,
        online: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "driver_id" }
    );
  }, [user]);

  const goOffline = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("driver_locations")
      .upsert(
        { driver_id: user.id, lat: 0, lng: 0, online: false, updated_at: new Date().toISOString() },
        { onConflict: "driver_id" }
      );
  }, [user]);

  useEffect(() => {
    if (!online || !user) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (user) goOffline();
      return;
    }

    if (!navigator.geolocation) return;

    // Initial push
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        lastSentRef.current = { lat, lng, t: Date.now() };
        pushLocation(lat, lng);
      },
      (err) => console.error("Erro localização inicial:", err),
      { enableHighAccuracy: true, timeout: 15000 }
    );

    // Watch and throttle: send if moved > 25m OR >10s since last push
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        if (accuracy && accuracy > 250) return;
        const now = Date.now();
        const last = lastSentRef.current;
        if (last) {
          const R = 6371000;
          const dLat = ((lat - last.lat) * Math.PI) / 180;
          const dLng = ((lng - last.lng) * Math.PI) / 180;
          const x = Math.sin(dLat / 2) ** 2 +
            Math.cos((last.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
          const dist = R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
          if (dist < 25 && now - last.t < 10000) return;
        }
        lastSentRef.current = { lat, lng, t: now };
        pushLocation(lat, lng);
      },
      (err) => console.error("watchPosition err:", err),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [online, user, pushLocation, goOffline]);

  return { goOffline };
};
