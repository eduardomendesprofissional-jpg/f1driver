import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, QrCode, Plus, X, Loader2, ChevronRight, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

export interface SelectedPayment {
  type: "pix" | "card" | "wallet";
  stripe_payment_method_id?: string;
  label: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (payment: SelectedPayment) => void;
  currentSelection?: SelectedPayment | null;
}

const brandLabels: Record<string, string> = {
  visa: "Visa",
  mastercard: "Master",
  amex: "Amex",
  elo: "Elo",
  hipercard: "Hiper",
};

const PaymentMethodSelector = ({ open, onClose, onSelect, currentSelection }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (open && user) {
      setLoading(true);
      supabase.functions
        .invoke("manage-payment-methods", { body: { action: "list" } })
        .then(({ data }) => {
          setCards(data?.methods || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));

      // Fetch wallet balance
      supabase
        .from("profiles")
        .select("balance")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setWalletBalance(Number((data as any)?.balance || 0));
        });
    }
  }, [open, user]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ y: 300 }}
          animate={{ y: 0 }}
          exit={{ y: 300 }}
          className="relative w-full max-w-md bg-card border-t border-border rounded-t-3xl p-5 z-10 max-h-[70vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-foreground">Forma de pagamento</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary">
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-2">
            {/* Wallet option */}
            <button
              onClick={() => onSelect({ type: "wallet", label: `Carteira • R$ ${walletBalance.toFixed(2)}` })}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                currentSelection?.type === "wallet"
                  ? "border-primary bg-primary/5"
                  : "border-border/40 bg-secondary/30 hover:bg-secondary/50"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet size={18} className="text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground text-sm">Carteira</p>
                <p className="text-xs text-muted-foreground">Saldo: R$ {walletBalance.toFixed(2)}</p>
              </div>
              {currentSelection?.type === "wallet" && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                </div>
              )}
            </button>

            {/* PIX option */}
            <button
              onClick={() => onSelect({ type: "pix", label: "PIX" })}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                currentSelection?.type === "pix"
                  ? "border-primary bg-primary/5"
                  : "border-border/40 bg-secondary/30 hover:bg-secondary/50"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <QrCode size={18} className="text-green-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground text-sm">PIX</p>
                <p className="text-xs text-muted-foreground">Pagamento instantâneo</p>
              </div>
              {currentSelection?.type === "pix" && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                </div>
              )}
            </button>

            {/* Saved cards */}
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-primary" size={20} />
              </div>
            ) : (
              cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() =>
                    onSelect({
                      type: "card",
                      stripe_payment_method_id: card.id,
                      label: `${brandLabels[card.brand] || card.brand} •••• ${card.last4}`,
                    })
                  }
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    currentSelection?.stripe_payment_method_id === card.id
                      ? "border-primary bg-primary/5"
                      : "border-border/40 bg-secondary/30 hover:bg-secondary/50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CreditCard size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground text-sm">
                      {brandLabels[card.brand] || card.brand} •••• {card.last4}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expira {String(card.exp_month).padStart(2, "0")}/{card.exp_year}
                    </p>
                  </div>
                  {currentSelection?.stripe_payment_method_id === card.id && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    </div>
                  )}
                </button>
              ))
            )}

            {/* Add new card */}
            <button
              onClick={() => {
                onClose();
                navigate("/payment-methods");
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-dashed border-border/60 hover:bg-secondary/30 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Plus size={18} className="text-muted-foreground" />
              </div>
              <p className="flex-1 text-left text-sm font-medium text-muted-foreground">
                Adicionar novo cartão
              </p>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentMethodSelector;
