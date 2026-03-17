import { useState, useEffect, useRef } from "react";
import { AlertTriangle, Phone, Shield, X, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface SOSButtonProps {
  rideId?: string;
  origem?: string;
  destino?: string;
}

const COUNTDOWN_SECONDS = 5;

const SOSButton = ({ rideId, origem, destino }: SOSButtonProps) => {
  const [activated, setActivated] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [triggered, setTriggered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!activated) {
      setCountdown(COUNTDOWN_SECONDS);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activated]);

  const triggerSOS = () => {
    setTriggered(true);
    setActivated(false);
    if (timerRef.current) clearInterval(timerRef.current);

    // Get current position and share
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const message = `🚨 EMERGÊNCIA! Preciso de ajuda!\n📍 Localização: ${mapsUrl}\n🚗 Corrida: ${origem || "?"} → ${destino || "?"}\nID: ${rideId || "N/A"}`;

        // Try to share
        if (navigator.share) {
          navigator.share({ title: "🚨 SOS - Emergência", text: message }).catch(() => {});
        }

        toast.error("🚨 SOS ativado! Compartilhe sua localização com contatos de confiança.", { duration: 10000 });
      },
      () => {
        toast.error("🚨 SOS ativado! Ligue 190 para emergências.", { duration: 10000 });
      }
    );
  };

  const handleCancel = () => {
    setActivated(false);
    toast.info("SOS cancelado.");
  };

  if (triggered) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-destructive" />
          <span className="text-sm font-bold text-destructive">SOS Ativado</span>
        </div>
        <div className="flex gap-2">
          <a
            href="tel:190"
            className="flex-1 flex items-center justify-center gap-2 bg-destructive text-destructive-foreground rounded-xl py-3 font-bold text-sm"
          >
            <Phone size={16} /> Ligar 190
          </a>
          <a
            href="tel:192"
            className="flex-1 flex items-center justify-center gap-2 bg-amber-600 text-white rounded-xl py-3 font-bold text-sm"
          >
            <Phone size={16} /> SAMU 192
          </a>
        </div>
        <button
          onClick={() => setTriggered(false)}
          className="w-full text-xs text-muted-foreground text-center py-1"
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {activated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-destructive/90 flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                <span className="text-6xl font-black text-white">{countdown}</span>
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">SOS ATIVADO</h2>
                <p className="text-white/80 text-sm mt-2">
                  Emergência será disparada em {countdown} segundos
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="bg-white text-destructive rounded-full px-8 py-3 font-bold text-sm"
              >
                CANCELAR SOS
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setActivated(true)}
        className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95"
      >
        <Shield size={14} />
        SOS
      </button>
    </>
  );
};

export default SOSButton;
