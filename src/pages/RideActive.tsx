import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, MessageCircle, X, Star, Loader2, Clock, Navigation,
  ExternalLink, MapPin, CheckCircle2, Timer, AlertTriangle,
  StopCircle, Route, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import GoogleMap from "@/components/GoogleMap";
import EmergencyFAB from "@/components/EmergencyFAB";
import RideChat from "@/components/RideChat";
import ShareTrip from "@/components/ShareTrip";
import SOSButton from "@/components/SOSButton";
import { useRide } from "@/hooks/useRide";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MAPBOX_TOKEN } from "@/lib/mapbox";
import CancelRideDialog from "@/components/CancelRideDialog";
import TripSummaryPopup from "@/components/TripSummaryPopup";

const DISPATCH_TIMEOUT = 15;
const WAIT_TIMER_SECONDS = 300; // 5 minutes
const WAIT_CHARGE_THRESHOLD = 180; // 3 minutes
const NOSHOW_THRESHOLD = 300; // 5 minutes
const NOSHOW_FEE_PASSENGER = 8;
const NOSHOW_FEE_DRIVER = 4;

// Pricing
const PRECO_BASE = 3.0;
const PRECO_KM = 2.5;
const PRECO_MIN = 0.4;
const VALOR_MINIMO = 8.0;

const calcFare = (km: number, min: number) =>
  Math.max(VALOR_MINIMO, Math.round((PRECO_BASE + PRECO_KM * km + PRECO_MIN * min) * 100) / 100);

