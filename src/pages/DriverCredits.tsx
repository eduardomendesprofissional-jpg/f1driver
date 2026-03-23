import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Plus, Copy, Loader2, CheckCircle2, History, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const PRESET_VALUES = [20, 50, 100, 200];

const DriverCredits = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [driverBalance, setDriverBalance] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [topupLoading, setTopupLoading] = useState(false);
  const [pixData, setPixData] = useState<{
    encoded_image?: string;
    payload?: string;
    payment_id?: string;
  } | null>(null);
  const [topups, setTopups] = useState<any[]>([]);
  const realtimeRef = useRef<any>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTopups();
    }
    return () => {
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    };
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("driver_balance, is_blocked")
      .eq("id", user.id)
      .single();
    setDriverBalance(Number((data as any)?.driver_balance || 0));
    setIsBlocked(!!(data as any)?.is_blocked);
    setLoading(false);
  };

  const fetchTopups = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("wallet_topups" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("tipo", "driver")
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
      const { data: profile } = await supabase
        .from("profiles")
        .select("asaas_customer_id, nome, cpf")
        .eq("id", user.id)
        .single();

      let customerId = profile?.asaas_customer_id;

      // Auto-create Asaas customer if not yet registered
      if (!customerId) {
        if (!profile?.nome || !profile?.cpf) {
          toast.error("Preencha seu nome e CPF no perfil antes de recarregar.");
          setTopupLoading(false);
          return;
        }
        const { data: custData, error: custErr } = await supabase.functions.invoke("asaas-payment", {
          body: {
            action: "create_customer",
            user_id: user.id,
            name: profile.nome,
            cpf_cnpj: profile.cpf,
            email: user.email,
          },
        });
        if (custErr || !custData?.success) {
          toast.error(custData?.error || "Erro ao criar cadastro de pagamento.");
          setTopupLoading(false);
          return;
        }
        customerId = custData.asaas_customer_id;
        toast.success("Cadastro de pagamento criado!");
      }

      const { data: topup, error: topupErr } = await supabase
        .from("wallet_topups" as any)
        .insert({ user_id: user.id, valor: amount, status: "pending", tipo: "driver" } as any)
        .select()
        .single();

      if (topupErr || !topup) {
        toast.error("Erro ao criar recarga.");
        setTopupLoading(false);
        return;
      }

      const { data: asaasData, error: asaasErr } = await supabase.functions.invoke("asaas-payment", {
        body: {
          action: "create_payment",
          amount,
          customer_id: customerId,
          billing_type: "PIX",
          topup_id: (topup as any).id,
        },
      });

      if (asaasErr || !asaasData?.success) {
        toast.error(asaasData?.error || "Erro ao gerar PIX.");
        setTopupLoading(false);
        return;
      }

      await supabase
        .from("wallet_topups" as any)
        .update({ payment_id: asaasData.payment_id } as any)
        .eq("id", (topup as any).id);

      setPixData({
        encoded_image: asaasData.pix?.encoded_image,
        payload: asaasData.pix?.payload,
        payment_id: asaasData.payment_id,
      });

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
      .channel(`driver-balance-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          const newBalance = Number((payload.new as any).driver_balance || 0);
          const newBlocked = !!(payload.new as any).is_blocked;
          if (newBalance !== driverBalance) {
            setDriverBalance(newBalance);
            setIsBlocked(newBlocked);
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
        <button onClick={() => navigate("/driver")} className="p-2 rounded-lg hover:bg-secondary">
          <ArrowLeft size={20} />
        </button>
        <Wallet size={22} className="text-primary" />
        <h1 className="text-lg font-bold">Meus Créditos</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Blocked Banner */}
        <AnimatePresence>
          {isBlocked && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="border-destructive bg-destructive/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle size={24} className="text-destructive shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-destructive">Conta bloqueada</p>
                    <p className="text-xs text-muted-foreground">
                      Seu saldo está abaixo de R$ -40,00. Recarregue para desbloquear sua conta.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Balance Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={driverBalance < 0 ? "border-destructive/50" : "bg-primary text-primary-foreground"}>
            <CardContent className="p-6 text-center">
              <p className={`text-sm ${driverBalance < 0 ? "text-muted-foreground" : "opacity-80"}`}>
                Saldo de créditos
              </p>
              {loading ? (
                <Loader2 className="animate-spin mx-auto mt-2" size={28} />
              ) : (
                <p className={`text-4xl font-bold mt-1 ${driverBalance < 0 ? "text-destructive" : ""}`}>
                  R$ {driverBalance.toFixed(2)}
                </p>
              )}
              {driverBalance < 0 && driverBalance >= -40 && (
                <p className="text-xs text-amber-500 mt-2 font-medium">
                  ⚠ Saldo negativo. Bloqueio automático em R$ -40,00.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* PIX QR Code */}
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
                        <Input readOnly value={pixData.payload} className="text-xs font-mono" />
                        <Button variant="outline" size="icon" onClick={copyPayload}>
                          <Copy size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground text-center">
                    Aguardando confirmação do pagamento...
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setPixData(null)}>
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
                Recarregar Saldo
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
                {topupLoading && <Loader2 className="animate-spin mr-2" size={18} />}
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
    </div>
  );
};

export default DriverCredits;
