import { useState } from "react";
import { Share2, Copy, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShareTripProps {
  rideId: string;
  origem: string;
  destino: string;
}

const ShareTrip = ({ rideId, origem, destino }: ShareTripProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const generateLink = async () => {
    // Generate a share token
    const shareToken = crypto.randomUUID().slice(0, 8);
    await supabase.from("rides").update({ compartilhar_token: shareToken } as any).eq("id", rideId);
    setToken(shareToken);
    setOpen(true);
  };

  const shareUrl = `${window.location.origin}/ride-track/${token}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar link.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Acompanhe minha viagem",
          text: `Estou indo de ${origem} para ${destino}. Acompanhe em tempo real:`,
          url: shareUrl,
        });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <>
      <button
        onClick={generateLink}
        className="flex items-center gap-2 bg-secondary rounded-full px-4 py-2 text-xs font-semibold text-foreground transition-all active:scale-95"
      >
        <Share2 size={14} />
        Compartilhar viagem
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 flex items-end justify-center"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-t-3xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Compartilhar viagem</h3>
                <button onClick={() => setOpen(false)} className="p-2 rounded-lg bg-secondary">
                  <X size={18} />
                </button>
              </div>

              <p className="text-sm text-muted-foreground">
                Envie este link para alguém acompanhar sua viagem em tempo real.
              </p>

              <div className="flex items-center gap-2 bg-secondary rounded-xl p-3">
                <p className="flex-1 text-xs text-foreground truncate font-mono">{shareUrl}</p>
                <button onClick={handleCopy} className="p-2 rounded-lg bg-primary/10">
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-primary" />}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 font-bold text-sm transition-all active:scale-95"
                >
                  <Share2 size={16} />
                  Enviar link
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Acompanhe minha viagem: ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl px-5 py-3 font-bold text-sm transition-all active:scale-95"
                >
                  WhatsApp
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ShareTrip;
