import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const RatingScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rideId = (location.state as any)?.rideId;
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ride, setRide] = useState<any>(null);

  useEffect(() => {
    if (rideId) {
      supabase.from("rides").select("*").eq("id", rideId).single().then(({ data }) => {
        if (data) setRide(data);
      });
    }
  }, [rideId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Selecione uma avaliação.");
      return;
    }

    setSubmitting(true);
    try {
      if (user && rideId) {
        await supabase.from("ratings").insert({
          ride_id: rideId,
          avaliador_id: user.id,
          avaliado_id: ride?.motorista_id || user.id,
          nota: rating,
          comentario: comment || null,
        });
      }
      toast.success("Avaliação enviada!");
    } catch {
      toast.error("Erro ao enviar avaliação.");
    } finally {
      setSubmitting(false);
      navigate("/passenger");
    }
  };

  const pagamentoLabel: Record<string, string> = { pix: "Pix", card: "Cartão", cash: "Dinheiro" };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm flex flex-col items-center gap-6"
      >
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
          <Star size={36} className="text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold">Como foi sua viagem?</h2>
          <p className="text-sm text-muted-foreground mt-1">Avalie a experiência</p>
        </div>

        {/* Stars */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)} className="p-1 transition-transform hover:scale-110">
              <Star
                size={36}
                className={`transition-all ${s <= rating ? "text-primary fill-primary" : "text-muted"}`}
              />
            </button>
          ))}
        </div>

        {/* Comment */}
        <div className="w-full">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={14} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Comentário (opcional)</span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Conte como foi a experiência..."
            className="w-full h-24 bg-secondary border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Ride Summary */}
        {ride && (
          <div className="w-full bg-card border border-border rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Valor cobrado</span>
              <span className="text-lg font-bold text-primary">R$ {Number(ride.valor).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-muted-foreground">Pagamento</span>
              <span className="text-sm font-medium">{pagamentoLabel[ride.forma_pagamento] || ride.forma_pagamento}</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          className="w-full h-12 font-bold glow-blue"
          disabled={rating === 0 || submitting}
        >
          {submitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
          {submitting ? "Enviando..." : "Enviar avaliação"}
        </Button>

        <button
          onClick={() => navigate("/passenger")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Pular
        </button>
      </motion.div>
    </div>
  );
};

export default RatingScreen;
