import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface DriverEnvio {
  id: string;
  descricao: string;
  tamanho: string;
  peso_kg: number;
  coleta_endereco: string;
  entrega_endereco: string;
  distancia_km: number | null;
  valor: number | null;
  forma_pagamento: string;
  status: string;
  created_at: string;
}

export const useDriverEnvios = (online: boolean) => {
  const { user } = useAuth();
  const [pendingEnvios, setPendingEnvios] = useState<DriverEnvio[]>([]);
  const [myEnvios, setMyEnvios] = useState<DriverEnvio[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEnvios = useCallback(async () => {
    if (!user || !online) return;
    setLoading(true);

    // Fetch pending (unassigned) envios
    const { data: pending } = await supabase
      .from("envios" as any)
      .select("*")
      .eq("status", "pendente")
      .is("motorista_id", null)
      .order("created_at", { ascending: false })
      .limit(20);

    // Fetch envios assigned to this driver (active ones)
    const { data: mine } = await supabase
      .from("envios" as any)
      .select("*")
      .eq("motorista_id", user.id)
      .in("status", ["pendente", "coletado"])
      .order("created_at", { ascending: false });

    setPendingEnvios((pending as unknown as DriverEnvio[]) || []);
    setMyEnvios((mine as unknown as DriverEnvio[]) || []);
    setLoading(false);
  }, [user, online]);

  useEffect(() => {
    if (!online || !user) {
      setPendingEnvios([]);
      setMyEnvios([]);
      return;
    }

    fetchEnvios();

    // Poll every 15 seconds
    const interval = setInterval(fetchEnvios, 15000);
    return () => clearInterval(interval);
  }, [online, user, fetchEnvios]);

  const acceptEnvio = async (envioId: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from("envios" as any)
      .update({ motorista_id: user.id } as any)
      .eq("id", envioId)
      .eq("status", "pendente")
      .is("motorista_id", null);

    if (error) {
      toast.error("Envio já foi aceito por outro motorista.");
      return false;
    }
    toast.success("Envio aceito!");
    fetchEnvios();
    notifyPassenger(envioId, "🚗 Motorista a caminho!", "Um motorista aceitou seu envio e está indo para o ponto de coleta.");
    return true;
  };

  const notifyPassenger = async (envioId: string, title: string, body: string) => {
    try {
      const { data: envioData } = await supabase
        .from("envios" as any)
        .select("user_id")
        .eq("id", envioId)
        .maybeSingle();
      if (envioData) {
        const userId = (envioData as any).user_id;
        await supabase.functions.invoke("send-push-notification", {
          body: { user_id: userId, title, body },
        });
      }
    } catch (e) {
      console.error("Erro ao notificar passageiro:", e);
    }
  };

  const markColetado = async (envioId: string) => {
    const { error } = await supabase
      .from("envios" as any)
      .update({ status: "coletado", coletado_em: new Date().toISOString() } as any)
      .eq("id", envioId);

    if (error) {
      toast.error("Erro ao atualizar status.");
      return false;
    }
    toast.success("Pacote marcado como coletado!");
    fetchEnvios();
    notifyPassenger(envioId, "📦 Pacote coletado!", "O motorista coletou seu pacote e está a caminho do destino.");
    return true;
  };

  const markEntregue = async (envioId: string) => {
    const { error } = await supabase
      .from("envios" as any)
      .update({ status: "entregue", entregue_em: new Date().toISOString() } as any)
      .eq("id", envioId);

    if (error) {
      toast.error("Erro ao atualizar status.");
      return false;
    }
    toast.success("Entrega concluída!");
    fetchEnvios();
    notifyPassenger(envioId, "✅ Pacote entregue!", "Seu pacote foi entregue com sucesso no destino.");
    return true;
  };

  return { pendingEnvios, myEnvios, loading, acceptEnvio, markColetado, markEntregue, refresh: fetchEnvios };
};
