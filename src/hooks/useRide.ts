import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDirections } from "@/lib/googleMaps";

export interface RideEstimate {
  distancia_km: number;
  duracao_min: number;
  valor: number;
  origem_endereco: string;
  origem_lat: number;
  origem_lng: number;
  destino_endereco: string;
  destino_lat: number;
  destino_lng: number;
}

export const useRide = () => {
  const { user } = useAuth();
  const [estimating, setEstimating] = useState(false);
  const [creating, setCreating] = useState(false);

  const estimate = async (
    origem: { endereco: string; lat: number; lng: number },
    destino: { endereco: string; lat: number; lng: number }
  ): Promise<RideEstimate | null> => {
    setEstimating(true);
    try {
      const route = await getDirections(origem.lat, origem.lng, destino.lat, destino.lng);
      if (!route) return null;

      const distancia_km = Math.round((route.distance_m / 1000) * 10) / 10;
      const duracao_min = Math.round(route.duration_s / 60);

      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const currentDay = now.getDay();

      const { data: pricingRows } = await supabase
        .from("precificacao")
        .select("*")
        .eq("categoria", "Carro")
        .eq("ativo", true)
        .lte("hora_inicio", currentTime)
        .gte("hora_fim", currentTime)
        .contains("dias_semana", [currentDay])
        .limit(1);

      const pricing = pricingRows?.[0];

      let valor: number;
      if (pricing) {
        const mult = Number((pricing as any).multiplicador ?? 1);
        valor =
          (Number(pricing.preco_base) +
            Number(pricing.preco_km) * distancia_km +
            Number(pricing.preco_minuto) * duracao_min) *
          mult;
        valor = Math.max(valor, Number(pricing.taxa_minima));
      } else {
        valor = Math.max(5 + 2 * distancia_km + 0.5 * duracao_min, 8);
      }
      valor = Math.round(valor * 100) / 100;

      return {
        distancia_km,
        duracao_min,
        valor,
        origem_endereco: origem.endereco,
        origem_lat: origem.lat,
        origem_lng: origem.lng,
        destino_endereco: destino.endereco,
        destino_lat: destino.lat,
        destino_lng: destino.lng,
      };
    } catch {
      return null;
    } finally {
      setEstimating(false);
    }
  };

  // Creates ride WITHOUT dispatching - dispatch happens after payment
  const createRide = async (est: RideEstimate, forma_pagamento: string) => {
    if (!user) return null;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("rides")
        .insert({
          passageiro_id: user.id,
          origem_endereco: est.origem_endereco,
          origem_lat: est.origem_lat,
          origem_lng: est.origem_lng,
          destino_endereco: est.destino_endereco,
          destino_lat: est.destino_lat,
          destino_lng: est.destino_lng,
          distancia_km: est.distancia_km,
          duracao_min: est.duracao_min,
          valor: est.valor,
          forma_pagamento,
          status: "waiting_payment",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Erro ao criar corrida:", err);
      return null;
    } finally {
      setCreating(false);
    }
  };

  // Dispatch ride to find a driver - called AFTER payment succeeds
  const dispatchRide = async (rideId: string, est: RideEstimate) => {
    try {
      const result = await supabase.rpc("dispatch_ride", { p_ride_id: rideId });
      const driverId = result.data;
      if (driverId) {
        supabase.functions
          .invoke("send-push-notification", {
            body: {
              user_id: driverId,
              title: "Nova corrida disponível!",
              body: `De ${est.origem_endereco} → ${est.destino_endereco} | R$ ${est.valor.toFixed(2)}`,
              data: { ride_id: rideId },
            },
          })
          .catch(() => {});
      }
      return driverId;
    } catch {
      return null;
    }
  };

  const updateRideStatus = async (rideId: string, status: string) => {
    const updates: Record<string, any> = { status };
    if (status === "aceita") updates.aceita_em = new Date().toISOString();
    if (status === "em_andamento") updates.iniciada_em = new Date().toISOString();
    if (status === "finalizada") updates.finalizada_em = new Date().toISOString();
    if (status === "cancelada") updates.cancelada_em = new Date().toISOString();

    const { error } = await supabase.from("rides").update(updates).eq("id", rideId);
    return !error;
  };

  return { estimate, estimating, createRide, creating, dispatchRide, updateRideStatus };
};
