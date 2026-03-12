import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, CreditCard, Banknote, QrCode, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const paymentMethods = [
  { id: "pix", label: "Pix", icon: QrCode },
  { id: "card", label: "Cartão", icon: CreditCard },
  { id: "cash", label: "Dinheiro", icon: Banknote },
];

const RideConfirm = () => {
  const navigate = useNavigate();
  const [selectedPayment, setSelectedPayment] = useState("pix");

  const handleConfirm = () => {
    navigate("/ride-active");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Confirmar corrida</h1>
      </div>

      {/* Route Summary */}
      <div className="px-4 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 border border-border space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1 mt-1">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-px h-8 bg-border" />
              <MapPin size={14} className="text-destructive" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Origem</p>
                <p className="text-sm font-semibold">—</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Destino</p>
                <p className="text-sm font-semibold">—</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="flex justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Tempo estimado</p>
              <p className="text-lg font-bold">—</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Valor estimado</p>
              <p className="text-lg font-bold text-primary">—</p>
            </div>
          </div>
        </motion.div>

        {/* Payment Methods */}
        <div className="mt-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pagamento</p>
          <div className="flex gap-3">
            {paymentMethods.map((pm) => (
              <button
                key={pm.id}
                onClick={() => setSelectedPayment(pm.id)}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  selectedPayment === pm.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary"
                }`}
              >
                <pm.icon size={22} className={selectedPayment === pm.id ? "text-primary" : "text-muted-foreground"} />
                <span className={`text-xs font-semibold ${selectedPayment === pm.id ? "text-primary" : "text-muted-foreground"}`}>
                  {pm.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="p-4">
        <Button onClick={handleConfirm} className="w-full h-14 text-base font-bold glow-blue">
          Confirmar corrida
        </Button>
      </div>
    </div>
  );
};

export default RideConfirm;
