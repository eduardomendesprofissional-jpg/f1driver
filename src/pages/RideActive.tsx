import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, MessageCircle, X, Star, Loader2, Clock, Navigation, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import MapboxMap from "@/components/MapboxMap";
import { useRide } from "@/hooks/useRide";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DISPATCH_TIMEOUT = 15;

const RideActive = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rideId, isDriver } = (location.state as any) || {};
  const [ride, setRide] = useState<any>(null);
  const [driverName, setDriverName] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [redispatchAttempt, setRedispatchAttempt] = useState(0);
  const [eta, setEta] = useState<number | null>(null);
  const { updateRideStatus } = useRide();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const redispatchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        // Calculate ETA using Mapbox Directions
        fetchETA(data);
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
            fetchETA(updated);
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

  // Fetch ETA from Mapbox Directions API
  const fetchETA = async (rideData: any) => {
    if (!rideData) return;
    try {
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${rideData.origem_lng},${rideData.origem_lat};${rideData.destino_lng},${rideData.destino_lat}?access_token=pk.eyJ1IjoiZmlkcml2ZXIiLCJhIjoiY21tcGJjbmtzMG9wZjJ3cHNsZ3oxaTYzZiJ9.TmAp9KCag5_-gQ0FsgOyJw&overview=false`
      );
      const data = await res.json();
      if (data.routes?.[0]?.duration) {
        setEta(Math.round(data.routes[0].duration / 60));
      }
    } catch {}
  };

  // Auto-redispatch timer (passenger side)
  useEffect(() => {
    if (isDriver || !ride || ride.status !== "solicitada") {
      if (timerRef.current) clearInterval(timerRef.current);
      if (redispatchRef.current) clearTimeout(redispatchRef.current);
      setCountdown(null);
      return;
    }

    setCountdown(DISPATCH_TIMEOUT);
    
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    redispatchRef.current = setTimeout(async () => {
      const { data } = await supabase.rpc("check_and_redispatch", { p_ride_id: rideId });
      if (data === "redispatched") {
        toast.info("Motorista não respondeu. Buscando outro motorista...");
        setRedispatchAttempt((prev) => prev + 1);
        setCountdown(DISPATCH_TIMEOUT);
      } else if (data === "no_drivers") {
        toast.error("Nenhum motorista disponível no momento.");
      }
    }, DISPATCH_TIMEOUT * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (redispatchRef.current) clearTimeout(redispatchRef.current);
    };
  }, [ride?.status, ride?.motorista_id, isDriver, redispatchAttempt]);

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

  const openWaze = () => {
    if (!ride) return;
    const destLat = status === "aceita" ? ride.origem_lat : ride.destino_lat;
    const destLng = status === "aceita" ? ride.origem_lng : ride.destino_lng;
    window.open(
      `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`,
      "_blank"
    );
  };

  const openGoogleMaps = () => {
    if (!ride) return;
    const destLat = status === "aceita" ? ride.origem_lat : ride.destino_lat;
    const destLng = status === "aceita" ? ride.origem_lng : ride.destino_lng;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`,
      "_blank"
    );
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
        <MapboxMap
          className="absolute inset-0 w-full h-full"
          zoom={14}
          center={ride ? [ride.origem_lng, ride.origem_lat] : undefined}
        />

        {/* Status pill */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-card/95 backdrop-blur border border-border rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
            <div className={`w-2 h-2 rounded-full ${statusColor[status] || "bg-muted-foreground"}`} />
            <span className="text-xs font-semibold">
              {statusLabel[status] || status}
            </span>
            {eta && status !== "solicitada" && (
              <span className="flex items-center gap-1 text-xs text-primary font-bold ml-1">
                <Clock size={12} />
                ~{eta} min
              </span>
            )}
            {status === "solicitada" && countdown !== null && countdown > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground ml-1">
                <Clock size={12} />
                {countdown}s
              </span>
            )}
          </div>
        </div>

        {status === "solicitada" && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-primary" size={32} />
            {countdown !== null && countdown > 0 && (
              <div className="bg-card/90 border border-border rounded-lg px-3 py-1.5">
                <p className="text-xs text-muted-foreground text-center">
                  Aguardando resposta do motorista
                </p>
                <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${((countdown) / DISPATCH_TIMEOUT) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Card */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-card border-t border-border rounded-t-3xl p-5 shadow-[0_-4px_30px_rgba(0,0,0,0.15)]"
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
          <div className="mb-4 text-sm space-y-1.5">
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <p className="text-muted-foreground truncate">{ride.origem_endereco}</p>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={12} className="text-destructive mt-0.5 shrink-0" />
              <p className="text-muted-foreground truncate">{ride.destino_endereco}</p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <span className="font-bold text-primary">R$ {Number(ride.valor || 0).toFixed(2)}</span>
              {ride.distancia_km && (
                <span className="text-xs text-muted-foreground">{ride.distancia_km} km</span>
              )}
              {eta && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock size={10} /> ~{eta} min
                </span>
              )}
            </div>
          </div>
        )}

        {/* Waze / Google Maps - Driver only */}
        {isDriver && status !== "solicitada" && ride && (
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              className="flex-1 h-10 text-xs font-semibold"
              onClick={openWaze}
            >
              <Navigation size={14} className="mr-1.5" />
              Abrir no Waze
              <ExternalLink size={10} className="ml-1 opacity-50" />
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-10 text-xs font-semibold"
              onClick={openGoogleMaps}
            >
              <MapPin size={14} className="mr-1.5" />
              Google Maps
              <ExternalLink size={10} className="ml-1 opacity-50" />
            </Button>
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
