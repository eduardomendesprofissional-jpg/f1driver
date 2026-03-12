import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const RatingScreen = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm flex flex-col items-center gap-6"
      >
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-primary">
          —
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold">Como foi sua viagem?</h2>
          <p className="text-sm text-muted-foreground mt-1">Avalie o motorista</p>
        </div>

        {/* Stars */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)} className="p-1">
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
        <div className="w-full bg-card border border-border rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Valor cobrado</span>
            <span className="text-lg font-bold text-primary">—</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-muted-foreground">Pagamento</span>
            <span className="text-sm font-medium">—</span>
          </div>
        </div>

        <Button
          onClick={() => navigate("/passenger")}
          className="w-full h-12 font-bold glow-blue"
          disabled={rating === 0}
        >
          Enviar avaliação
        </Button>
      </motion.div>
    </div>
  );
};

export default RatingScreen;
