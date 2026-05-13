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
  const [estimating, setEstimating] = useState(false);

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

      // Fetch ALL active pricing rules and pick the one matching current day/time
      // (filtering server-side by time fails when faixas crossing midnight)
      const { data: pricingRows } = await supabase
        .from("precificacao")
        .select("*")
        .eq("categoria", "Carro")
        .eq("ativo", true)
        .order("multiplicador", { ascending: false })
        .order("updated_at", { ascending: false });

      const pricing = (pricingRows || []).find((p: any) => {
        const dias: number[] = p.dias_semana ?? [0, 1, 2, 3, 4, 5, 6];
        if (!dias.includes(currentDay)) return false;
        const ini = (p.hora_inicio || "00:00").slice(0, 5);
        const fim = (p.hora_fim || "23:59").slice(0, 5);
        // Crosses midnight (e.g. 22:00 → 04:00)
        if (fim < ini) return currentTime >= ini || currentTime <= fim;
        return currentTime >= ini && currentTime <= fim;
      });

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

  // Dispatch ride to find a driver - called immediately after ride creation
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

  return { estimate, estimating, dispatchRide, updateRideStatus };
};
