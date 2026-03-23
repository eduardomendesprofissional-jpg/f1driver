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
    encoded_image?: string;
    payload?: string;
    qr_code_url?: string;
    qr_code_data?: string;
    payment_intent_id?: string;
    ride_id: string;
    expiration_date?: string;
  } | null;
}

const PIX_TIMEOUT = 30 * 60; // 30 minutes

const PixPaymentModal = ({ open, onClose, onSuccess, pixData }: PixPaymentModalProps) => {
  const [timeLeft, setTimeLeft] = useState(PIX_TIMEOUT);
  const [paid, setPaid] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Realtime subscription to rides table
  useEffect(() => {
    if (!open || !pixData?.ride_id) return;

    setTimeLeft(PIX_TIMEOUT);
    setPaid(false);

    // Countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          toast.error("Tempo para pagamento PIX expirou.");
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Realtime: listen for payment_status changes on this ride
    const channel = supabase
      .channel(`pix-ride-${pixData.ride_id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
          filter: `id=eq.${pixData.ride_id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          if (updated.payment_status === "paid") {
            setPaid(true);
            clearInterval(timerRef.current!);
            toast.success("Pagamento PIX confirmado!");
            setTimeout(() => onSuccess(), 1500);
          }
        }
      )
      .subscribe();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [open, pixData?.ride_id]);

  const qrImageSrc = pixData?.encoded_image
    ? `data:image/png;base64,${pixData.encoded_image}`
    : pixData?.qr_code_url || "";

  const copyPayload = pixData?.payload || pixData?.qr_code_data || "";

  const handleCopy = async () => {
    if (!copyPayload) return;
    try {
      await navigator.clipboard.writeText(copyPayload);
      toast.success("Código PIX copiado!");
    } catch {
      toast.error("Erro ao copiar. Tente manualmente.");
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
              <Loader2 size={20} className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <QrCode size={16} className="text-primary" />
                  </div>
                  <h2 className="font-bold text-lg text-foreground">Pagar com PIX</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 mb-5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Clock size={16} className="text-amber-500" />
                <span className="text-sm font-bold text-amber-500">
                  Expira em {formatTime(timeLeft)}
                </span>
              </div>

              {/* QR Code */}
              {qrImageSrc && (
                <div className="flex justify-center mb-5">
                  <div className="bg-white rounded-2xl p-4 shadow-lg">
                    <img
                      src={qrImageSrc}
                      alt="QR Code PIX"
                      className="w-52 h-52 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Copy code */}
              {copyPayload && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground text-center">
                    Ou copie o código e cole no app do seu banco
                  </p>
                  <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
                    <p className="text-[11px] font-mono text-foreground break-all leading-relaxed line-clamp-3">
                      {copyPayload}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="w-full gap-2"
                    >
                      <Copy size={14} />
                      Copiar código PIX
                    </Button>
                  </div>
                </div>
              )}

              {/* Waiting indicator */}
              <div className="flex items-center justify-center gap-2 mt-5 py-3 bg-secondary/30 rounded-xl">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-medium">
                  Aguardando pagamento...
                </span>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PixPaymentModal;
