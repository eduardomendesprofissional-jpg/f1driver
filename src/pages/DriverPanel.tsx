import { useState } from "react";
import { motion } from "framer-motion";
import { Navigation, DollarSign, MapPin, Check, X, Power } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockRequests = [
  { id: 1, from: "Av. Paulista, 1000", to: "Shopping Iguatemi", distance: "5.2 km", value: "R$ 18,50", time: "12 min" },
  { id: 2, from: "Rua Augusta, 500", to: "Aeroporto Internacional", distance: "18 km", value: "R$ 42,00", time: "25 min" },
];

const DriverPanel = () => {
  const [online, setOnline] = useState(false);
  const [requests, setRequests] = useState(mockRequests);

  const handleAccept = (id: number) => {
    setRequests((r) => r.filter((req) => req.id !== id));
  };

  const handleReject = (id: number) => {
    setRequests((r) => r.filter((req) => req.id !== id));
  };

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
          <span className="text-lg font-bold text-primary">R$ 124,80</span>
        </div>
      </div>

      {/* Ride Requests */}
      {online && (
        <div className="p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Solicitações</p>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aguardando novas corridas...</p>
          ) : (
            requests.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <div className="w-px h-6 bg-border" />
                    <MapPin size={12} className="text-destructive" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Origem</p>
                      <p className="text-sm font-semibold">{req.from}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Destino</p>
                      <p className="text-sm font-semibold">{req.to}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{req.distance} · {req.time}</span>
                  <span className="font-bold text-primary">{req.value}</span>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    className="flex-1 h-11 font-bold"
                    onClick={() => handleReject(req.id)}
                  >
                    <X size={16} className="mr-1" /> Recusar
                  </Button>
                  <Button
                    className="flex-1 h-11 font-bold bg-success hover:bg-success/90 text-success-foreground"
                    onClick={() => handleAccept(req.id)}
                  >
                    <Check size={16} className="mr-1" /> Aceitar
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default DriverPanel;
