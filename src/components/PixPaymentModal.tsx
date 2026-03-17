import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Copy, Clock, X, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PixPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pixData: {
    qr_code_url: string;
    qr_code_data: string;
    payment_intent_id: string;
    ride_id: string;
  } | null;
}

const PIX_TIMEOUT = 30 * 60; // 30 minutes

const PixPaymentModal = ({ open, onClose, onSuccess, pixData }: PixPaymentModalProps) => {
  const [timeLeft, setTimeLeft] = useState(PIX_TIMEOUT);
  const [checking, setChecking] = useState(false);
  const [paid, setPaid] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open || !pixData) return;

    setTimeLeft(PIX_TIMEOUT);
    setPaid(false);

    // Countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Expired
          clearInterval(timerRef.current!);
          clearInterval(pollingRef.current!);
          toast.error("Tempo para pagamento PIX expirou. Corrida cancelada.");
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Poll every 3 seconds
    pollingRef.current = setInterval(async () => {
      setChecking(true);
      try {
        const { data } = await supabase.functions.invoke("check-pix-status", {
          body: {
            payment_intent_id: pixData.payment_intent_id,
            ride_id: pixData.ride_id,
          },
        });
        if (data?.paid) {
          setPaid(true);
          clearInterval(pollingRef.current!);
          clearInterval(timerRef.current!);
          toast.success("Pagamento PIX confirmado!");
          setTimeout(() => onSuccess(), 1500);
        }
      } catch {}
      setChecking(false);
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open, pixData]);

  const copyCode = () => {
    if (pixData?.qr_code_data) {
      navigator.clipboard.writeText(pixData.qr_code_data);
      toast.success("Código PIX copiado!");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!open || !pixData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-sm mx-4 bg-card border border-border rounded-3xl p-6 z-10"
        >
          {paid ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <CheckCircle2 size={64} className="text-green-500" />
              </motion.div>
              <p className="text-lg font-bold text-foreground">Pagamento confirmado!</p>
              <p className="text-sm text-muted-foreground">Buscando motorista...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-foreground">Pagamento PIX</h2>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary">
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Clock size={16} className="text-amber-500" />
                <span className="text-sm font-bold text-amber-600">
                  Expira em {formatTime(timeLeft)}
                </span>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="bg-white rounded-2xl p-4">
                  <img
                    src={pixData.qr_code_url}
                    alt="QR Code PIX"
                    className="w-48 h-48 object-contain"
                  />
                </div>
              </div>

              {/* Copy code */}
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  Ou copie o código abaixo e cole no app do seu banco
                </p>
                <div className="bg-secondary/50 rounded-xl p-3 flex items-center gap-2">
                  <p className="flex-1 text-xs font-mono text-foreground truncate">
                    {pixData.qr_code_data}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyCode}
                    className="shrink-0"
                  >
                    <Copy size={14} className="mr-1" /> Copiar
                  </Button>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                {checking ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <QrCode size={14} />
                )}
                <span>Aguardando pagamento...</span>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PixPaymentModal;
