import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Navigation, DollarSign, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TripSummaryPopupProps {
  open: boolean;
  onClose: () => void;
  origem: string;
  destino: string;
  distanciaKm: number;
  duracaoMin: number;
  valor: number;
}

const TripSummaryPopup = ({
  open,
  onClose,
  origem,
  destino,
  distanciaKm,
  duracaoMin,
  valor,
}: TripSummaryPopupProps) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative w-[90%] max-w-sm bg-card border border-border rounded-3xl p-6 z-10 shadow-2xl"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-secondary">
              <X size={18} className="text-muted-foreground" />
            </button>

            <div className="flex flex-col items-center gap-3 mb-5">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Viagem Concluída!</h2>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-sm text-muted-foreground truncate">{origem}</p>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={12} className="text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground truncate">{destino}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <Navigation size={16} className="mx-auto text-primary mb-1" />
                <p className="text-lg font-bold text-foreground">{distanciaKm.toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground">km</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <Clock size={16} className="mx-auto text-primary mb-1" />
                <p className="text-lg font-bold text-foreground">{Math.round(duracaoMin)}</p>
                <p className="text-[10px] text-muted-foreground">min</p>
              </div>
              <div className="bg-primary/10 rounded-xl p-3 text-center border border-primary/30">
                <DollarSign size={16} className="mx-auto text-primary mb-1" />
                <p className="text-lg font-bold text-primary">R$ {valor.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">total</p>
              </div>
            </div>

            <Button className="w-full h-12 font-bold" onClick={onClose}>
              Avaliar passageiro
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TripSummaryPopup;
