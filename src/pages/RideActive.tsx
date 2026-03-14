import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, MessageCircle, X, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MapboxMap from "@/components/MapboxMap";
import { useRide } from "@/hooks/useRide";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RideActive = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rideId, isDriver } = (location.state as any) || {};
  const [ride, setRide] = useState<any>(null);
  const [driverName, setDriverName] = useState<string | null>(null);
  const { updateRideStatus } = useRide();

  // Load ride and subscribe to changes
  useEffect(() => {
    if (!rideId) {
      navigate("/passenger");
      return;
    }

    const loadRide = async () => {
      const { data } = await supabase
        .from("rides")
        .select("*")
        .eq("id", rideId)
        .single();
      if (data) {
        setRide(data);
        if (data.motorista_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nome")
            .eq("id", data.motorista_id)
            .single();
          setDriverName(profile?.nome || "Motorista");
        }
      }
    };

    loadRide();

    const channel = supabase
      .channel(`ride-${rideId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${rideId}` },
        async (payload) => {
          const updated = payload.new as any;
          setRide(updated);
          
          if (updated.motorista_id && !driverName) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("nome")
              .eq("id", updated.motorista_id)
              .single();
            setDriverName(profile?.nome || "Motorista");
          }

          if (updated.status === "aceita" && !isDriver) {
            toast.success("Motorista aceitou sua corrida!");
          }
          if (updated.status === "finalizada") {
            navigate("/rating", { state: { rideId } });
          }
          if (updated.status === "cancelada") {
            toast.info("Corrida cancelada.");
            navigate(isDriver ? "/driver" : "/passenger");
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [rideId]);

  const status = ride?.status || "solicitada";

  const handleCancel = async () => {
    if (rideId) await updateRideStatus(rideId, "cancelada");
    toast.info("Corrida cancelada.");
    navigate(isDriver ? "/driver" : "/passenger");
  };

  const handleStart = async () => {
    if (rideId) await updateRideStatus(rideId, "em_andamento");
  };

  const handleFinish = async () => {
    if (rideId) await updateRideStatus(rideId, "finalizada");
    navigate("/rating", { state: { rideId } });
  };

  const statusLabel: Record<string, string> = {
    solicitada: "Buscando motorista...",
    aceita: isDriver ? "Indo buscar passageiro" : "Motorista a caminho",
    em_andamento: "Em viagem",
  };

  const statusColor: Record<string, string> = {
    solicitada: "bg-muted-foreground animate-pulse",
    aceita: "bg-primary animate-pulse",
    em_andamento: "bg-success",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Map */}
      <div className="flex-1 relative">
        <MapboxMap className="absolute inset-0 w-full h-full" zoom={14} />

        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-card border border-border rounded-full px-4 py-2 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColor[status] || "bg-muted-foreground"}`} />
            <span className="text-xs font-semibold">
              {statusLabel[status] || status}
            </span>
          </div>
        </div>

        {status === "solicitada" && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}
      </div>

      {/* Bottom Card */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-card border-t border-border rounded-t-2xl p-5"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-xl font-bold text-primary">
            {driverName ? driverName[0]?.toUpperCase() : "?"}
          </div>
          <div className="flex-1">
            <p className="font-bold">{driverName || "Buscando motorista..."}</p>
            <div className="flex items-center gap-1">
              <Star size={14} className="text-primary fill-primary" />
              <span className="text-sm text-muted-foreground">—</span>
            </div>
          </div>
          {status !== "solicitada" && (
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <Phone size={18} className="text-primary" />
              </button>
              <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <MessageCircle size={18} className="text-primary" />
              </button>
            </div>
          )}
        </div>

        {/* Ride info */}
        {ride && (
          <div className="mb-4 text-sm space-y-1">
            <p className="text-muted-foreground truncate">📍 {ride.origem_endereco}</p>
            <p className="text-muted-foreground truncate">🏁 {ride.destino_endereco}</p>
            <p className="font-bold text-primary">R$ {Number(ride.valor || 0).toFixed(2)}</p>
          </div>
        )}

        <div className="flex gap-3">
          {status === "solicitada" && !isDriver && (
            <Button variant="destructive" className="w-full h-12 font-bold" onClick={handleCancel}>
              <X size={16} className="mr-2" /> Cancelar
            </Button>
          )}
          {status === "aceita" && !isDriver && (
            <Button variant="destructive" className="w-full h-12 font-bold" onClick={handleCancel}>
              <X size={16} className="mr-2" /> Cancelar
            </Button>
          )}
          {status === "aceita" && isDriver && (
            <>
              <Button variant="destructive" className="flex-1 h-12 font-bold" onClick={handleCancel}>
                <X size={16} className="mr-2" /> Cancelar
              </Button>
              <Button className="flex-1 h-12 font-bold" onClick={handleStart}>
                Iniciar viagem
              </Button>
            </>
          )}
          {status === "em_andamento" && isDriver && (
            <Button className="w-full h-12 font-bold" onClick={handleFinish}>
              Finalizar viagem
            </Button>
          )}
          {status === "em_andamento" && !isDriver && (
            <div className="w-full text-center py-3 text-sm text-muted-foreground">
              Viagem em andamento...
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RideActive;
