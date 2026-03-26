import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Upload, Loader2, History, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const PRESET_VALUES = [20, 50, 100, 200];

const PIX_INFO = {
  nome: "Antônio Luiz Colaço Lira",
  banco: "Banco do Brasil",
  cpf: "863.732.424-04",
};

const DriverCredits = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [driverBalance, setDriverBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [extratos, setExtratos] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchBalance();
      fetchExtratos();
    }
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("driver_balance")
      .eq("id", user.id)
      .single();
    setDriverBalance(Number(data?.driver_balance || 0));
    setLoading(false);
  };

  const fetchExtratos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("extrato_creditos" as any)
      .select("*")
      .eq("perfil_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setExtratos((data as any[]) || []);
  };

  const handleSubmit = async () => {
    const amount = selectedAmount || Number(customAmount);
    if (!amount || amount < 20) {
      toast.error("Valor mínimo: R$ 20,00");
      return;
    }
    if (!receiptFile) {
      toast.error("Anexe o comprovante do PIX");
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      const ext = receiptFile.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/comprovante_${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("comprovantes")
        .upload(filePath, receiptFile, { contentType: receiptFile.type, upsert: true });

      if (uploadErr) {
        toast.error("Erro ao enviar comprovante: " + uploadErr.message);
        setSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("comprovantes").getPublicUrl(filePath);

      const { error: insertErr } = await supabase
        .from("extrato_creditos" as any)
        .insert({
          perfil_id: user.id,
          valor: amount,
          url_comprovante: urlData.publicUrl,
          status: "pendente",
        } as any);

      if (insertErr) {
        toast.error("Erro ao registrar depósito");
        setSubmitting(false);
        return;
      }

      toast.success("Comprovante enviado! O saldo será atualizado após a conferência manual.");
      setSelectedAmount(null);
      setCustomAmount("");
      setReceiptFile(null);
      fetchExtratos();
    } catch {
      toast.error("Erro ao processar envio");
    }
    setSubmitting(false);
  };

  const finalAmount = selectedAmount || Number(customAmount) || 0;

  const statusIcon = (s: string) => {
    if (s === "aprovado") return <CheckCircle2 size={14} className="text-emerald-500" />;
    if (s === "rejeitado") return <XCircle size={14} className="text-destructive" />;
    return <Clock size={14} className="text-amber-500" />;
  };

  const statusLabel = (s: string) => {
    if (s === "aprovado") return "Aprovado";
    if (s === "rejeitado") return "Rejeitado";
    return "Pendente";
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-card border-b border-border p-4 flex items-center gap-3">
        <button onClick={() => navigate("/driver")} className="p-2 rounded-lg hover:bg-secondary">
          <ArrowLeft size={20} />
        </button>
        <Wallet size={22} className="text-primary" />
        <h1 className="text-lg font-bold">Meus Créditos</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Balance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={driverBalance < 20 ? "border-destructive/50" : "bg-primary text-primary-foreground"}>
            <CardContent className="p-6 text-center">
              <p className={`text-sm ${driverBalance < 20 ? "text-muted-foreground" : "opacity-80"}`}>
                Saldo de créditos
              </p>
              {loading ? (
                <Loader2 className="animate-spin mx-auto mt-2" size={28} />
              ) : (
                <p className={`text-4xl font-bold mt-1 ${driverBalance < 20 ? "text-destructive" : ""}`}>
                  R$ {driverBalance.toFixed(2)}
                </p>
              )}
              {driverBalance < 20 && (
                <p className="text-xs text-amber-500 mt-2 font-medium">
                  ⚠ Saldo mínimo de R$ 20,00 para ficar online.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* PIX Deposit Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Upload size={16} className="text-primary" />
              Recarregar via PIX
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* PIX Info */}
            <div className="bg-secondary rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Dados para transferência</p>
              <p className="text-sm"><span className="font-medium">Nome:</span> {PIX_INFO.nome}</p>
              <p className="text-sm"><span className="font-medium">Banco:</span> {PIX_INFO.banco}</p>
              <p className="text-sm"><span className="font-medium">CPF:</span> {PIX_INFO.cpf}</p>
            </div>

            {/* Amount */}
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
                min={20}
              />
            </div>

            {/* Upload */}
            <div>
              <Label className="text-xs text-muted-foreground">Comprovante do PIX</Label>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors">
                <Upload size={18} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {receiptFile ? receiptFile.name : "Toque para anexar o print"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <Button
              className="w-full h-12 font-bold"
              onClick={handleSubmit}
              disabled={submitting || (!selectedAmount && !customAmount) || !receiptFile}
            >
              {submitting && <Loader2 className="animate-spin mr-2" size={18} />}
              Enviar para Análise • R$ {finalAmount > 0 ? finalAmount.toFixed(2) : "0,00"}
            </Button>
          </CardContent>
        </Card>

        {/* History */}
        {extratos.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <History size={16} className="text-primary" />
                Histórico de Depósitos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {extratos.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-semibold">R$ {Number(t.valor).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold">
                    {statusIcon(t.status)}
                    {statusLabel(t.status)}
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
