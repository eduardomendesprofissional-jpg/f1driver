import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * Permite que a mesma conta opere como passageiro e motorista.
 * Mantém flags `tem_perfil_passageiro` / `tem_perfil_motorista` em profiles.
 */
export const useProfileSwitch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<"passageiro" | "motorista" | null>(null);
  const [hasPassenger, setHasPassenger] = useState(false);
  const [hasDriver, setHasDriver] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("tipo, tem_perfil_passageiro, tem_perfil_motorista")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setTipo(data.tipo as any);
        setHasPassenger(!!data.tem_perfil_passageiro || data.tipo === "passageiro");
        setHasDriver(!!data.tem_perfil_motorista || data.tipo === "motorista");
      }
    })();
  }, [user]);

  const switchTo = useCallback(async (target: "passageiro" | "motorista") => {
    if (!user) return;
    setLoading(true);
    try {
      const updates: Record<string, any> = { tipo: target };
      if (target === "passageiro") updates.tem_perfil_passageiro = true;
      else updates.tem_perfil_motorista = true;

      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) throw error;

      await supabase.auth.updateUser({ data: { tipo: target } });

      toast.success(target === "motorista" ? "Modo motorista ativado" : "Modo passageiro ativado");
      navigate(target === "motorista" ? "/driver" : "/passenger", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Erro ao trocar perfil.");
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  return { tipo, hasPassenger, hasDriver, switchTo, loading };
};
