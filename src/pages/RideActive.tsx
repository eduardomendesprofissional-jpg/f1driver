import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, MessageCircle, X, Navigation, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const RideActive = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"arriving" | "in_progress">("arriving");

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Mock Map with Route */}
      <div className="flex-1 relative bg-[#0a0a0a]">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={`h-${i}`} className="absolute w-full h-px bg-primary" style={{ top: `${i * 5}%` }} />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={`v-${i}`} className="absolute h-full w-px bg-primary" style={{ left: `${i * 5}%` }} />
          ))}
        </div>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 30 70 Q 50 30 70 35" stroke="hsl(210 100% 56%)" strokeWidth="0.8" fill="none" strokeDasharray="2 1" />
        </svg>
        <div className="absolute top-[68%] left-[28%] w-3 h-3 rounded-full bg-primary animate-pulse-glow" />
        <motion.div
          animate={{ x: status === "arriving" ? [0, 5, 10] : [10, 15, 20], y: status === "arriving" ? [0, -5, -10] : [-10, -15, -18] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-[50%] left-[50%]"
        >
          <Navigation size={24} className="text-primary" />
        </motion.div>
        <div className="absolute top-[33%] left-[68%] w-3 h-3 rounded-full bg-destructive" />

        {/* Status Badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <div className="bg-card border border-border rounded-full px-4 py-2 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === "arriving" ? "bg-primary animate-pulse" : "bg-success"}`} />
            <span className="text-xs font-semibold">
              {status === "arriving" ? "Motorista a caminho" : "Em viagem"}
            </span>
          </div>
        </div>
      </div>

      {/* Driver Card */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-card border-t border-border rounded-t-2xl p-5"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-xl font-bold text-primary">
            —
          </div>
          <div className="flex-1">
            <p className="font-bold">—</p>
            <div className="flex items-center gap-1">
              <Star size={14} className="text-primary fill-primary" />
              <span className="text-sm text-muted-foreground">—</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Phone size={18} className="text-primary" />
            </button>
            <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <MessageCircle size={18} className="text-primary" />
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          {status === "arriving" ? (
            <>
              <Button
                variant="destructive"
                className="flex-1 h-12 font-bold"
                onClick={() => navigate("/passenger")}
              >
                <X size={16} className="mr-2" /> Cancelar
              </Button>
              <Button
                className="flex-1 h-12 font-bold"
                onClick={() => setStatus("in_progress")}
              >
                Embarcar
              </Button>
            </>
          ) : (
            <Button
              className="w-full h-12 font-bold"
              onClick={() => navigate("/rating")}
            >
              Finalizar viagem
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RideActive;
