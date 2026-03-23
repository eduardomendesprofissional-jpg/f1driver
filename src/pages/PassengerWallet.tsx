import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Plus, Copy, Loader2, CheckCircle2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAsaasCustomer } from "@/hooks/useAsaasCustomer";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";

const PRESET_VALUES = [20, 50, 100, 200];

const PassengerWallet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ensureCustomer, creating: creatingCustomer } = useAsaasCustomer();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [topupLoading, setTopupLoading] = useState(false);
  const [pixData, setPixData] = useState<{
    encoded_image?: string;
    payload?: string;
    payment_id?: string;
    topup_id?: string;
  } | null>(null);
  const [topups, setTopups] = useState<any[]>([]);
  const realtimeRef = useRef<any>(null);

  useEffect(() => {
    if (user) {
      fetchBalance();
      fetchTopups();
    }
    return () => {
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    };
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", user.id)
      .single();
    setBalance(Number((data as any)?.balance || 0));
    setLoading(false);
  };

  const fetchTopups = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("wallet_topups" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setTopups((data as any[]) || []);
  };

  const handleTopup = async () => {
    const amount = selectedAmount || Number(customAmount);
    if (!amount || amount < 5) {
      toast.error("Valor mínimo: R$ 5,00");
      return;
    }
    if (!user) return;

    setTopupLoading(true);
    try {
      const customerId = await ensureCustomer();
      if (!customerId) {
        setTopupLoading(false);
        return;
      }

      // Create topup record
      const { data: topup, error: topupErr } = await supabase
        .from("wallet_topups" as any)
        .insert({ user_id: user.id, valor: amount, status: "pending" } as any)
        .select()
        .single();

      if (topupErr || !topup) {
        toast.error("Erro ao criar recarga.");
        setTopupLoading(false);
        return;
      }

      // Call asaas-payment for PIX
      const { data: asaasData, error: asaasErr } = await supabase.functions.invoke("asaas-payment", {
        body: {
          action: "create_payment",
          amount,
          customer_id: (profile as any).asaas_customer_id,
          billing_type: "PIX",
          topup_id: (topup as any).id,
        },
      });

      if (asaasErr || !asaasData?.success) {
        toast.error(asaasData?.error || "Erro ao gerar PIX.");
        setTopupLoading(false);
        return;
      }

      // Update topup with payment_id
      await supabase
        .from("wallet_topups" as any)
        .update({ payment_id: asaasData.payment_id } as any)
        .eq("id", (topup as any).id);

      setPixData({
        encoded_image: asaasData.pix?.encoded_image,
        payload: asaasData.pix?.payload,
        payment_id: asaasData.payment_id,
        topup_id: (topup as any).id,
      });

      // Listen for balance changes via realtime on profiles
      subscribeToBalance();
    } catch {
      toast.error("Erro ao processar recarga.");
    }
    setTopupLoading(false);
  };

  const subscribeToBalance = () => {
    if (!user) return;
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);

    const channel = supabase
      .channel(`wallet-balance-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          const newBalance = Number((payload.new as any).balance || 0);
          if (newBalance > balance) {
            setBalance(newBalance);
            setPixData(null);
            toast.success(`Saldo atualizado! R$ ${newBalance.toFixed(2)}`);
            fetchTopups();
          }
        }
      )
      .subscribe();
    realtimeRef.current = channel;
  };

  const copyPayload = () => {
    if (pixData?.payload) {
      navigator.clipboard.writeText(pixData.payload);
      toast.success("Código PIX copiado!");
    }
  };

  const finalAmount = selectedAmount || Number(customAmount) || 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary">
          <ArrowLeft size={20} />
        </button>
        <Wallet size={22} className="text-primary" />
        <h1 className="text-lg font-bold">Minha Carteira</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Balance Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6 text-center">
              <p className="text-sm opacity-80">Saldo disponível</p>
              {loading ? (
                <Loader2 className="animate-spin mx-auto mt-2" size={28} />
              ) : (
                <p className="text-4xl font-bold mt-1">R$ {balance.toFixed(2)}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* PIX QR Code Display */}
        <AnimatePresence>
          {pixData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary" />
                    Pague via PIX para adicionar R$ {finalAmount.toFixed(2)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pixData.encoded_image && (
                    <div className="flex justify-center">
                      <img
                        src={`data:image/png;base64,${pixData.encoded_image}`}
                        alt="QR Code PIX"
                        className="w-48 h-48 rounded-xl border border-border"
                      />
                    </div>
                  )}
                  {pixData.payload && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Código Copia e Cola</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={pixData.payload}
                          className="text-xs font-mono"
                        />
                        <Button variant="outline" size="icon" onClick={copyPayload}>
                          <Copy size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground text-center">
                    Aguardando confirmação do pagamento...
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setPixData(null)}
                  >
                    Cancelar
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Balance */}
        {!pixData && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Plus size={16} className="text-primary" />
                Adicionar Saldo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {PRESET_VALUES.map((val) => (
                  <button
                    key={val}
                    onClick={() => { setSelectedAmount(val); setCustomAmount(""); }}
                    className={`py-3 rounded-xl text-sm font-bold transition-colors ${
                      selectedAmount === val
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    R$ {val}
                  </button>
                ))}
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Ou digite outro valor</Label>
                <Input
                  type="number"
                  placeholder="Ex: 75.00"
                  value={customAmount}
                  onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                  min={5}
                />
              </div>

              <Button
                className="w-full h-12 font-bold"
                onClick={handleTopup}
                disabled={topupLoading || (!selectedAmount && !customAmount)}
              >
                {topupLoading ? (
                  <Loader2 className="animate-spin mr-2" size={18} />
                ) : null}
                Gerar PIX • R$ {finalAmount > 0 ? finalAmount.toFixed(2) : "0,00"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* History */}
        {topups.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <History size={16} className="text-primary" />
                Histórico de Recargas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topups.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-semibold">R$ {Number(t.valor).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    t.status === "paid" ? "bg-emerald-500/20 text-emerald-600" : "bg-amber-500/20 text-amber-600"
                  }`}>
                    {t.status === "paid" ? "Confirmado" : "Pendente"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav active="home" role="passenger" />
    </div>
  );
};

export default PassengerWallet;
