import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * Hook that ensures the current user has a valid asaas_customer_id.
 * - On mount, checks if the profile already has one.
 * - `ensureCustomer()` creates the customer in Asaas if missing,
 *   saves it in profiles, and returns the id.
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
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("asaas_customer_id")
        .eq("id", user.id)
        .single();
      setCustomerId(data?.asaas_customer_id ?? null);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const ensureCustomer = useCallback(async (): Promise<string | null> => {
    if (customerId) return customerId;
    if (!user) return null;

    setCreating(true);
    try {
      // Re-check DB (may have been set by another tab/flow)
      const { data: profile } = await supabase
        .from("profiles")
        .select("asaas_customer_id, nome, cpf")
        .eq("id", user.id)
        .single();

      if (profile?.asaas_customer_id) {
        setCustomerId(profile.asaas_customer_id);
        return profile.asaas_customer_id;
      }

      if (!profile?.nome || !profile?.cpf) {
        toast.error("Preencha seu nome e CPF no perfil antes de continuar.");
        return null;
      }

      const { data, error } = await supabase.functions.invoke("asaas-payment", {
        body: {
          action: "create_customer",
          user_id: user.id,
          name: profile.nome,
          cpf_cnpj: profile.cpf,
          email: user.email,
        },
      });

      if (error || !data?.success) {
        toast.error(data?.error || "Erro ao criar cadastro de pagamento.");
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
