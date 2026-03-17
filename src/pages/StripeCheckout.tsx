import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { loadStripe, Stripe, StripeElements } from "@stripe/stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CreditCard, QrCode, Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STRIPE_PK = "pk_live_51TC220RyZVjSW4KRd1Wol4LRPKRsCPd18ign2HL8q3AJjsmLvVVZc3QFYo84hbWZHmaTZ1Vzpi3LQBtJNn9lNS1500Djwg5bNk";

type PaymentTab = "pix" | "credit" | "debit";
type CheckoutState = "form" | "processing" | "success" | "error";

const StripeCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { amount, rideId, returnTo } = (location.state as any) || {};

  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [tab, setTab] = useState<PaymentTab>("credit");
  const [state, setState] = useState<CheckoutState>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const amountCents = amount || 0;
  const amountBRL = (amountCents / 100).toFixed(2);

  // Load Stripe
  useEffect(() => {
    loadStripe(STRIPE_PK).then((s) => {
      if (s) setStripe(s);
    });
  }, []);

  // Create PaymentIntent
  useEffect(() => {
    if (!amountCents) return;
    const createIntent = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("create-payment-intent", {
          body: {
            amount: amountCents,
            payment_method_types: ["card", "pix"],
            ride_id: rideId,
          },
        });
        if (error || data?.error) throw new Error(data?.error || error?.message);
        setClientSecret(data.client_secret);
      } catch (err: any) {
        toast.error("Erro ao iniciar pagamento");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    createIntent();
  }, [amountCents]);

  // Mount card elements when stripe + clientSecret are ready and tab is card
  useEffect(() => {
    if (!stripe || !clientSecret || tab === "pix") {
      setElements(null);
      return;
    }

    const el = stripe.elements({
      clientSecret,
      appearance: {
        theme: "night",
        variables: {
          colorPrimary: "#3b82f6",
          colorBackground: "#1a1a2e",
          colorText: "#ffffff",
          borderRadius: "12px",
          fontFamily: "system-ui, sans-serif",
        },
      },
    });
    setElements(el);

    // Mount after next tick
    setTimeout(() => {
      const container = document.getElementById("stripe-card-element");
      if (container) {
        container.innerHTML = "";
        const cardEl = el.create("payment");
        cardEl.mount(container);
      }
    }, 50);
  }, [stripe, clientSecret, tab]);

  const handlePayCard = async () => {
    if (!stripe || !elements || !clientSecret) return;
    setState("processing");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (error) {
      setErrorMsg(error.message || "Pagamento falhou.");
      setState("error");
    } else if (paymentIntent?.status === "succeeded") {
      setState("success");
    } else {
      setState("form");
    }
  };

  const handlePayPix = async () => {
    if (!stripe || !clientSecret) return;
    setState("processing");

    const { error, paymentIntent } = await stripe.confirmPixPayment(clientSecret, {
      payment_method: {},
    });

    if (error) {
      setErrorMsg(error.message || "Pagamento PIX falhou.");
      setState("error");
    } else if (paymentIntent?.status === "requires_action") {
      // PIX QR code is shown by Stripe via next_action
      const pixAction = paymentIntent.next_action;
      if (pixAction?.pix_display_qr_code) {
        setState("form"); // stay on form to show QR
      }
    } else if (paymentIntent?.status === "succeeded") {
      setState("success");
    }
  };

  const handleConfirm = () => {
    if (tab === "pix") handlePayPix();
    else handlePayCard();
  };

  const handleRetry = () => {
    setState("form");
    setErrorMsg("");
  };

  const handleSuccessClose = () => {
    if (returnTo) navigate(returnTo);
    else navigate("/passenger");
  };

  if (!amountCents) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <XCircle size={48} className="mx-auto text-destructive" />
          <p className="text-foreground font-bold">Valor não informado</p>
          <Button onClick={() => navigate(-1)} variant="outline">Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/30">
        <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl bg-secondary/60 border border-border/20 press">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Pagamento</h1>
        <div className="ml-auto text-right">
          <p className="text-[10px] text-muted-foreground">Total</p>
          <p className="text-lg font-bold text-primary">R$ {amountBRL}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* FORM STATE */}
        {state === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex-1 px-4 pb-24 overflow-y-auto"
          >
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="flex gap-2 mt-4 mb-5">
                  {([
                    { id: "pix" as PaymentTab, label: "PIX", icon: QrCode },
                    { id: "credit" as PaymentTab, label: "Crédito", icon: CreditCard },
                    { id: "debit" as PaymentTab, label: "Débito", icon: CreditCard },
                  ]).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all press ${
                        tab === t.id
                          ? "border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                          : "border-border/40 bg-secondary/40"
                      }`}
                    >
                      <t.icon size={18} className={tab === t.id ? "text-primary" : "text-muted-foreground"} />
                      <span className={`text-xs font-semibold ${tab === t.id ? "text-primary" : "text-muted-foreground"}`}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* PIX */}
                {tab === "pix" && (
                  <div className="bg-card rounded-2xl p-5 border border-border/50 text-center space-y-4">
                    <QrCode size={48} className="mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Ao confirmar, um QR Code PIX será gerado pela Stripe para você efetuar o pagamento.
                    </p>
                    <p className="text-2xl font-bold text-primary">R$ {amountBRL}</p>
                  </div>
                )}

                {/* Card */}
                {(tab === "credit" || tab === "debit") && (
                  <div className="bg-card rounded-2xl p-5 border border-border/50 space-y-4">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      Dados do cartão {tab === "debit" ? "de débito" : "de crédito"}
                    </p>
                    <div id="stripe-card-element" className="min-h-[120px] rounded-xl" />
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* PROCESSING STATE */}
        {state === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="text-center space-y-4">
              <Loader2 className="animate-spin text-primary mx-auto" size={48} />
              <p className="text-foreground font-bold text-lg">Processando pagamento...</p>
              <p className="text-sm text-muted-foreground">Não feche esta tela</p>
            </div>
          </motion.div>
        )}

        {/* SUCCESS STATE */}
        {state === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center px-6"
          >
            <div className="text-center space-y-5">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 size={48} className="text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Pagamento confirmado!</h2>
              <p className="text-muted-foreground text-sm">R$ {amountBRL} pago com sucesso.</p>
              <Button onClick={handleSuccessClose} className="w-full h-12 font-bold rounded-xl">
                Continuar
              </Button>
            </div>
          </motion.div>
        )}

        {/* ERROR STATE */}
        {state === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center px-6"
          >
            <div className="text-center space-y-5">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <XCircle size={48} className="text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Pagamento falhou</h2>
              <p className="text-muted-foreground text-sm">{errorMsg}</p>
              <div className="space-y-2">
                <Button onClick={handleRetry} className="w-full h-12 font-bold rounded-xl">
                  <RefreshCw size={16} className="mr-2" />
                  Tentar novamente
                </Button>
                <Button onClick={() => navigate(-1)} variant="outline" className="w-full h-12 rounded-xl">
                  Voltar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      {state === "form" && !loading && (
        <div className="p-4 safe-bottom glass-heavy border-t border-border/30">
          <Button
            onClick={handleConfirm}
            className="w-full h-14 text-base font-bold glow-blue rounded-xl"
            disabled={!clientSecret}
          >
            Confirmar pagamento — R$ {amountBRL}
          </Button>
        </div>
      )}
    </div>
  );
};

export default StripeCheckout;
