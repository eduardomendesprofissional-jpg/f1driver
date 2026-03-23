import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CreditCard, Plus, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import AsaasCardForm from "@/components/AsaasCardForm";

const STRIPE_PK =
  "pk_live_51TC220RyZVjSW4KRd1Wol4LRPKRsCPd18ign2HL8q3AJjsmLvVVZc3QFYo84hbWZHmaTZ1Vzpi3LQBtJNn9lNS1500Djwg5bNk";
const stripePromise = loadStripe(STRIPE_PK);

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

const brandIcon: Record<string, string> = {
  visa: "💳 Visa",
  mastercard: "💳 Master",
  amex: "💳 Amex",
  elo: "💳 Elo",
  hipercard: "💳 Hiper",
};

const elementStyle = {
  style: {
    base: {
      fontSize: "16px",
      color: "hsl(var(--foreground))",
      "::placeholder": { color: "hsl(var(--muted-foreground))" },
    },
  },
};

const AddCardForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardName, setCardName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    setLoading(true);
    try {
      // Create payment method with Stripe.js
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumber,
        billing_details: { name: cardName || undefined },
      });

      if (pmError) throw new Error(pmError.message);
      if (!paymentMethod) throw new Error("Erro ao criar método de pagamento");

      // Send to save-card edge function
      const { data, error } = await supabase.functions.invoke("save-card", {
        body: { payment_method_id: paymentMethod.id },
      });

      if (error || data?.error) {
        throw new Error(data?.error || "Erro ao salvar cartão");
      }

      toast.success("Cartão salvo com sucesso!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar cartão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">
          Nome impresso no cartão
        </Label>
        <Input
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          placeholder="NOME COMO NO CARTÃO"
          className="h-12 uppercase"
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">
          Número do cartão
        </Label>
        <div className="p-3.5 rounded-xl border border-border bg-secondary/30">
          <CardNumberElement options={elementStyle} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">
            Validade
          </Label>
          <div className="p-3.5 rounded-xl border border-border bg-secondary/30">
            <CardExpiryElement options={elementStyle} />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">CVV</Label>
          <div className="p-3.5 rounded-xl border border-border bg-secondary/30">
            <CardCvcElement options={elementStyle} />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 font-bold"
        disabled={!stripe || loading}
      >
        {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
        {loading ? "Salvando..." : "Salvar cartão"}
      </Button>
    </form>
  );
};

const PaymentMethodsScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "manage-payment-methods",
        { body: { action: "list" } }
      );
      if (error) throw error;
      setCards(data?.methods || []);
    } catch {
      toast.error("Erro ao carregar cartões");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchCards();
  }, [user]);

  const handleDelete = async (pmId: string) => {
    setDeleting(pmId);
    try {
      const { error } = await supabase.functions.invoke(
        "manage-payment-methods",
        { body: { action: "detach", payment_method_id: pmId } }
      );
      if (error) throw error;
      toast.success("Cartão removido");
      setCards((prev) => prev.filter((c) => c.id !== pmId));
    } catch {
      toast.error("Erro ao remover cartão");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl bg-secondary/60 border border-border/20"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Formas de Pagamento</h1>
      </div>

      <div className="px-4 space-y-4">
        {/* PIX always available */}
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-lg">
              💸
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">PIX</p>
              <p className="text-xs text-muted-foreground">
                Pagamento instantâneo
              </p>
            </div>
            <CheckCircle2 size={18} className="text-green-500" />
          </CardContent>
        </Card>

        {/* Saved cards */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : (
          <>
            {cards.map((card) => (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-card border-border">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CreditCard size={18} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {brandIcon[card.brand] || `💳 ${card.brand}`} ••••{" "}
                        {card.last4}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expira{" "}
                        {String(card.exp_month).padStart(2, "0")}/
                        {card.exp_year}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(card.id)}
                      disabled={deleting === card.id}
                      className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                    >
                      {deleting === card.id ? (
                        <Loader2
                          size={16}
                          className="animate-spin text-destructive"
                        />
                      ) : (
                        <Trash2 size={16} className="text-destructive" />
                      )}
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </>
        )}

        {/* Add card */}
        <AnimatePresence>
          {showAddForm ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="bg-card border-primary/30">
                <CardContent className="p-5">
                  <p className="font-semibold text-foreground mb-4">
                    Adicionar novo cartão
                  </p>
                  <AsaasCardForm
                    onSuccess={() => {
                      setShowAddForm(false);
                      fetchCards();
                    }}
                    onCancel={() => setShowAddForm(false)}
                  />
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-14 gap-2 border-dashed border-2"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={18} />
              Adicionar cartão
            </Button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PaymentMethodsScreen;
