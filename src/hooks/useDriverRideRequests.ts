import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface RideRequest {
  id: string;
  origem_endereco: string;
  destino_endereco: string;
  distancia_km: number | null;
  duracao_min: number | null;
  valor: number | null;
  forma_pagamento: string;
  passageiro_id: string;
}

export const useDriverRideRequests = (online: boolean) => {
  const { user } = useAuth();
  const [currentRequest, setCurrentRequest] = useState<RideRequest | null>(null);

  // Poll for rides assigned to this driver
  const checkForRides = useCallback(async () => {
    if (!user || !online) return;

    const { data } = await supabase
      .from("rides")
      .select("*")
      .eq("motorista_id", user.id)
      .eq("status", "solicitada")
      .limit(1)
      .maybeSingle();

    if (data && data.id !== currentRequest?.id) {
      setCurrentRequest(data as RideRequest);
      toast.info("Nova corrida disponível!");
    }
  }, [user, online, currentRequest?.id]);

  useEffect(() => {
    if (!online || !user) {
      setCurrentRequest(null);
      return;
    }

    checkForRides();

    // Subscribe to realtime changes on rides table
    const channel = supabase
      .channel("driver-rides")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rides",
          filter: `motorista_id=eq.${user.id}`,
        },
        (payload) => {
          const ride = payload.new as any;
          if (ride?.status === "solicitada") {
            setCurrentRequest(ride as RideRequest);
            toast.info("Nova corrida disponível!");
          } else {
            // Ride was accepted/cancelled, clear
            if (currentRequest?.id === ride?.id) {
              setCurrentRequest(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [online, user]);

  const acceptRide = async () => {
    if (!currentRequest || !user) return null;
    const { error } = await supabase
      .from("rides")
      .update({
        status: "aceita",
        motorista_id: user.id,
        aceita_em: new Date().toISOString(),
      })
      .eq("id", currentRequest.id)
      .eq("status", "solicitada");

    if (error) {
      toast.error("Corrida já foi aceita por outro motorista.");
      setCurrentRequest(null);
      return null;
    }

    const rideId = currentRequest.id;
    setCurrentRequest(null);
    toast.success("Corrida aceita!");
    return rideId;
  };

  const rejectRide = async () => {
    if (!currentRequest) return;
    // Remove this driver, trigger re-dispatch
    await supabase.rpc("dispatch_ride", { p_ride_id: currentRequest.id });
    setCurrentRequest(null);
    toast.info("Corrida recusada. Passando para o próximo motorista.");
  };

  return { currentRequest, acceptRide, rejectRide };
};
