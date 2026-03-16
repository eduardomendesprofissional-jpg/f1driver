import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { requestNotificationPermission, onForegroundMessage } from "@/lib/firebase";
import { toast } from "sonner";

export const usePushNotifications = (enabled: boolean) => {
  const { user } = useAuth();

  const registerToken = useCallback(async () => {
    if (!user) return;

    const token = await requestNotificationPermission();
    if (!token) return;

    // Upsert token in device_tokens table using raw rpc to avoid type issues
    const { error } = await supabase
      .from("device_tokens" as any)
      .upsert(
        { user_id: user.id, token, platform: "web", updated_at: new Date().toISOString() } as any,
        { onConflict: "user_id,token" }
      );

    if (error) {
      console.error("Erro ao salvar token FCM:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!enabled || !user) return;

    registerToken();

    // Listen for foreground messages
    onForegroundMessage((payload) => {
      toast.info(payload.notification?.title || "Nova notificação", {
        description: payload.notification?.body,
      });
    });
  }, [enabled, user, registerToken]);

  return { registerToken };
};
