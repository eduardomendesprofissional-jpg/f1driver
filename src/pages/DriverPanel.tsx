import { useState, useRef, useEffect, useCallback } from "react";
import SafetyTips from "@/components/SafetyTips";
import { useNavigate } from "react-router-dom";
import {
  DollarSign, Power, MapPin, Navigation, Banknote, Clock, Loader2,
  Package, CheckCircle, Truck, ArrowRight, Settings, Bell, Gift, Wallet, Trophy,
  TrendingUp, Car, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import GoogleMap from "@/components/GoogleMap";
import DriverMapSearch from "@/components/DriverMapSearch";
import LocationPermissionBanner from "@/components/LocationPermissionBanner";
import { useDriverLocation } from "@/hooks/useDriverLocation";
import { useDriverRideRequests } from "@/hooks/useDriverRideRequests";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useDriverEnvios } from "@/hooks/useDriverEnvios";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import mapboxgl from "mapbox-gl";
import DestinationMode from "@/components/DestinationMode";
import SelfieVerification from "@/components/SelfieVerification";

const DriverPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [online, setOnline] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [tab, setTab] = useState<"corridas" | "envios">("corridas");
  const [searchCenter, setSearchCenter] = useState<[number, number] | undefined>();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const { position, permission, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();

  // Daily stats
  const [dailyEarnings, setDailyEarnings] = useState(0);
  const [dailyRides, setDailyRides] = useState(0);
  const [completionRate, setCompletionRate] = useState(100);
  const [destModeActive, setDestModeActive] = useState(false);
  const [destModeAddress, setDestModeAddress] = useState<string | undefined>();
  const [showSelfie, setShowSelfie] = useState(false);
  const [selfieVerified, setSelfieVerified] = useState(true);

  useDriverLocation(online);
  usePushNotifications(online);
  const { currentRequest, acceptRide, rejectRide, countdown } = useDriverRideRequests(online);
  const { pendingEnvios, myEnvios, acceptEnvio, markColetado, markEntregue } = useDriverEnvios(online);

  // Fetch daily stats
  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      const { data: finished } = await supabase
        .from("rides")
        .select("valor, valor_final")
        .eq("motorista_id", user.id)
        .eq("status", "finalizada")
        .gte("finalizada_em", todayISO);

      const earnings = (finished || []).reduce((sum, r) => sum + Number((r as any).valor_final || r.valor || 0), 0);
      setDailyEarnings(earnings);
      setDailyRides((finished || []).length);

      // Completion rate (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: allRides } = await supabase
        .from("rides")
        .select("status")
        .eq("motorista_id", user.id)
        .gte("created_at", thirtyDaysAgo);

      if (allRides && allRides.length > 0) {
        const completed = allRides.filter(r => r.status === "finalizada").length;
        setCompletionRate(Math.round((completed / allRides.length) * 100));
      }
    };
    fetchStats();

    // Refresh every 30s
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleAccept = async () => {
    setAccepting(true);
    const rideId = await acceptRide();
    setAccepting(false);
    if (rideId) {
      navigate("/ride-active", { state: { rideId, isDriver: true } });
    }
  };

  const envioCount = pendingEnvios.length + myEnvios.length;
  const showPermissionBanner = permission !== "granted";

  const handleSearchSelect = (lat: number, lng: number, address: string) => {
    setSearchCenter([lng, lat]);
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 16 });

      // Remove previous search marker
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
      }

      // Add red destination marker
      searchMarkerRef.current = new mapboxgl.Marker({ color: "#ef4444" })
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(address))
        .addTo(mapRef.current);
    }
  };

  // Bottom sheet drag logic
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartTranslate = useRef(0);
  const [sheetTranslate, setSheetTranslate] = useState(0);
  const SNAP_EXPANDED = -200;
  const SNAP_DEFAULT = 0;
  const SNAP_COLLAPSED = 300;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragStartTranslate.current = sheetTranslate;
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  }, [sheetTranslate]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const diff = e.touches[0].clientY - dragStartY.current;
    const newT = Math.max(SNAP_EXPANDED, Math.min(SNAP_COLLAPSED, dragStartTranslate.current + diff));
    setSheetTranslate(newT);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (sheetRef.current) sheetRef.current.style.transition = "";
    const points = [SNAP_EXPANDED, SNAP_DEFAULT, SNAP_COLLAPSED];
    const nearest = points.reduce((prev, curr) =>
      Math.abs(curr - sheetTranslate) < Math.abs(prev - sheetTranslate) ? curr : prev
    );
    setSheetTranslate(nearest);
  }, [sheetTranslate]);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="p-4 flex items-center justify-between shrink-0 z-20 bg-background">
        <h1 className="text-lg font-bold">Painel do Motorista</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/driver/wallet")} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Wallet size={20} />
          </button>
          <button onClick={() => navigate("/driver/inbox")} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Bell size={20} />
          </button>
          <button onClick={() => navigate("/driver/referral")} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Gift size={20} />
          </button>
          <button onClick={() => navigate("/driver/earnings")} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <BarChart3 size={20} />
          </button>
          <button onClick={() => navigate("/driver/achievements")} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Trophy size={20} />
          </button>
          <button onClick={() => navigate("/driver/settings")} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Botão Iniciar/Parar */}
      <div className="flex justify-center py-3 shrink-0 z-20 bg-background">
        <button
          onClick={() => setOnline(!online)}
          className={`relative flex items-center gap-2 px-8 py-3 rounded-full font-bold text-sm transition-all shadow-lg ${
            online ? "bg-blue-400 text-white shadow-blue-400/40" : "bg-blue-900 text-blue-200 shadow-blue-900/40"
          }`}
        >
          <span className={`absolute inset-0 rounded-full ${online ? "bg-blue-400" : "bg-blue-900"} animate-[pulse-btn_2s_ease-in-out_infinite] opacity-40`} />
          <Power size={18} className="relative z-10" />
          <span className="relative z-10">{online ? "Parar" : "Iniciar"}</span>
        </button>
      </div>

      {/* Full Map */}
      <div className="flex-1 relative">
        <DriverMapSearch userPosition={position} onSelectPlace={handleSearchSelect} />
        <GoogleMap
          className="absolute inset-0 w-full h-full"
          zoom={15}
          center={searchCenter || (position ? [position.lng, position.lat] : undefined)}
          onMapReady={(map) => { mapRef.current = map; }}
        />
        {showPermissionBanner && (
          <LocationPermissionBanner permission={permission as any} loading={geoLoading} error={geoError} onRequest={requestLocation} />
        )}
        {!showPermissionBanner && !online && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10">
            <p className="text-muted-foreground font-semibold">Fique online para receber corridas</p>
          </div>
        )}
      </div>

      {/* Draggable Bottom Sheet */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bottom-0 z-30 bg-card rounded-t-3xl shadow-[0_-4px_30px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-out"
        style={{ transform: `translateY(${sheetTranslate}px)`, maxHeight: "80vh" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Earnings */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-primary" />
              <span className="text-sm text-muted-foreground">Ganhos hoje:</span>
              <span className="text-lg font-bold text-primary">R$ {dailyEarnings.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Car size={14} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">{dailyRides}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp size={14} className={completionRate >= 90 ? "text-green-500" : "text-amber-500"} />
                <span className="text-xs font-semibold text-foreground">{completionRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Safety Tips when offline */}
        {!online && (
          <div className="px-4 py-4">
            <SafetyTips role="driver" />
          </div>
        )}

        {/* Tabs */}
        {online && (
          <div className="flex border-b border-border">
            <button
              onClick={() => setTab("corridas")}
              className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
                tab === "corridas" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              🚗 Corridas
            </button>
            <button
              onClick={() => setTab("envios")}
              className={`flex-1 py-3 text-sm font-semibold text-center transition-colors relative ${
                tab === "envios" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              📦 Envios
              {envioCount > 0 && (
                <span className="absolute top-2 right-1/4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {envioCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Tab Content - scrollable */}
        <div className="overflow-y-auto flex-1" style={{ maxHeight: "50vh" }}>
          <AnimatePresence mode="wait">
            {online && tab === "corridas" && (
              <motion.div key="corridas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AnimatePresence>
                  {currentRequest && (
                    <motion.div
                      initial={{ y: 200, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 200, opacity: 0 }}
                      className="p-4"
                    >
                      <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">Nova corrida</span>
                          <div className="flex items-center gap-3">
                            <div className="relative w-8 h-8">
                              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                                <circle cx="16" cy="16" r="14" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
                                <circle cx="16" cy="16" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray={`${(countdown / 15) * 88} 88`} strokeLinecap="round" className="transition-all duration-1000" />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">{countdown}</span>
                            </div>
                            <span className="text-lg font-bold text-primary">R$ {Number(currentRequest.valor || 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary mt-1 shrink-0" />
                            <p className="text-sm truncate">{currentRequest.origem_endereco}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin size={14} className="text-destructive mt-0.5 shrink-0" />
                            <p className="text-sm truncate">{currentRequest.destino_endereco}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Navigation size={12} />{currentRequest.distancia_km} km</span>
                          <span className="flex items-center gap-1"><Clock size={12} />{currentRequest.duracao_min} min</span>
                          <span className="flex items-center gap-1"><Banknote size={12} />{currentRequest.forma_pagamento}</span>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" className="flex-1 h-12 font-bold" onClick={rejectRide}>Recusar</Button>
                          <Button className="flex-1 h-12 font-bold glow-blue" onClick={handleAccept} disabled={accepting}>
                            {accepting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                            Aceitar
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {!currentRequest && (
                  <div className="p-4 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Solicitações</p>
                    <p className="text-sm text-muted-foreground text-center py-8">Aguardando novas corridas...</p>
                  </div>
                )}
              </motion.div>
            )}

            {online && tab === "envios" && (
              <motion.div key="envios" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-4">
                {myEnvios.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5"><Truck size={14} /> Meus envios ativos</p>
                    {myEnvios.map((envio) => (
                      <div key={envio.id} className="bg-primary/10 border border-primary/30 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-primary" />
                            <span className="text-sm font-semibold truncate max-w-[150px]">{envio.descricao}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={envio.status === "coletado" ? "default" : "secondary"} className="text-[10px]">
                              {envio.status === "pendente" ? "Aceito" : "Coletado"}
                            </Badge>
                            <span className="text-sm font-bold text-primary">R$ {Number(envio.valor || 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            <p className="text-xs truncate text-muted-foreground">{envio.coleta_endereco}</p>
                          </div>
                          <div className="flex items-center justify-center"><ArrowRight size={12} className="text-muted-foreground" /></div>
                          <div className="flex items-start gap-2">
                            <MapPin size={12} className="text-destructive mt-0.5 shrink-0" />
                            <p className="text-xs truncate text-muted-foreground">{envio.entrega_endereco}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{envio.tamanho}</span><span>•</span><span>{envio.peso_kg} kg</span>
                          {envio.distancia_km && (<><span>•</span><span>{envio.distancia_km} km</span></>)}
                        </div>
                        {envio.status === "pendente" && (
                          <Button className="w-full h-11 font-bold" onClick={() => markColetado(envio.id)}>
                            <CheckCircle size={16} className="mr-2" />Marcar como Coletado
                          </Button>
                        )}
                        {envio.status === "coletado" && (
                          <Button className="w-full h-11 font-bold bg-success hover:bg-success/90 text-success-foreground" onClick={() => markEntregue(envio.id)}>
                            <CheckCircle size={16} className="mr-2" />Marcar como Entregue
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {pendingEnvios.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Package size={14} /> Envios disponíveis</p>
                    {pendingEnvios.map((envio) => (
                      <div key={envio.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package size={16} className="text-muted-foreground" />
                            <span className="text-sm font-semibold truncate max-w-[150px]">{envio.descricao}</span>
                          </div>
                          <span className="text-sm font-bold text-primary">R$ {Number(envio.valor || 0).toFixed(2)}</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            <p className="text-xs truncate text-muted-foreground">{envio.coleta_endereco}</p>
                          </div>
                          <div className="flex items-center justify-center"><ArrowRight size={12} className="text-muted-foreground" /></div>
                          <div className="flex items-start gap-2">
                            <MapPin size={12} className="text-destructive mt-0.5 shrink-0" />
                            <p className="text-xs truncate text-muted-foreground">{envio.entrega_endereco}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{envio.tamanho}</span><span>•</span><span>{envio.peso_kg} kg</span>
                          {envio.distancia_km && (<><span>•</span><span>{envio.distancia_km} km</span></>)}
                          <span>•</span><span>{envio.forma_pagamento}</span>
                        </div>
                        <Button variant="outline" className="w-full h-11 font-bold border-primary text-primary hover:bg-primary/10" onClick={() => acceptEnvio(envio.id)}>
                          <Truck size={16} className="mr-2" />Aceitar Envio
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {pendingEnvios.length === 0 && myEnvios.length === 0 && (
                  <div className="text-center py-8">
                    <Package size={32} className="mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum envio disponível no momento</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default DriverPanel;
