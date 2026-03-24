import { useState, useRef, useEffect, useCallback } from "react";
import SafetyTips from "@/components/SafetyTips";
import { useNavigate } from "react-router-dom";
import {
  DollarSign, Power, MapPin, Navigation, Banknote, Clock, Loader2,
  Package, CheckCircle, Truck, ArrowRight, Settings, Bell, Gift, Wallet, Trophy,
  TrendingUp, Car, BarChart3, AlertTriangle
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

  const [dailyEarnings, setDailyEarnings] = useState(0);
  const [dailyRides, setDailyRides] = useState(0);
  const [completionRate, setCompletionRate] = useState(100);
  const [destModeActive, setDestModeActive] = useState(false);
  const [destModeAddress, setDestModeAddress] = useState<string | undefined>();
  const [showSelfie, setShowSelfie] = useState(false);
  const [selfieVerified, setSelfieVerified] = useState(true);
  const [driverBalance, setDriverBalance] = useState(0);

  useDriverLocation(online);
  usePushNotifications(online);
  const { currentRequest, acceptRide, rejectRide, countdown } = useDriverRideRequests(online);
  const { pendingEnvios, myEnvios, acceptEnvio, markColetado, markEntregue } = useDriverEnvios(online);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: finished } = await supabase
        .from("rides").select("valor, valor_final").eq("motorista_id", user.id)
        .eq("status", "finalizada").gte("finalizada_em", todayStart.toISOString());
      const earnings = (finished || []).reduce((sum, r) => sum + Number((r as any).valor_final || r.valor || 0), 0);
      setDailyEarnings(earnings);
      setDailyRides((finished || []).length);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: allRides } = await supabase
        .from("rides").select("status").eq("motorista_id", user.id).gte("created_at", thirtyDaysAgo);
      if (allRides && allRides.length > 0) {
        const completed = allRides.filter(r => r.status === "finalizada").length;
        setCompletionRate(Math.round((completed / allRides.length) * 100));
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchBalance = async () => {
      const { data } = await supabase.from("profiles").select("driver_balance").eq("id", user.id).single();
      setDriverBalance(Number(data?.driver_balance || 0));
    };
    fetchBalance();
    const channel = supabase
      .channel(`driver-balance-banner-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => setDriverBalance(Number((payload.new as any).driver_balance || 0))
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const checkSelfie = async () => {
      const { count } = await supabase.from("rides").select("id", { count: "exact", head: true })
        .eq("motorista_id", user.id).eq("status", "finalizada");
      const { data: lastVerif } = await (supabase.from("verificacao_selfie").select("*")
        .eq("driver_id", user.id).order("solicitado_em", { ascending: false }).limit(1) as any);
      const totalRides = count || 0;
      if (totalRides > 0 && (totalRides % 50 === 0 || !lastVerif?.length)) setSelfieVerified(false);
    };
    checkSelfie();
  }, [user]);

  const handleAccept = async () => {
    setAccepting(true);
    const rideId = await acceptRide();
    setAccepting(false);
    if (rideId) navigate("/ride-active", { state: { rideId, isDriver: true } });
  };

  const envioCount = pendingEnvios.length + myEnvios.length;
  const showPermissionBanner = permission !== "granted";

  const handleSearchSelect = (lat: number, lng: number, address: string) => {
    setSearchCenter([lng, lat]);
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 16 });
      if (searchMarkerRef.current) searchMarkerRef.current.remove();
      searchMarkerRef.current = new mapboxgl.Marker({ color: "#ef4444" })
        .setLngLat([lng, lat]).setPopup(new mapboxgl.Popup({ offset: 25 }).setText(address)).addTo(mapRef.current);
    }
  };

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
    setSheetTranslate(Math.max(SNAP_EXPANDED, Math.min(SNAP_COLLAPSED, dragStartTranslate.current + diff)));
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (sheetRef.current) sheetRef.current.style.transition = "";
    const points = [SNAP_EXPANDED, SNAP_DEFAULT, SNAP_COLLAPSED];
    const nearest = points.reduce((prev, curr) =>
      Math.abs(curr - sheetTranslate) < Math.abs(prev - sheetTranslate) ? curr : prev
    );
    setSheetTranslate(nearest);
  }, [sheetTranslate]);

  const quickActions = [
    { icon: Wallet, label: "Carteira", path: "/driver/wallet" },
    { icon: BarChart3, label: "Ganhos", path: "/driver/earnings" },
    { icon: Trophy, label: "Conquistas", path: "/driver/achievements" },
    { icon: Gift, label: "Indicar", path: "/driver/referral" },
  ];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden relative">
      {/* Negative Balance Banner */}
      {driverBalance < 20 && (
        <div className="shrink-0 z-20 bg-destructive/10 border-b border-destructive/30 px-4 py-2.5 flex items-center justify-between gap-3 safe-top">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle size={18} className="text-destructive shrink-0" />
            <p className="text-xs font-semibold text-destructive truncate">
              Saldo: R$ {driverBalance.toFixed(2)} • Mínimo R$ 20,00
            </p>
          </div>
          <Button size="sm" variant="destructive" className="shrink-0 text-xs h-7 px-3" onClick={() => navigate("/driver/credits")}>
            Recarregar
          </Button>
        </div>
      )}

      {/* Header */}
      <div className={`p-4 pb-2 flex items-center justify-between shrink-0 z-20 glass-heavy border-b border-border/20 ${driverBalance >= 0 ? "safe-top" : ""}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${online ? "bg-success animate-pulse" : "bg-muted-foreground"}`} />
          <h1 className="text-base font-bold">{online ? "Online" : "Offline"}</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => navigate("/driver/inbox")} className="p-2 rounded-xl bg-secondary/60 text-muted-foreground hover:text-foreground press border border-border/20">
            <Bell size={18} />
          </button>
          <button onClick={() => navigate("/driver/settings")} className="p-2 rounded-xl bg-secondary/60 text-muted-foreground hover:text-foreground press border border-border/20">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Go Online Button */}
      <div className="flex justify-center py-3 shrink-0 z-20">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={async () => {
            if (!online && !selfieVerified) { setShowSelfie(true); return; }
            // Check balance before going online
            if (!online && user) {
              const { data: prof } = await supabase
                .from("profiles")
                .select("driver_balance, is_blocked")
                .eq("id", user.id)
                .single();
              const balance = Number((prof as any)?.driver_balance || 0);
              const blocked = !!(prof as any)?.is_blocked;
              if (blocked || balance < 20) {
                const { toast } = await import("sonner");
                toast.error("Saldo insuficiente. Você precisa ter no mínimo R$ 20,00 para ficar online.", { duration: 6000 });
                navigate("/driver/credits");
                return;
              }
            }
            setOnline(!online);
          }}
          className={`relative flex items-center gap-2.5 px-10 py-3.5 rounded-full font-bold text-sm transition-all duration-300 shadow-xl ${
            online
              ? "bg-primary text-primary-foreground glow-blue"
              : "bg-secondary text-muted-foreground border border-border/30"
          }`}
        >
          {online && (
            <span className="absolute inset-0 rounded-full bg-primary animate-[pulse-btn_2s_ease-in-out_infinite] opacity-30" />
          )}
          <Power size={18} className="relative z-10" />
          <span className="relative z-10">{online ? "Parar" : "Iniciar"}</span>
        </motion.button>
      </div>

      {/* Map */}
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
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10">
            <p className="text-muted-foreground font-semibold text-sm">Fique online para receber corridas</p>
          </div>
        )}
      </div>

      {/* Draggable Bottom Sheet */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bottom-0 z-30 glass-heavy rounded-t-[28px] border-t border-border/30 shadow-[0_-4px_30px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-out"
        style={{ transform: `translateY(${sheetTranslate}px)`, maxHeight: "80vh" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
          <div className="w-9 h-1 rounded-full bg-muted-foreground/25" />
        </div>

        {/* Earnings bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between bg-secondary/40 rounded-2xl p-3 border border-border/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Ganhos hoje</p>
                <p className="text-base font-bold text-primary">R$ {dailyEarnings.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-sm font-bold">{dailyRides}</p>
                <p className="text-[9px] text-muted-foreground">corridas</p>
              </div>
              <div className="text-center">
                <p className={`text-sm font-bold ${completionRate >= 90 ? "text-success" : "text-warning"}`}>{completionRate}%</p>
                <p className="text-[9px] text-muted-foreground">taxa</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        {!online && (
          <div className="px-4 pb-3">
            <div className="flex gap-2">
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => navigate(a.path)}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-secondary/40 border border-border/20 press"
                >
                  <a.icon size={18} className="text-primary" />
                  <span className="text-[10px] font-semibold text-muted-foreground">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Offline content */}
        {!online && !showSelfie && (
          <div className="px-4 pb-4 space-y-3">
            <DestinationMode
              active={destModeActive}
              destinationAddress={destModeAddress}
              onToggle={(active, lat, lng, addr) => {
                setDestModeActive(active);
                setDestModeAddress(addr);
              }}
            />
            <SafetyTips role="driver" />
          </div>
        )}

        {/* Tabs */}
        {online && (
          <div className="flex border-b border-border/30 mx-4">
            {[
              { key: "corridas" as const, label: "🚗 Corridas" },
              { key: "envios" as const, label: "📦 Envios", badge: envioCount },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-sm font-semibold text-center transition-colors relative ${
                  tab === t.key ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {t.label}
                {t.badge && t.badge > 0 ? (
                  <span className="absolute top-2 right-1/4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {t.badge}
                  </span>
                ) : null}
                {tab === t.key && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Tab Content */}
        <div className="overflow-y-auto flex-1" style={{ maxHeight: "50vh" }}>
          <AnimatePresence mode="wait">
            {online && tab === "corridas" && (
              <motion.div key="corridas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AnimatePresence>
                  {currentRequest && (
                    <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }} className="p-4">
                      <div className="bg-primary/8 border border-primary/25 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">Nova corrida</span>
                          <div className="flex items-center gap-3">
                            <div className="relative w-9 h-9">
                              <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
                                <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray={`${(countdown / 15) * 94} 94`} strokeLinecap="round" className="transition-all duration-1000" />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-primary">{countdown}</span>
                            </div>
                            <span className="text-lg font-bold text-primary">R$ {Number(currentRequest.valor || 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            <p className="text-sm truncate">{currentRequest.origem_endereco}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin size={12} className="text-destructive mt-0.5 shrink-0" />
                            <p className="text-sm truncate">{currentRequest.destino_endereco}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Navigation size={12} />{currentRequest.distancia_km} km</span>
                          <span className="flex items-center gap-1"><Clock size={12} />{currentRequest.duracao_min} min</span>
                          <span className="flex items-center gap-1"><Banknote size={12} />{currentRequest.forma_pagamento}</span>
                        </div>
                        <div className="flex gap-2.5">
                          <Button variant="outline" className="flex-1 h-12 font-bold rounded-xl" onClick={rejectRide}>Recusar</Button>
                          <Button className="flex-1 h-12 font-bold glow-blue rounded-xl" onClick={handleAccept} disabled={accepting}>
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
                    <div className="flex flex-col items-center py-10">
                      <div className="w-14 h-14 rounded-full bg-secondary/60 flex items-center justify-center mb-3">
                        <Car size={24} className="text-muted-foreground/40" />
                      </div>
                      <p className="text-sm text-muted-foreground">Aguardando novas corridas...</p>
                    </div>
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
                      <div key={envio.id} className="bg-primary/8 border border-primary/25 rounded-2xl p-4 space-y-3">
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
                          <Button className="w-full h-11 font-bold rounded-xl" onClick={() => markColetado(envio.id)}>
                            <CheckCircle size={16} className="mr-2" />Marcar como Coletado
                          </Button>
                        )}
                        {envio.status === "coletado" && (
                          <Button className="w-full h-11 font-bold rounded-xl bg-success hover:bg-success/90 text-success-foreground" onClick={() => markEntregue(envio.id)}>
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
                      <div key={envio.id} className="bg-card border border-border/50 rounded-2xl p-4 space-y-3">
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
                        <Button variant="outline" className="w-full h-11 font-bold border-primary text-primary hover:bg-primary/10 rounded-xl" onClick={() => acceptEnvio(envio.id)}>
                          <Truck size={16} className="mr-2" />Aceitar Envio
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {pendingEnvios.length === 0 && myEnvios.length === 0 && (
                  <div className="text-center py-10">
                    <Package size={32} className="mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum envio disponível</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Selfie Verification */}
      <AnimatePresence>
        {showSelfie && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background p-6 overflow-y-auto"
          >
            <div className="max-w-md mx-auto pt-8">
              <SelfieVerification
                onVerified={async () => {
                  setSelfieVerified(true); setShowSelfie(false);
                  if (user) {
                    const { data: prof } = await supabase.from("profiles").select("driver_balance, is_blocked").eq("id", user.id).single();
                    if (!!(prof as any)?.is_blocked || Number((prof as any)?.driver_balance || 0) < 20) {
                      const { toast } = await import("sonner");
                      toast.error("Saldo insuficiente. Você precisa ter no mínimo R$ 20,00 para ficar online.", { duration: 6000 });
                      navigate("/driver/credits");
                      return;
                    }
                  }
                  setOnline(true);
                }}
                onSkip={() => { setSelfieVerified(true); setShowSelfie(false); }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Destination Mode when online */}
      {online && (
        <div className="absolute top-[120px] left-4 right-4 z-20">
          <DestinationMode
            active={destModeActive}
            destinationAddress={destModeAddress}
            onToggle={(active, lat, lng, addr) => {
              setDestModeActive(active);
              setDestModeAddress(addr);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DriverPanel;
