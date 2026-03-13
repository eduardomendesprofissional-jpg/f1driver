import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, MessageCircle, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import MapboxMap from "@/components/MapboxMap";

const RideActive = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"arriving" | "in_progress">("arriving");

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Real Map */}
      <div className="flex-1 relative">
        <MapboxMap className="absolute inset-0 w-full h-full" zoom={14} />

        {/* Status Badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
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
