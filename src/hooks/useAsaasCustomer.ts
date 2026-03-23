import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const isValidAsaasId = (id: string | null | undefined): id is string =>
  !!id && id.startsWith("cus_");

/**
 * Hook that ensures the current user has a valid asaas_customer_id.
 * Rejects mock/test values — only accepts IDs starting with "cus_".
 */
export const useAsaasCustomer = () => {
  const { user } = useAuth();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

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
      setCustomerId(isValidAsaasId(id) ? id : null);
      setLoading(false);
    };
    fetchId();
  }, [user]);

  const ensureCustomer = useCallback(async (): Promise<string | null> => {
    if (isValidAsaasId(customerId)) return customerId;
    if (!user) return null;

    setCreating(true);
    try {
      // Re-check DB
      const { data: profile } = await supabase
        .from("profiles")
        .select("asaas_customer_id, nome, cpf")
        .eq("id", user.id)
        .single();

      if (isValidAsaasId(profile?.asaas_customer_id)) {
        setCustomerId(profile.asaas_customer_id);
        return profile.asaas_customer_id;
      }

      if (!profile?.nome || !profile?.cpf) {
        toast.error("Preencha seu nome e CPF no perfil antes de continuar.");
        return null;
      }

      const { data, error } = await supabase.functions.invoke("asaas-payment", {
        body: {
          action: "sync",
          user_id: user.id,
        },
      });

      if (error || !data?.success || !isValidAsaasId(data?.asaas_customer_id)) {
        toast.error(data?.error || "Erro: Perfil financeiro não sincronizado.");
        return null;
      }

      setCustomerId(data.asaas_customer_id);
      toast.success("Cadastro de pagamento criado!");
      return data.asaas_customer_id;
    } finally {
      setCreating(false);
    }
  }, [customerId, user]);

  return { customerId, loading, creating, ensureCustomer };
};

/** Standalone validation for use outside the hook (e.g. RideActive) */
export { isValidAsaasId };
