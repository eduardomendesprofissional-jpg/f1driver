import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  countdown: number | null;
  attempt: number;
  expanded: boolean;
  noDrivers: boolean;
  origin: string;
  destination: string;
  valor: number | null;
  onCancel: () => void;
  totalSeconds?: number;
}

export const PassengerSearchingOverlay = ({
  open,
  countdown,
  attempt,
  expanded,
  noDrivers,
  origin,
  destination,
  valor,
  onCancel,
  totalSeconds = 15,
}: Props) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-background/95 backdrop-blur-xl flex flex-col"
        >
          {/* Radar animado */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            {!noDrivers ? (
              <div className="relative w-56 h-56 flex items-center justify-center">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-primary/40"
                    initial={{ scale: 0.4, opacity: 0.8 }}
                    animate={{ scale: 1.2, opacity: 0 }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
                  />
                ))}
                <div className="relative w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-2xl">
                    <Loader2 className="text-primary-foreground animate-spin" size={28} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-destructive/15 flex items-center justify-center mb-2">
                <AlertCircle size={40} className="text-destructive" />
              </div>
            )}

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-center mt-8 space-y-2"
            >
              <h1 className="text-2xl font-black">
                {noDrivers ? "Nenhum motorista disponível" : "Procurando motorista..."}
              </h1>
              <p className="text-sm text-muted-foreground max-w-xs">
                {noDrivers
                  ? "Tentamos diversos motoristas, mas ninguém aceitou. Tente novamente em alguns minutos."
                  : expanded
                    ? "Expandindo busca para 10 km..."
                    : "Buscando o motorista mais próximo (5 km)"}
              </p>
              {!noDrivers && countdown !== null && countdown > 0 && (
                <div className="pt-4">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                    {attempt > 0 ? `Tentativa ${attempt + 1}` : "Aguardando resposta"}
                  </div>
                  <div className="w-48 mx-auto h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      style={{ width: `${(countdown / totalSeconds) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Resumo + ação */}
          <div className="p-6 pb-10 space-y-4 bg-gradient-to-t from-background to-transparent">
            <div className="bg-card/60 border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-sm flex-1 truncate">{origin}</p>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-destructive mt-0.5 shrink-0" />
                <p className="text-sm flex-1 truncate">{destination}</p>
              </div>
              {valor !== null && (
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">Valor estimado</span>
                  <span className="text-lg font-black text-primary">R$ {Number(valor).toFixed(2)}</span>
                </div>
              )}
            </div>

            <Button
              variant={noDrivers ? "default" : "outline"}
              className="w-full h-14 font-bold rounded-2xl border-2"
              onClick={onCancel}
            >
              <X size={18} className="mr-2" />
              {noDrivers ? "Voltar" : "Cancelar corrida"}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
