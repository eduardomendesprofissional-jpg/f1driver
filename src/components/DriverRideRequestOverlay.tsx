import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Clock, Banknote, Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RideRequest {
  id: string;
  origem_endereco: string;
  destino_endereco: string;
  distancia_km: number | null;
  duracao_min: number | null;
  valor: number | null;
  forma_pagamento: string;
}

interface Props {
  request: RideRequest | null;
  countdown: number;
  accepting: boolean;
  onAccept: () => void;
  onReject: () => void;
  totalSeconds?: number;
}

const formaPagamentoLabel = (fp: string) => {
  switch (fp) {
    case "dinheiro": return "Dinheiro";
    case "pix": return "PIX";
    case "maquininha": case "card": return "Maquininha";
    default: return fp;
  }
};

export const DriverRideRequestOverlay = ({
  request,
  countdown,
  accepting,
  onAccept,
  onReject,
  totalSeconds = 15,
}: Props) => {
  const progress = Math.max(0, Math.min(1, countdown / totalSeconds));
  // Circumference for r=70 → 2π·70 ≈ 439.8
  const dash = progress * 439.8;

  return (
    <AnimatePresence>
      {request && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col"
        >
          {/* Timer + Valor */}
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center pt-12 pb-6"
          >
            <div className="relative w-40 h-40">
              <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
                <circle
                  cx="80" cy="80" r="70" fill="none"
                  stroke="hsl(var(--primary))" strokeWidth="6"
                  strokeDasharray={`${dash} 439.8`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-primary tabular-nums">{countdown}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">segundos</span>
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mt-4">Nova corrida</p>
            <p className="text-4xl font-black text-foreground mt-1">R$ {Number(request.valor || 0).toFixed(2)}</p>
          </motion.div>

          {/* Detalhes */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex-1 px-6 space-y-4 overflow-y-auto"
          >
            <div className="bg-card/60 border border-border rounded-2xl p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-3 h-3 rounded-full bg-primary mt-1.5 shrink-0 ring-4 ring-primary/20" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Origem</p>
                  <p className="text-sm font-semibold">{request.origem_endereco}</p>
                </div>
              </div>
              <div className="ml-1.5 border-l-2 border-dashed border-border h-3" />
              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-destructive mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Destino</p>
                  <p className="text-sm font-semibold">{request.destino_endereco}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-card/60 border border-border rounded-xl p-3 flex flex-col items-center">
                <Navigation size={16} className="text-primary mb-1" />
                <span className="text-xs font-bold">{Number(request.distancia_km || 0).toFixed(1)} km</span>
              </div>
              <div className="bg-card/60 border border-border rounded-xl p-3 flex flex-col items-center">
                <Clock size={16} className="text-primary mb-1" />
                <span className="text-xs font-bold">{Math.round(Number(request.duracao_min || 0))} min</span>
              </div>
              <div className="bg-card/60 border border-border rounded-xl p-3 flex flex-col items-center">
                <Banknote size={16} className="text-primary mb-1" />
                <span className="text-xs font-bold">{formaPagamentoLabel(request.forma_pagamento)}</span>
              </div>
            </div>
          </motion.div>

          {/* Botões */}
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="p-6 pb-10 grid grid-cols-2 gap-3 bg-gradient-to-t from-background to-transparent"
          >
            <Button
              variant="outline"
              className="h-16 text-base font-bold rounded-2xl border-2"
              onClick={onReject}
              disabled={accepting}
            >
              <X size={20} className="mr-2" />
              Recusar
            </Button>
            <Button
              className="h-16 text-base font-bold rounded-2xl glow-blue"
              onClick={onAccept}
              disabled={accepting}
            >
              {accepting ? <Loader2 className="animate-spin mr-2" size={20} /> : <Check size={20} className="mr-2" />}
              Aceitar
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
