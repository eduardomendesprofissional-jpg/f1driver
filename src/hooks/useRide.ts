import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZmlkcml2ZXIiLCJhIjoiY21tcGJjbmtzMG9wZjJ3cHNsZ3oxaTYzZiJ9.TmAp9KCag5_-gQ0FsgOyJw";

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
      // Get route from Mapbox Directions API
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${origem.lng},${origem.lat};${destino.lng},${destino.lat}?access_token=${MAPBOX_TOKEN}&overview=false`
      );
      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) return null;

      const distancia_km = Math.round((route.distance / 1000) * 10) / 10;
      const duracao_min = Math.round(route.duration / 60);

      // Fetch pricing from DB
      const { data: pricing } = await supabase
        .from("precificacao")
        .select("*")
        .eq("categoria", "Comum")
        .eq("ativo", true)
        .limit(1)
        .single();

      let valor: number;
      if (pricing) {
        valor = Number(pricing.preco_base) + Number(pricing.preco_km) * distancia_km + Number(pricing.preco_minuto) * duracao_min;
        valor = Math.max(valor, Number(pricing.taxa_minima));
      } else {
        // Fallback pricing
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
          status: "solicitada",
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

  const updateRideStatus = async (rideId: string, status: string) => {
    const updates: Record<string, any> = { status };
    if (status === "aceita") updates.aceita_em = new Date().toISOString();
    if (status === "em_andamento") updates.iniciada_em = new Date().toISOString();
    if (status === "finalizada") updates.finalizada_em = new Date().toISOString();
    if (status === "cancelada") updates.cancelada_em = new Date().toISOString();

    const { error } = await supabase.from("rides").update(updates).eq("id", rideId);
    return !error;
  };

  return { estimate, estimating, createRide, creating, updateRideStatus };
};
