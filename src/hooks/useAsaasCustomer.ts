import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const isValidAsaasId = (id: string | null | undefined): id is string =>
  !!id && id.startsWith("cus_");

/**
 * Hook that ensures the current user has a valid asaas_customer_id.
 * - `syncing`: true while waiting for backend to populate asaas_customer_id
 * - `ensureCustomer()`: triggers sync if needed, waits for result
 * - Listens via Realtime for background DB updates from the trigger
 */
export const useAsaasCustomer = () => {
  const { user } = useAuth();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch on mount + subscribe to realtime updates
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchId = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("asaas_customer_id")
        .eq("id", user.id)
        .single();
      const id = data?.asaas_customer_id ?? null;
      if (isValidAsaasId(id)) {
        setCustomerId(id);
        setSyncing(false);
      } else {
        setCustomerId(null);
      }
      setLoading(false);
    };
    fetchId();

    // Listen for profile updates (trigger may set asaas_customer_id in background)
    const channel = supabase
      .channel(`asaas-sync-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          const newId = (payload.new as any)?.asaas_customer_id;
          if (isValidAsaasId(newId)) {
            setCustomerId(newId);
            setSyncing(false);
          }
        }
      )
      .subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const ensureCustomer = useCallback(async (): Promise<string | null> => {
    if (isValidAsaasId(customerId)) return customerId;
    if (!user) return null;

    setSyncing(true);
    try {
      // Re-check DB (may have been set by trigger already)
      const { data: profile } = await supabase
        .from("profiles")
        .select("asaas_customer_id, nome, cpf")
        .eq("id", user.id)
        .single();

      if (isValidAsaasId(profile?.asaas_customer_id)) {
        setCustomerId(profile.asaas_customer_id);
        setSyncing(false);
        return profile.asaas_customer_id;
      }

      if (!profile?.nome || !profile?.cpf) {
        toast.error("Preencha seu nome e CPF no perfil antes de continuar.");
        setSyncing(false);
        return null;
      }

      // Call sync action
      const { data, error } = await supabase.functions.invoke("asaas-payment", {
        body: { action: "sync", user_id: user.id },
      });

      if (error || !data?.success || !isValidAsaasId(data?.asaas_customer_id)) {
        toast.error(data?.error || "Erro: Perfil financeiro não sincronizado.");
        setSyncing(false);
        return null;
      }

      setCustomerId(data.asaas_customer_id);
      setSyncing(false);
      return data.asaas_customer_id;
    } catch {
      setSyncing(false);
      return null;
    }
  }, [customerId, user]);

  return { customerId, loading, syncing, ensureCustomer };
};

export { isValidAsaasId };
