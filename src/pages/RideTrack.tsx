import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MapPin, Clock, Car, Loader2 } from "lucide-react";
import GoogleMap from "@/components/GoogleMap";
import { supabase } from "@/integrations/supabase/client";

const RideTrack = () => {
  const { token } = useParams<{ token: string }>();
  const [ride, setRide] = useState<any>(null);
  const [driverName, setDriverName] = useState<string | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;

    const loadRide = async () => {
      const { data, error } = await (supabase
        .from("rides")
        .select("*") as any)
        .eq("compartilhar_token", token)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setRide(data);
      setLoading(false);

      if (data.motorista_id) {
        const { data: profile } = await supabase.from("profiles").select("nome").eq("id", data.motorista_id).single();
        setDriverName(profile?.nome || "Motorista");

        const { data: loc } = await supabase.from("driver_locations").select("lat, lng").eq("driver_id", data.motorista_id).single();
        if (loc) setDriverPos(loc);
      }
    };

    loadRide();

    // Subscribe to updates
    const channel = supabase
      .channel(`track-${token}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rides" },
        (payload) => {
          const updated = payload.new as any;
          if (updated.compartilhar_token === token) {
            setRide(updated);
          }
        }
      )
      .subscribe();

    // Refresh driver position every 10s
    const posInterval = setInterval(async () => {
      if (!ride?.motorista_id) return;
      const { data: loc } = await supabase.from("driver_locations").select("lat, lng").eq("driver_id", ride.motorista_id).single();
      if (loc) setDriverPos(loc);
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(posInterval);
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <Car size={48} className="text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold">Link inválido</h1>
        <p className="text-sm text-muted-foreground mt-2">Esta viagem não foi encontrada ou já foi encerrada.</p>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    solicitada: "Buscando motorista...",
    aceita: "Motorista a caminho",
    aguardando: "Motorista esperando passageiro",
    em_andamento: "Em viagem",
    finalizada: "Viagem finalizada",
    cancelada: "Viagem cancelada",
  };

  const statusColors: Record<string, string> = {
    solicitada: "bg-muted-foreground animate-pulse",
    aceita: "bg-primary animate-pulse",
    aguardando: "bg-amber-500",
    em_andamento: "bg-green-500",
    finalizada: "bg-green-500",
    cancelada: "bg-destructive",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Map */}
      <div className="flex-1 relative">
        <GoogleMap
          className="absolute inset-0 w-full h-full"
          zoom={14}
          center={
            driverPos
              ? [driverPos.lng, driverPos.lat]
              : ride
              ? [ride.origem_lng, ride.origem_lat]
              : undefined
          }
        />

        {/* Status */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-card/95 backdrop-blur border border-border rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
            <div className={`w-2 h-2 rounded-full ${statusColors[ride?.status] || "bg-muted-foreground"}`} />
            <span className="text-xs font-semibold">{statusLabels[ride?.status] || ride?.status}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-card border-t border-border p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Car size={20} className="text-primary" />
          <div>
            <p className="text-sm font-bold">{driverName || "Aguardando motorista"}</p>
            <p className="text-[10px] text-muted-foreground">Acompanhamento em tempo real</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <div className="w-3 h-3 rounded-full bg-primary mt-1 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">Origem</p>
              <p className="text-sm font-medium">{ride?.origem_endereco}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-destructive mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground">Destino</p>
              <p className="text-sm font-medium">{ride?.destino_endereco}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RideTrack;
