import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, Power, MapPin, Navigation, Banknote, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MapboxMap from "@/components/MapboxMap";
import { useDriverLocation } from "@/hooks/useDriverLocation";
import { useDriverRideRequests } from "@/hooks/useDriverRideRequests";
import { motion, AnimatePresence } from "framer-motion";

const DriverPanel = () => {
  const navigate = useNavigate();
  const [online, setOnline] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useDriverLocation(online);
  const { currentRequest, acceptRide, rejectRide, countdown } = useDriverRideRequests(online);

  const handleAccept = async () => {
    setAccepting(true);
    const rideId = await acceptRide();
    setAccepting(false);
    if (rideId) {
      navigate("/ride-active", { state: { rideId, isDriver: true } });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Painel do Motorista</h1>
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
      <div className="flex-1 relative min-h-[300px]">
        <MapboxMap className="absolute inset-0 w-full h-full" zoom={14} />

        {!online && (
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

      {/* Ride Request Card */}
      <AnimatePresence>
        {online && currentRequest && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="p-4 bg-card border-t border-border"
          >
            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Nova corrida</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
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
                <Button
                  variant="outline"
                  className="flex-1 h-12 font-bold"
                  onClick={rejectRide}
                >
                  Recusar
                </Button>
                <Button
                  className="flex-1 h-12 font-bold glow-blue"
                  onClick={handleAccept}
                  disabled={accepting}
                >
                  {accepting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                  Aceitar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiting message */}
      {online && !currentRequest && (
        <div className="p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Solicitações</p>
          <p className="text-sm text-muted-foreground text-center py-8">Aguardando novas corridas...</p>
        </div>
      )}
    </div>
  );
};

export default DriverPanel;