const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const RideActive = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rideId, isDriver } = (location.state as any) || {};
  const [ride, setRide] = useState<any>(null);
  const [driverName, setDriverName] = useState<string | null>(null);
  const [passengerName, setPassengerName] = useState<string | null>(null);
  const [passengerAvatar, setPassengerAvatar] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [redispatchAttempt, setRedispatchAttempt] = useState(0);
  const [eta, setEta] = useState<number | null>(null);
  const [waitCountdown, setWaitCountdown] = useState<number | null>(null);
  const [waitExpired, setWaitExpired] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Live trip tracking
  const [tripElapsed, setTripElapsed] = useState(0); // seconds
  const [tripKm, setTripKm] = useState(0);
  const [liveFare, setLiveFare] = useState(0);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const geoWatchRef = useRef<number | null>(null);
  const tripTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tripSummaryRef = useRef<{ km: number; min: number; valor: number }>({ km: 0, min: 0, valor: 0 });

  const { updateRideStatus } = useRide();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const redispatchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load ride and subscribe
  useEffect(() => {
    if (!rideId) {
      navigate("/passenger");
      return;
    }

    const loadRide = async () => {
      const { data } = await supabase.from("rides").select("*").eq("id", rideId).single();
      if (data) {
        setRide(data);
        if (data.motorista_id) {
          const { data: profile } = await supabase.from("profiles").select("nome").eq("id", data.motorista_id).single();
          setDriverName(profile?.nome || "Motorista");
        }
        if (data.passageiro_id) {
          const { data: profile } = await supabase.from("profiles").select("nome, avatar_url").eq("id", data.passageiro_id).single();
          setPassengerName(profile?.nome || "Passageiro");
          setPassengerAvatar(profile?.avatar_url || null);
        }
        fetchETA(data);

        if (data.status === "aguardando" && (data as any).chegou_em) {
          const elapsed = Math.floor((Date.now() - new Date((data as any).chegou_em).getTime()) / 1000);
          const remaining = Math.max(0, WAIT_TIMER_SECONDS - elapsed);
          if (remaining > 0) setWaitCountdown(remaining);
          else { setWaitExpired(true); setWaitCountdown(0); }
        }

        // Resume trip timer
        if (data.status === "em_andamento" && data.iniciada_em) {
          const elapsed = Math.floor((Date.now() - new Date(data.iniciada_em).getTime()) / 1000);
          setTripElapsed(elapsed);
          setTripKm(Number((data as any).km_real || 0));
        }
      }
    };

    loadRide();

    const channel = supabase
      .channel(`ride-${rideId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${rideId}` },
        async (payload) => {
          const updated = payload.new as any;
          setRide(updated);
          if (updated.motorista_id && !driverName) {
            const { data: profile } = await supabase.from("profiles").select("nome").eq("id", updated.motorista_id).single();
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
            if (!isDriver) navigate("/rating", { state: { rideId } });
          }
          if (updated.status === "cancelada" || updated.status === "no_show") {
            toast.info(updated.status === "no_show" ? "Passageiro não compareceu." : "Corrida cancelada.");
            navigate(isDriver ? "/driver" : "/passenger");
          }
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [rideId]);

  // Live GPS tracking during trip (driver only)
  useEffect(() => {
    if (!isDriver || ride?.status !== "em_andamento") {
      if (geoWatchRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchRef.current);
        geoWatchRef.current = null;
      }
      if (tripTimerRef.current) { clearInterval(tripTimerRef.current); tripTimerRef.current = null; }
      return;
    }

    // Start trip timer
    tripTimerRef.current = setInterval(() => {
      setTripElapsed(prev => {
        const newVal = prev + 1;
        const min = newVal / 60;
        setLiveFare(calcFare(tripKm, min));
        return newVal;
      });
    }, 1000);

    // Start GPS watch
    geoWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (lastPosRef.current) {
          const dist = haversineDistance(lastPosRef.current.lat, lastPosRef.current.lng, latitude, longitude);
          if (dist > 0.01) { // min 10m
            setTripKm(prev => {
              const newKm = Math.round((prev + dist) * 10) / 10;
              return newKm;
            });
            lastPosRef.current = { lat: latitude, lng: longitude };
          }
        } else {
          lastPosRef.current = { lat: latitude, lng: longitude };
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (geoWatchRef.current !== null) navigator.geolocation.clearWatch(geoWatchRef.current);
      if (tripTimerRef.current) clearInterval(tripTimerRef.current);
    };
  }, [ride?.status, isDriver]);

  // Update live fare when km changes
  useEffect(() => {
    setLiveFare(calcFare(tripKm, tripElapsed / 60));
  }, [tripKm]);

  const fetchETA = async (rideData: any) => {
    if (!rideData) return;
    try {
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${rideData.origem_lng},${rideData.origem_lat};${rideData.destino_lng},${rideData.destino_lat}?access_token=${MAPBOX_TOKEN}&overview=false`
      );
      const data = await res.json();
      if (data.routes?.[0]?.duration) setEta(Math.round(data.routes[0].duration / 60));
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
      setCountdown(prev => (prev === null || prev <= 1) ? 0 : prev - 1);
    }, 1000);
    redispatchRef.current = setTimeout(async () => {
      const { data } = await supabase.rpc("check_and_redispatch", { p_ride_id: rideId });
      if (data === "redispatched") {
        toast.info("Motorista não respondeu. Buscando outro motorista...");
        setRedispatchAttempt(prev => prev + 1);
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

  // Wait timer
  useEffect(() => {
    if (ride?.status !== "aguardando" || waitCountdown === null) {
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
      return;
    }
    if (waitCountdown <= 0) { setWaitExpired(true); return; }
    waitTimerRef.current = setInterval(() => {
      setWaitCountdown(prev => {
        if (prev === null || prev <= 1) { setWaitExpired(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (waitTimerRef.current) clearInterval(waitTimerRef.current); };
  }, [ride?.status, waitCountdown !== null]);

  const status = ride?.status || "solicitada";
  const waitElapsed = waitCountdown !== null ? WAIT_TIMER_SECONDS - waitCountdown : 0;
  const canChargeWait = waitElapsed >= WAIT_CHARGE_THRESHOLD;
  const canNoShow = waitElapsed >= NOSHOW_THRESHOLD || waitExpired;

  const handleCancel = async (motivo: string) => {
    if (!rideId) return;
    setCancelLoading(true);
    await supabase.from("rides").update({
      status: "cancelada",
      cancelada_em: new Date().toISOString(),
      motivo_cancelamento: motivo,
      cancelado_por: isDriver ? "motorista" : "passageiro",
    } as any).eq("id", rideId);

    // Check consecutive cancellations for driver
    if (isDriver) {
      const { data: recent } = await supabase
        .from("rides")
        .select("status")
        .eq("motorista_id", ride?.motorista_id)
        .order("created_at", { ascending: false })
        .limit(4);
      const consecutive = (recent || []).filter(r => r.status === "cancelada").length;
      if (consecutive >= 3) {
        toast.warning("⚠️ Atenção: Você cancelou 3+ corridas seguidas. Cancelamentos excessivos podem gerar penalidades.");
      }
    }

    setCancelLoading(false);
    setShowCancelDialog(false);
    toast.info("Corrida cancelada.");
    navigate(isDriver ? "/driver" : "/passenger");
  };

  const handleArrived = async () => {
    if (!rideId) return;
    const { error } = await supabase.from("rides")
      .update({ status: "aguardando", chegou_em: new Date().toISOString() })
      .eq("id", rideId);
    if (!error) {
      setWaitCountdown(WAIT_TIMER_SECONDS);
      setWaitExpired(false);
      toast.success("Chegada confirmada! Aguardando passageiro...");
    }
  };

  const handleStart = async () => {
    if (!rideId) return;
    const { error } = await supabase.from("rides")
      .update({ status: "em_andamento", iniciada_em: new Date().toISOString() } as any)
      .eq("id", rideId);
    if (!error) {
      setWaitCountdown(null);
      setWaitExpired(false);
      setTripElapsed(0);
      setTripKm(0);
      setLiveFare(PRECO_BASE);
      lastPosRef.current = null;
    }
  };

  const handleNoShow = async () => {
    if (!rideId) return;
    await supabase.from("rides").update({
      status: "no_show",
      cancelada_em: new Date().toISOString(),
      motivo_cancelamento: "Passageiro não compareceu",
      cancelado_por: "motorista",
      taxa_noshow: NOSHOW_FEE_PASSENGER,
      valor_final: NOSHOW_FEE_DRIVER,
    } as any).eq("id", rideId);
    toast.info(`Passageiro não compareceu. Você receberá R$ ${NOSHOW_FEE_DRIVER.toFixed(2)} pela espera.`);
    navigate("/driver");
  };

  const handleFinish = async () => {
    if (!rideId) return;
    const finalKm = Math.max(tripKm, Number(ride?.distancia_km || 0));
    const finalMin = tripElapsed / 60;
    const finalValor = calcFare(finalKm, finalMin);

    tripSummaryRef.current = { km: finalKm, min: finalMin, valor: finalValor };

    await supabase.from("rides").update({
      status: "finalizada",
      finalizada_em: new Date().toISOString(),
      km_real: finalKm,
      duracao_real_min: Math.round(finalMin),
      valor_final: finalValor,
    } as any).eq("id", rideId);

    if (isDriver) {
      setShowSummary(true);
    } else {
      navigate("/rating", { state: { rideId } });
    }
  };

  const handleSummaryClose = () => {
    setShowSummary(false);
    navigate("/rating", { state: { rideId } });
  };

  const openWaze = () => {
    if (!ride) return;
    const lat = status === "aceita" || status === "aguardando" ? ride.origem_lat : ride.destino_lat;
    const lng = status === "aceita" || status === "aguardando" ? ride.origem_lng : ride.destino_lng;
    window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, "_blank");
  };

  const openGoogleMaps = () => {
    if (!ride) return;
    const lat = status === "aceita" || status === "aguardando" ? ride.origem_lat : ride.destino_lat;
    const lng = status === "aceita" || status === "aguardando" ? ride.origem_lng : ride.destino_lng;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, "_blank");
  };

  const formatTime = (seconds: number) => {
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
    em_andamento: "bg-green-500",
  };

  const mapCenter = ride
    ? status === "em_andamento"
      ? [ride.destino_lng, ride.destino_lat] as [number, number]
      : [ride.origem_lng, ride.origem_lat] as [number, number]
    : undefined;

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Map */}
      <div className="flex-1 relative">
        <GoogleMap className="absolute inset-0 w-full h-full" zoom={14} center={mapCenter} />

        {/* Status pill */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-card/95 backdrop-blur border border-border rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
            <div className={`w-2 h-2 rounded-full ${statusColor[status] || "bg-muted-foreground"}`} />
            <span className="text-xs font-semibold">{statusLabel[status] || status}</span>
            {eta && status !== "solicitada" && status !== "aguardando" && status !== "em_andamento" && (
              <span className="flex items-center gap-1 text-xs text-primary font-bold ml-1">
                <Clock size={12} /> ~{eta} min
              </span>
            )}
            {status === "solicitada" && countdown !== null && countdown > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground ml-1">
                <Clock size={12} /> {countdown}s
              </span>
            )}
            {status === "aguardando" && waitCountdown !== null && (
              <span className={`flex items-center gap-1 text-xs font-bold ml-1 ${waitExpired ? "text-destructive" : "text-amber-500"}`}>
                <Timer size={12} /> {waitExpired ? "Expirado" : formatTime(waitCountdown)}
              </span>
            )}
            {status === "em_andamento" && (
              <span className="flex items-center gap-1 text-xs text-green-500 font-bold ml-1">
                <Clock size={12} /> {formatTime(tripElapsed)}
              </span>
            )}
          </div>
        </div>

        {/* Searching overlay */}
        {status === "solicitada" && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-primary" size={32} />
            {countdown !== null && countdown > 0 && (
              <div className="bg-card/90 border border-border rounded-lg px-3 py-1.5">
                <p className="text-xs text-muted-foreground text-center">Aguardando resposta do motorista</p>
                <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                  <div className="bg-primary h-1.5 rounded-full transition-all duration-1000" style={{ width: `${(countdown / DISPATCH_TIMEOUT) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wait timer overlay (driver) */}
        <AnimatePresence>
          {status === "aguardando" && isDriver && waitCountdown !== null && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-card/95 backdrop-blur border border-border rounded-2xl p-4 shadow-xl min-w-[200px]">
                <div className="flex flex-col items-center gap-2">
                  {!waitExpired ? (
                    <>
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                          <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--secondary))" strokeWidth="4" />
                          <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - waitCountdown / WAIT_TIMER_SECONDS)}`}
                            className="transition-all duration-1000" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{formatTime(waitCountdown)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Aguardando passageiro</p>
                      {canChargeWait && <p className="text-[10px] text-amber-500 font-semibold">⏰ Cobrança de espera ativa</p>}
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={28} className="text-destructive" />
                      <p className="text-xs font-semibold text-destructive">Tempo de espera esgotado</p>
                      <p className="text-[10px] text-muted-foreground text-center">Passageiro não compareceu</p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wait timer overlay (passenger) */}
        <AnimatePresence>
          {status === "aguardando" && !isDriver && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-card/95 backdrop-blur border border-amber-500/50 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Motorista chegou!</p>
                    <p className="text-xs text-muted-foreground">
                      {waitCountdown !== null && waitCountdown > 0
                        ? `Dirija-se ao veículo em ${formatTime(waitCountdown)}`
                        : "Tempo de espera esgotado"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live trip stats overlay (driver) */}
        <AnimatePresence>
          {status === "em_andamento" && isDriver && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-card/95 backdrop-blur border border-border rounded-2xl p-3 shadow-xl flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{tripKm.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground">km</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{formatTime(tripElapsed)}</p>
                  <p className="text-[10px] text-muted-foreground">tempo</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-lg font-bold text-primary">R$ {liveFare.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">parcial</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Card */}
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="bg-card border-t border-border rounded-t-3xl p-5 shadow-[0_-4px_30px_rgba(0,0,0,0.15)]">
        {/* Driver/Passenger info */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-xl font-bold text-primary overflow-hidden">
            {isDriver ? (
              passengerAvatar
                ? <img src={passengerAvatar} alt="" className="w-full h-full object-cover" />
                : passengerName?.[0]?.toUpperCase() || "?"
            ) : (
              driverName?.[0]?.toUpperCase() || "?"
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold">{isDriver ? (passengerName || "Passageiro") : (driverName || "Buscando motorista...")}</p>
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
            {status !== "em_andamento" && (
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-muted-foreground truncate">{ride.origem_endereco}</p>
              </div>
            )}
            <div className="flex items-start gap-2">
              <MapPin size={12} className="text-destructive mt-0.5 shrink-0" />
              <p className="text-muted-foreground truncate">{ride.destino_endereco}</p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              {status === "em_andamento" ? (
                <>
                  <span className="font-bold text-primary">R$ {liveFare.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">{tripKm.toFixed(1)} km</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={10} /> {formatTime(tripElapsed)}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-bold text-primary">R$ {Number(ride.valor || 0).toFixed(2)}</span>
                  {ride.distancia_km && <span className="text-xs text-muted-foreground">{ride.distancia_km} km</span>}
                  {eta && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={10} /> ~{eta} min</span>}
                </>
              )}
            </div>
          </div>
        )}

        {/* Wait timer progress bar */}
        {status === "aguardando" && waitCountdown !== null && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Timer size={12} /> Tempo de espera</span>
              <span className={`text-xs font-bold ${waitExpired ? "text-destructive" : "text-amber-500"}`}>
                {waitExpired ? "Expirado" : formatTime(waitCountdown)}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${waitExpired ? "bg-destructive" : waitCountdown < 60 ? "bg-amber-500" : "bg-primary"}`}
                style={{ width: `${Math.max(0, (waitCountdown / WAIT_TIMER_SECONDS) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        {isDriver && (status === "aceita" || status === "aguardando" || status === "em_andamento") && ride && (
          <div className="flex gap-2 mb-4">
            <Button variant="outline" className="flex-1 h-10 text-xs font-semibold" onClick={openWaze}>
              <Navigation size={14} className="mr-1.5" /> Waze <ExternalLink size={10} className="ml-1 opacity-50" />
            </Button>
            <Button variant="outline" className="flex-1 h-10 text-xs font-semibold" onClick={openGoogleMaps}>
              <MapPin size={14} className="mr-1.5" /> Google Maps <ExternalLink size={10} className="ml-1 opacity-50" />
            </Button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {status === "solicitada" && !isDriver && (
            <Button variant="destructive" className="w-full h-12 font-bold" onClick={() => setShowCancelDialog(true)}>
              <X size={16} className="mr-2" /> Cancelar
            </Button>
          )}
          {status === "aceita" && !isDriver && (
            <Button variant="destructive" className="w-full h-12 font-bold" onClick={() => setShowCancelDialog(true)}>
              <X size={16} className="mr-2" /> Cancelar
            </Button>
          )}
          {status === "aceita" && isDriver && (
            <>
              <Button variant="destructive" className="flex-1 h-12 font-bold" onClick={() => setShowCancelDialog(true)}>
                <X size={16} className="mr-2" /> Cancelar
              </Button>
              <Button className="flex-1 h-12 font-bold bg-amber-500 hover:bg-amber-600 text-white" onClick={handleArrived}>
                <CheckCircle2 size={16} className="mr-2" /> Cheguei ao Local
              </Button>
            </>
          )}
          {status === "aguardando" && isDriver && (
            <>
              {canNoShow ? (
                <Button variant="destructive" className="flex-1 h-12 font-bold" onClick={handleNoShow}>
                  <AlertTriangle size={16} className="mr-2" /> Não Compareceu
                </Button>
              ) : (
                <Button variant="destructive" className="flex-1 h-12 font-bold" onClick={() => setShowCancelDialog(true)}>
                  <X size={16} className="mr-2" /> Cancelar
                </Button>
              )}
              <Button className="flex-1 h-12 font-bold" onClick={handleStart}>
                Iniciar Corrida
              </Button>
            </>
          )}
          {status === "aguardando" && !isDriver && (
            <Button variant="destructive" className="w-full h-12 font-bold" onClick={() => setShowCancelDialog(true)}>
              <X size={16} className="mr-2" /> Cancelar corrida
            </Button>
          )}
          {status === "em_andamento" && isDriver && (
            <Button className="w-full h-12 font-bold" onClick={handleFinish}>
              <CheckCircle2 size={16} className="mr-2" /> Finalizar Viagem
            </Button>
          )}
          {status === "em_andamento" && !isDriver && (
            <div className="w-full text-center py-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Viagem em andamento...
              </div>
            </div>
          )}
        </div>

        {/* Cancel Dialog */}
        <CancelRideDialog
          open={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={handleCancel}
          role={isDriver ? "driver" : "passenger"}
          isDuringTrip={status === "em_andamento"}
          loading={cancelLoading}
        />
      </motion.div>

      {/* Trip Summary Popup */}
      <TripSummaryPopup
        open={showSummary}
        onClose={handleSummaryClose}
        origem={ride?.origem_endereco || ""}
        destino={ride?.destino_endereco || ""}
        distanciaKm={tripSummaryRef.current.km}
        duracaoMin={tripSummaryRef.current.min}
        valor={tripSummaryRef.current.valor}
      />

      {/* Emergency FAB */}
      {(status === "aceita" || status === "aguardando" || status === "em_andamento") && <EmergencyFAB />}
    </div>
  );
};

export default RideActive;
