import { useState } from "react";
import { motion } from "framer-motion";
import { Navigation, DollarSign, MapPin, Check, X, Power } from "lucide-react";
import { Button } from "@/components/ui/button";

const DriverPanel = () => {
  const [online, setOnline] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Painel do Motorista</h1>
        <button
          onClick={() => setOnline(!online)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
            online ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"
          }`}
        >
          <Power size={16} />
          {online ? "Online" : "Offline"}
        </button>
      </div>

      {/* Mock Map */}
      <div className="flex-1 relative bg-[#0a0a0a] min-h-[300px]">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={`h-${i}`} className="absolute w-full h-px bg-primary" style={{ top: `${i * 5}%` }} />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={`v-${i}`} className="absolute h-full w-px bg-primary" style={{ left: `${i * 5}%` }} />
          ))}
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 rounded-full bg-primary animate-pulse-glow" />
        </div>

        {!online && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <p className="text-muted-foreground font-semibold">Fique online para receber corridas</p>
          </div>
        )}
      </div>

      {/* Earnings */}
      <div className="px-4 py-3 bg-card border-t border-border">
        <div className="flex items-center gap-2">
          <DollarSign size={18} className="text-primary" />
          <span className="text-sm text-muted-foreground">Ganhos hoje:</span>
          <span className="text-lg font-bold text-primary">R$ 0,00</span>
        </div>
      </div>

      {/* Ride Requests */}
      {online && (
        <div className="p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Solicitações</p>
          <p className="text-sm text-muted-foreground text-center py-8">Aguardando novas corridas...</p>
        </div>
      )}
    </div>
  );
};

export default DriverPanel;
