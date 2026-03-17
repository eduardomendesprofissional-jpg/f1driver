import { useState, useRef, useCallback } from "react";
import { Camera, Loader2, CheckCircle, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SelfieVerificationProps {
  onVerified: () => void;
  onSkip?: () => void;
}

const SelfieVerification = ({ onVerified, onSkip }: SelfieVerificationProps) => {
  const { user } = useAuth();
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verified, setVerified] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setCapturing(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 480, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      toast.error("Não foi possível acessar a câmera.");
      setCapturing(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCapturing(false);
  }, []);

  const takeSelfie = async () => {
    if (!videoRef.current || !canvasRef.current || !user) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 480;
    canvas.height = 480;
    ctx.drawImage(videoRef.current, 0, 0, 480, 480);

    stopCamera();
    setUploading(true);

    try {
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.8)
      );

      const fileName = `selfie_${user.id}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, { contentType: "image/jpeg", upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);

      await (supabase.from("verificacao_selfie").insert({
        driver_id: user.id,
        foto_url: urlData.publicUrl,
        status: "verificado",
        respondido_em: new Date().toISOString(),
        resultado: "aprovado",
      }) as any);

      setVerified(true);
      toast.success("Identidade verificada com sucesso! ✅");
      setTimeout(onVerified, 1500);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar selfie. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  if (verified) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 flex flex-col items-center gap-3"
      >
        <CheckCircle size={48} className="text-green-500" />
        <p className="text-sm font-bold text-green-500">Identidade verificada!</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-500">Verificação de identidade</p>
          <p className="text-xs text-muted-foreground mt-1">
            Por segurança, tire uma selfie para confirmar sua identidade antes de continuar.
          </p>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <AnimatePresence>
        {capturing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative rounded-2xl overflow-hidden bg-black aspect-square"
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{ transform: "scaleX(-1)" }}
            />
            <div className="absolute inset-0 border-4 border-primary/50 rounded-2xl pointer-events-none" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
              <button
                onClick={stopCamera}
                className="w-12 h-12 rounded-full bg-secondary/80 flex items-center justify-center"
              >
                <X size={20} />
              </button>
              <button
                onClick={takeSelfie}
                disabled={uploading}
                className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg transition-transform active:scale-90"
              >
                {uploading ? <Loader2 size={24} className="animate-spin" /> : <Camera size={28} />}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={startCamera}
            className="w-full flex flex-col items-center gap-3 bg-secondary rounded-2xl py-8 transition-all active:scale-[0.98]"
          >
            <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
              <Camera size={32} className="text-primary" />
            </div>
            <span className="text-sm font-bold">Tirar selfie</span>
          </motion.button>
        )}
      </AnimatePresence>

      {onSkip && (
        <button
          onClick={onSkip}
          className="w-full text-xs text-muted-foreground text-center py-2"
        >
          Pular por agora
        </button>
      )}
    </div>
  );
};

export default SelfieVerification;
