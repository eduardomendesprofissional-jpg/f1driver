import { useState } from "react";
import { Users, Plus, X, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SplitPaymentProps {
  rideId: string;
  totalValue: number;
}

interface SplitEntry {
  email: string;
  percentual: number;
}

const SplitPayment = ({ rideId, totalValue }: SplitPaymentProps) => {
  const [open, setOpen] = useState(false);
  const [splits, setSplits] = useState<SplitEntry[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const myPercent = 100 - splits.reduce((s, sp) => s + sp.percentual, 0);

  const addSplit = () => {
    if (!newEmail.includes("@")) {
      toast.error("Digite um email válido.");
      return;
    }
    if (splits.length >= 3) {
      toast.error("Máximo de 3 convidados.");
      return;
    }
    const newPct = Math.floor(100 / (splits.length + 2));
    const updated = splits.map((s) => ({ ...s, percentual: newPct }));
    updated.push({ email: newEmail, percentual: newPct });
    setSplits(updated);
    setNewEmail("");
  };

  const removeSplit = (index: number) => {
    const updated = splits.filter((_, i) => i !== index);
    if (updated.length > 0) {
      const pct = Math.floor(100 / (updated.length + 1));
      updated.forEach((s) => (s.percentual = pct));
    }
    setSplits(updated);
  };

  const handleSend = async () => {
    if (splits.length === 0) return;
    setSending(true);
    try {
      const inserts = splits.map((sp) => ({
        ride_id: rideId,
        convidado_email: sp.email,
        percentual: sp.percentual,
        status: "pendente",
      }));
      await (supabase.from("ride_splits").insert(inserts) as any);
      setSent(true);
      toast.success("Convites de divisão enviados!");
    } catch {
      toast.error("Erro ao enviar convites.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
        <Check size={16} className="text-green-500" />
        <span className="text-xs font-semibold text-green-500">Pagamento dividido!</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs font-semibold text-primary py-2 transition-all active:scale-95"
      >
        <Users size={14} />
        Dividir pagamento
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
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-t-3xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Users size={20} className="text-primary" />
                  Dividir pagamento
                </h3>
                <button onClick={() => setOpen(false)} className="p-2 rounded-lg bg-secondary">
                  <X size={18} />
                </button>
              </div>

              <p className="text-sm text-muted-foreground">
                Total: <span className="font-bold text-primary">R$ {totalValue.toFixed(2)}</span>
              </p>

              {/* My share */}
              <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  Eu
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Você</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{myPercent}%</p>
                  <p className="text-[10px] text-muted-foreground">
                    R$ {((totalValue * myPercent) / 100).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Split entries */}
              {splits.map((sp, i) => (
                <div key={i} className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{sp.email}</p>
                  </div>
                  <div className="text-right mr-2">
                    <p className="text-sm font-bold">{sp.percentual}%</p>
                    <p className="text-[10px] text-muted-foreground">
                      R$ {((totalValue * sp.percentual) / 100).toFixed(2)}
                    </p>
                  </div>
                  <button onClick={() => removeSplit(i)} className="p-1 rounded-md hover:bg-muted">
                    <X size={14} className="text-muted-foreground" />
                  </button>
                </div>
              ))}

              {/* Add new */}
              {splits.length < 3 && (
                <div className="flex gap-2">
                  <input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Email do convidado"
                    className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={addSplit}
                    className="px-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={splits.length === 0 || sending}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3.5 font-bold text-sm disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
                {sending ? "Enviando..." : "Enviar convites"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SplitPayment;
