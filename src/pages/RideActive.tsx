import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MessageCircle, X, Star, Loader2, Clock, Navigation, ExternalLink, MapPin, CheckCircle2, Timer, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import GoogleMap from "@/components/GoogleMap";
import EmergencyFAB from "@/components/EmergencyFAB";
import { useRide } from "@/hooks/useRide";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DISPATCH_TIMEOUT = 15;
const WAIT_TIMER_SECONDS = 180; // 3 minutes

const RideActive = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rideId, isDriver } = (location.state as any) || {};
  const [ride, setRide] = useState<any>(null);
  const [driverName, setDriverName] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [redispatchAttempt, setRedispatchAttempt] = useState(0);
  const [eta, setEta] = useState<number | null>(null);
  const [waitCountdown, setWaitCountdown] = useState<number | null>(null);
  const [waitExpired, setWaitExpired] = useState(false);
  const { updateRideStatus } = useRide();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const redispatchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        fetchETA(data);

        // Resume wait timer if already arrived
        if (data.status === "aguardando" && (data as any).chegou_em) {
          const elapsed = Math.floor((Date.now() - new Date((data as any).chegou_em).getTime()) / 1000);
          const remaining = Math.max(0, WAIT_TIMER_SECONDS - elapsed);
          if (remaining > 0) {
            setWaitCountdown(remaining);
          } else {
            setWaitExpired(true);
            setWaitCountdown(0);
          }
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
            fetchETA(updated);
          }
          if (updated.status === "aguardando" && !isDriver) {
            toast.info("Motorista chegou ao local! Dirija-se ao veículo.");
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
        `https://api.mapbox.com/directions/v5/mapbox/driving/${rideData.origem_lng},${rideData.origem_lat};${rideData.destino_lng},${rideData.destino_lat}?access_token=${MAPBOX_TOKEN}&overview=false`
      );
      const data = await res.json();
      const route = data.routes?.[0];
      if (route?.duration) {
        setEta(Math.round(route.duration / 60));
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

  // Wait timer countdown (when status is "aguardando")
  useEffect(() => {
    if (ride?.status !== "aguardando" || waitCountdown === null) {
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
      return;
    }

    if (waitCountdown <= 0) {
      setWaitExpired(true);
      return;
    }

    waitTimerRef.current = setInterval(() => {
      setWaitCountdown((prev) => {
        if (prev === null || prev <= 1) {
          setWaitExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    };
  }, [ride?.status, waitCountdown !== null]);

  const status = ride?.status || "solicitada";

  const handleCancel = async () => {
    if (rideId) await updateRideStatus(rideId, "cancelada");
    toast.info("Corrida cancelada.");
    navigate(isDriver ? "/driver" : "/passenger");
  };

  const handleArrived = async () => {
    if (!rideId) return;
    const { error } = await supabase
      .from("rides")
      .update({ status: "aguardando", chegou_em: new Date().toISOString() })
      .eq("id", rideId);
    if (!error) {
      setWaitCountdown(WAIT_TIMER_SECONDS);
      setWaitExpired(false);
      toast.success("Chegada confirmada! Aguardando passageiro...");
    }
  };

  const handleStart = async () => {
    if (rideId) {
      const { error } = await supabase
        .from("rides")
        .update({ status: "em_andamento", iniciada_em: new Date().toISOString() })
        .eq("id", rideId);
      if (!error) {
        setWaitCountdown(null);
        setWaitExpired(false);
      }
    }
  };

  const handleNoShow = async () => {
    if (!rideId) return;
    await supabase
      .from("rides")
      .update({ status: "cancelada", cancelada_em: new Date().toISOString() })
      .eq("id", rideId);
    toast.info("Passageiro não compareceu. Corrida cancelada.");
    navigate("/driver");
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

  const formatWaitTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const statusLabel: Record<string, string> = {
    solicitada: "Buscando motorista...",
    aceita: isDriver ? "Indo buscar passageiro" : "Motorista a caminho",
    aguardando: isDriver ? "Aguardando passageiro" : "Motorista chegou!",
    em_andamento: "Em viagem",
  };

  const statusColor: Record<string, string> = {
    solicitada: "bg-muted-foreground animate-pulse",
    aceita: "bg-primary animate-pulse",
    aguardando: "bg-amber-500",
    em_andamento: "bg-success",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Map */}
      <div className="flex-1 relative">
        <GoogleMap
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
            {eta && status !== "solicitada" && status !== "aguardando" && (
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
            {status === "aguardando" && waitCountdown !== null && (
              <span className={`flex items-center gap-1 text-xs font-bold ml-1 ${waitExpired ? "text-destructive" : "text-amber-500"}`}>
                <Timer size={12} />
                {waitExpired ? "Expirado" : formatWaitTime(waitCountdown)}
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

        {/* Wait timer overlay on map (driver) */}
        <AnimatePresence>
          {status === "aguardando" && isDriver && waitCountdown !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
            >
              <div className="bg-card/95 backdrop-blur border border-border rounded-2xl p-4 shadow-xl min-w-[200px]">
                <div className="flex flex-col items-center gap-2">
                  {!waitExpired ? (
                    <>
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--secondary))" strokeWidth="4" />
                          <circle
                            cx="32" cy="32" r="28"
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - (waitCountdown / WAIT_TIMER_SECONDS))}`}
                            className="transition-all duration-1000"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                          {formatWaitTime(waitCountdown)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Aguardando passageiro</p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={28} className="text-destructive" />
                      <p className="text-xs font-semibold text-destructive">Tempo de espera esgotado</p>
                      <p className="text-[10px] text-muted-foreground text-center">
                        Você pode cancelar por não comparecimento
                      </p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wait timer overlay on map (passenger) */}
        <AnimatePresence>
          {status === "aguardando" && !isDriver && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
            >
              <div className="bg-card/95 backdrop-blur border border-amber-500/50 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Motorista chegou!</p>
                    <p className="text-xs text-muted-foreground">
                      {waitCountdown !== null && waitCountdown > 0
                        ? `Dirija-se ao veículo em ${formatWaitTime(waitCountdown)}`
                        : "Tempo de espera esgotado"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

        {/* Wait timer progress bar */}
        {status === "aguardando" && waitCountdown !== null && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Timer size={12} />
                Tempo de espera
              </span>
              <span className={`text-xs font-bold ${waitExpired ? "text-destructive" : "text-amber-500"}`}>
                {waitExpired ? "Expirado" : formatWaitTime(waitCountdown)}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  waitExpired ? "bg-destructive" : waitCountdown < 60 ? "bg-amber-500" : "bg-primary"
                }`}
                style={{ width: `${Math.max(0, (waitCountdown / WAIT_TIMER_SECONDS) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Waze / Google Maps - Driver only */}
        {isDriver && (status === "aceita" || status === "aguardando") && ride && (
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

        {/* Navigation during trip */}
        {isDriver && status === "em_andamento" && ride && (
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
              <Button className="flex-1 h-12 font-bold bg-amber-500 hover:bg-amber-600 text-white" onClick={handleArrived}>
                <CheckCircle2 size={16} className="mr-2" /> Cheguei
              </Button>
            </>
          )}
          {status === "aguardando" && isDriver && (
            <>
              {waitExpired ? (
                <>
                  <Button variant="destructive" className="flex-1 h-12 font-bold" onClick={handleNoShow}>
                    <AlertTriangle size={16} className="mr-2" /> Não compareceu
                  </Button>
                  <Button className="flex-1 h-12 font-bold" onClick={handleStart}>
                    Iniciar viagem
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="destructive" className="flex-1 h-12 font-bold" onClick={handleCancel}>
                    <X size={16} className="mr-2" /> Cancelar
                  </Button>
                  <Button className="flex-1 h-12 font-bold" onClick={handleStart}>
                    Iniciar viagem
                  </Button>
                </>
              )}
            </>
          )}
          {status === "aguardando" && !isDriver && (
            <Button variant="destructive" className="w-full h-12 font-bold" onClick={handleCancel}>
              <X size={16} className="mr-2" /> Cancelar corrida
            </Button>
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

      {/* Emergency FAB - visible during active ride states */}
      {(status === "aceita" || status === "aguardando" || status === "em_andamento") && (
        <EmergencyFAB />
      )}
    </div>
  );
};

export default RideActive;
