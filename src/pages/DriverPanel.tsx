import { useState, useRef } from "react";
import SafetyTips from "@/components/SafetyTips";
import { useNavigate } from "react-router-dom";
import {
  DollarSign, Power, MapPin, Navigation, Banknote, Clock, Loader2,
  Package, CheckCircle, Truck, ArrowRight, Settings, Bell, Gift, Wallet
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
import { motion, AnimatePresence } from "framer-motion";

const DriverPanel = () => {
  const navigate = useNavigate();
  const [online, setOnline] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [tab, setTab] = useState<"corridas" | "envios">("corridas");
  const [searchCenter, setSearchCenter] = useState<[number, number] | undefined>();
  const mapRef = useRef<any>(null);
  const searchMarkerRef = useRef<any>(null);
  const { position, permission, loading: geoLoading, error: geoError, requestLocation } = useGeolocation();

  useDriverLocation(online);
  usePushNotifications(online);
  const { currentRequest, acceptRide, rejectRide, countdown } = useDriverRideRequests(online);
  const { pendingEnvios, myEnvios, acceptEnvio, markColetado, markEntregue } = useDriverEnvios(online);

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
    }
  };
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Painel do Motorista</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/driver/wallet")}
            className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Wallet size={20} />
          </button>
          <button
            onClick={() => navigate("/driver/inbox")}
            className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell size={20} />
          </button>
          <button
            onClick={() => navigate("/driver/referral")}
            className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Gift size={20} />
          </button>
          <button
            onClick={() => navigate("/driver/settings")}
            className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
        <button
          onClick={() => setOnline(!online)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
            online ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"
          }`}
        >
          <Power size={16} />
          {online ? "Online" : "Offline"}
        </button>
      </div>

      {/* Real Map */}
      <div className="flex-1 relative min-h-[250px]">
        <DriverMapSearch
          userPosition={position}
          onSelectPlace={handleSearchSelect}
        />
        <GoogleMap
          className="absolute inset-0 w-full h-full"
          zoom={15}
          center={searchCenter || (position ? [position.lng, position.lat] : undefined)}
          onMapReady={(map) => { mapRef.current = map; }}
        />
        {showPermissionBanner && (
          <LocationPermissionBanner
            permission={permission as any}
            loading={geoLoading}
            error={geoError}
            onRequest={requestLocation}
          />
        )}
        {!showPermissionBanner && !online && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10">
            <p className="text-muted-foreground font-semibold">Fique online para receber corridas</p>
          </div>
        )}
      </div>

      {/* Earnings */}
      <div className="px-4 py-3 bg-card border-t border-border">
        <div className="flex items-center gap-2">
          <DollarSign size={18} className="text-primary" />
          <span className="text-sm text-muted-foreground">Ganhos hoje:</span>
          <span className="text-lg font-bold text-primary">R$ 0,00</span>
        </div>
      </div>

      {/* Safety Tips when offline */}
      {!online && (
        <div className="px-4 py-4 bg-card">
          <SafetyTips role="driver" />
        </div>
      )}

      {/* Tabs */}
      {online && (
        <div className="flex border-b border-border bg-card">
          <button
            onClick={() => setTab("corridas")}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors ${
              tab === "corridas"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
          >
            🚗 Corridas
          </button>
          <button
            onClick={() => setTab("envios")}
            className={`flex-1 py-3 text-sm font-semibold text-center transition-colors relative ${
              tab === "envios"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground"
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

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {online && tab === "corridas" && (
          <motion.div key="corridas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AnimatePresence>
              {currentRequest && (
                <motion.div
                  initial={{ y: 200, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 200, opacity: 0 }}
                  className="p-4 bg-card"
                >
                  <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">Nova corrida</span>
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8">
                          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                            <circle cx="16" cy="16" r="14" fill="none" stroke="hsl(var(--secondary))" strokeWidth="3" />
                            <circle
                              cx="16" cy="16" r="14" fill="none"
                              stroke="hsl(var(--primary))" strokeWidth="3"
                              strokeDasharray={`${(countdown / 15) * 88} 88`}
                              strokeLinecap="round"
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">
                            {countdown}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          R$ {Number(currentRequest.valor || 0).toFixed(2)}
                        </span>
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
                      <span className="flex items-center gap-1">
                        <Navigation size={12} />
                        {currentRequest.distancia_km} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {currentRequest.duracao_min} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Banknote size={12} />
                        {currentRequest.forma_pagamento}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 h-12 font-bold" onClick={rejectRide}>
                        Recusar
                      </Button>
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
          <motion.div key="envios" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-4 overflow-y-auto max-h-[50vh]">
            {myEnvios.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Truck size={14} /> Meus envios ativos
                </p>
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
                      <div className="flex items-center justify-center">
                        <ArrowRight size={12} className="text-muted-foreground" />
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin size={12} className="text-destructive mt-0.5 shrink-0" />
                        <p className="text-xs truncate text-muted-foreground">{envio.entrega_endereco}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{envio.tamanho}</span>
                      <span>•</span>
                      <span>{envio.peso_kg} kg</span>
                      {envio.distancia_km && (
                        <>
                          <span>•</span>
                          <span>{envio.distancia_km} km</span>
                        </>
                      )}
                    </div>
                    {envio.status === "pendente" && (
                      <Button className="w-full h-11 font-bold" onClick={() => markColetado(envio.id)}>
                        <CheckCircle size={16} className="mr-2" />
                        Marcar como Coletado
                      </Button>
                    )}
                    {envio.status === "coletado" && (
                      <Button
                        className="w-full h-11 font-bold bg-success hover:bg-success/90 text-success-foreground"
                        onClick={() => markEntregue(envio.id)}
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Marcar como Entregue
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {pendingEnvios.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={14} /> Envios disponíveis
                </p>
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
                      <div className="flex items-start gap-2">
                        <MapPin size={12} className="text-destructive mt-0.5 shrink-0" />
                        <p className="text-xs truncate text-muted-foreground">{envio.entrega_endereco}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{envio.tamanho}</span>
                      <span>•</span>
                      <span>{envio.peso_kg} kg</span>
                      {envio.distancia_km && (
                        <>
                          <span>•</span>
                          <span>{envio.distancia_km} km</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{envio.forma_pagamento}</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-11 font-bold border-primary text-primary hover:bg-primary/10"
                      onClick={() => acceptEnvio(envio.id)}
                    >
                      <Truck size={16} className="mr-2" />
                      Aceitar Envio
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
  );
};

export default DriverPanel;
