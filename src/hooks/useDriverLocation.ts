import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useDriverLocation = (online: boolean) => {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateLocation = useCallback(async () => {
    if (!user) return;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      );

      const { latitude: lat, longitude: lng } = pos.coords;

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
    } catch (err) {
      console.error("Erro ao atualizar localização:", err);
    }
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
    if (online && user) {
      updateLocation();
      intervalRef.current = setInterval(updateLocation, 15000); // every 15s
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (user) goOffline();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [online, user, updateLocation, goOffline]);

  return { updateLocation, goOffline };
};
