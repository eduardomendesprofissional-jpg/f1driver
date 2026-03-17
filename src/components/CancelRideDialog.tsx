import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CancelRideDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  role: "passenger" | "driver";
  isDuringTrip?: boolean;
  loading?: boolean;
}

const PASSENGER_REASONS = [
  "Tempo de espera muito longo",
  "Encontrei outra forma de transporte",
  "Erro no endereço de destino",
  "Mudei de ideia",
  "Problema com o motorista",
  "Emergência pessoal",
];

const DRIVER_REASONS = [
  "Passageiro não compareceu",
  "Endereço incorreto ou inacessível",
  "Problema mecânico no veículo",
  "Emergência pessoal",
  "Passageiro solicitou cancelamento",
  "Rota perigosa ou insegura",
];

const DURING_TRIP_REASONS = [
  "Passageiro solicitou parar aqui",
  "Rota bloqueada / inacessível",
  "Emergência pessoal",
  "Problema mecânico no veículo",
  "Comportamento inadequado",
  "Situação de insegurança",
];

const CancelRideDialog = ({
  open,
  onClose,
  onConfirm,
  role,
  isDuringTrip = false,
  loading = false,
}: CancelRideDialogProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const reasons = isDuringTrip
    ? DURING_TRIP_REASONS
    : role === "driver"
    ? DRIVER_REASONS
    : PASSENGER_REASONS;

  const handleConfirm = () => {
    const motivo = showCustom ? customReason.trim() : selected;
    if (!motivo) return;
    onConfirm(motivo);
  };

  const handleClose = () => {
    setSelected(null);
    setCustomReason("");
    setShowCustom(false);
    onClose();
  };

  const isValid = showCustom ? customReason.trim().length >= 5 : !!selected;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

          {/* Dialog */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="relative w-full max-w-md bg-card border border-border rounded-t-3xl sm:rounded-2xl p-5 z-10 max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-destructive" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">
                    {isDuringTrip ? "Encerrar viagem" : "Cancelar corrida"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {isDuringTrip
                      ? "Informe o motivo do encerramento antecipado"
                      : "Por favor, informe o motivo do cancelamento"}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="p-2 rounded-lg hover:bg-secondary">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            {/* Reasons */}
            <div className="space-y-2 mb-4">
              {reasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => {
                    setSelected(reason);
                    setShowCustom(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                    selected === reason && !showCustom
                      ? "bg-destructive/10 border border-destructive/30 text-destructive"
                      : "bg-secondary/50 border border-transparent text-foreground hover:bg-secondary"
                  }`}
                >
                  {reason}
                  {selected === reason && !showCustom && (
                    <div className="w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                      <ChevronRight size={12} className="text-destructive-foreground" />
                    </div>
                  )}
                </button>
              ))}

              {/* Other reason */}
              <button
                onClick={() => {
                  setShowCustom(true);
                  setSelected(null);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  showCustom
                    ? "bg-destructive/10 border border-destructive/30 text-destructive"
                    : "bg-secondary/50 border border-transparent text-foreground hover:bg-secondary"
                }`}
              >
                Outro motivo...
              </button>
            </div>

            {/* Custom reason textarea */}
            <AnimatePresence>
              {showCustom && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <Textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Descreva o motivo (mínimo 5 caracteres)..."
                    className="min-h-[80px] resize-none"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12 font-bold" onClick={handleClose}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-12 font-bold"
                onClick={handleConfirm}
                disabled={!isValid || loading}
              >
                {loading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-destructive-foreground border-t-transparent rounded-full" />
                ) : isDuringTrip ? (
                  "Encerrar"
                ) : (
                  "Confirmar cancelamento"
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CancelRideDialog;
