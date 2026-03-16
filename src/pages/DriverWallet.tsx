
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, TrendingUp, Calendar, DollarSign, Landmark, Plus, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";

type Period = "hoje" | "semana" | "mes" | "custom";

interface ContaBancaria {
  id: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo_conta: string;
  titular: string;
  cpf_titular: string;
  chave_pix: string | null;
}

interface Saque {
  id: string;
  valor: number;
  status: string;
  created_at: string;
}

const DriverWallet = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("hoje");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [earnings, setEarnings] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [rides, setRides] = useState<any[]>([]);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [saques, setSaques] = useState<Saque[]>([]);
  const [showAddConta, setShowAddConta] = useState(false);
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [newConta, setNewConta] = useState({
    banco: "", agencia: "", conta: "", tipo_conta: "corrente",
    titular: "", cpf_titular: "", chave_pix: ""
  });

  useEffect(() => {
    if (user) {
      fetchEarnings();
      fetchContas();
      fetchSaques();
    }
  }, [user, period, customStart, customEnd]);

  const getDateRange = () => {
    const now = new Date();
    let start: Date;
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (period) {
      case "hoje":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "semana":
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        break;
      case "mes":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "custom":
        start = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1);
        if (customEnd) {
          end.setTime(new Date(customEnd).getTime());
          end.setHours(23, 59, 59);
        }
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    return { start: start!.toISOString(), end: end.toISOString() };
  };

  const fetchEarnings = async () => {
    if (!user) return;
    const { start, end } = getDateRange();
    const { data } = await supabase
      .from("rides")
      .select("valor, finalizada_em, forma_pagamento")
      .eq("motorista_id", user.id)
      .eq("status", "finalizada")
      .gte("finalizada_em", start)
      .lte("finalizada_em", end);

    const total = (data || []).reduce((sum, r) => sum + Number(r.valor || 0), 0);
    setEarnings(total);
    setRides(data || []);
  };

  const fetchContas = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("contas_bancarias")
      .select("*")
      .eq("user_id", user.id);
    setContas((data as ContaBancaria[]) || []);
  };

  const fetchSaques = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saques")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const saquesData = (data as Saque[]) || [];
    setSaques(saquesData);
    const withdrawn = saquesData
      .filter(s => s.status === "pago")
      .reduce((sum, s) => sum + Number(s.valor), 0);
    setTotalWithdrawn(withdrawn);

    // Calculate all-time earnings for pending balance
    const { data: allRides } = await supabase
      .from("rides")
      .select("valor")
      .eq("motorista_id", user!.id)
      .eq("status", "finalizada");
    const allEarnings = (allRides || []).reduce((sum, r) => sum + Number(r.valor || 0), 0);
    const allWithdrawn = saquesData
      .filter(s => s.status !== "rejeitado")
      .reduce((sum, s) => sum + Number(s.valor), 0);
    setPendingBalance(Math.max(0, allEarnings - allWithdrawn));
  };

  const handleAddConta = async () => {
    if (!user) return;
    if (!newConta.banco || !newConta.agencia || !newConta.conta || !newConta.titular || !newConta.cpf_titular) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const { error } = await supabase.from("contas_bancarias").insert({
      user_id: user.id,
      ...newConta,
      chave_pix: newConta.chave_pix || null
    });
    if (error) {
      toast.error("Erro ao cadastrar conta");
    } else {
      toast.success("Conta cadastrada com sucesso!");
      setShowAddConta(false);
      setNewConta({ banco: "", agencia: "", conta: "", tipo_conta: "corrente", titular: "", cpf_titular: "", chave_pix: "" });
      fetchContas();
    }
  };

  const handleDeleteConta = async (id: string) => {
    const { error } = await supabase.from("contas_bancarias").delete().eq("id", id);
    if (error) toast.error("Erro ao remover conta");
    else { toast.success("Conta removida"); fetchContas(); }
  };

  const handleWithdraw = async () => {
    if (!user || contas.length === 0) {
      toast.error("Cadastre uma conta bancária primeiro");
      return;
    }
    if (pendingBalance <= 0) {
      toast.error("Sem saldo disponível para saque");
      return;
    }
    setLoadingWithdraw(true);
    const { error } = await supabase.from("saques").insert({
      user_id: user.id,
      valor: pendingBalance,
      conta_bancaria_id: contas[0].id,
      status: "pendente"
    });
    setLoadingWithdraw(false);
    if (error) toast.error("Erro ao solicitar saque");
    else { toast.success("Saque solicitado com sucesso!"); fetchSaques(); }
  };

  const periodLabels: Record<Period, string> = {
    hoje: "Hoje", semana: "Esta semana", mes: "Este mês", custom: "Personalizado"
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 flex items-center gap-3">
        <button onClick={() => navigate("/driver")} className="p-2 rounded-lg hover:bg-secondary">
          <ArrowLeft size={20} />
        </button>
        <Wallet size={22} className="text-primary" />
        <h1 className="text-lg font-bold">Carteira</h1>
      </div>

      <div className="p-4 space-y-4 pb-8">
        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-4">
                <p className="text-xs opacity-80">Saldo a sacar</p>
                <p className="text-2xl font-bold">R$ {pendingBalance.toFixed(2)}</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Já sacado</p>
                <p className="text-2xl font-bold text-foreground">R$ {totalWithdrawn.toFixed(2)}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Withdraw Button */}
        <Button
          className="w-full h-12 font-bold text-base"
          onClick={handleWithdraw}
          disabled={loadingWithdraw || pendingBalance <= 0 || contas.length === 0}
        >
          <DollarSign size={18} className="mr-2" />
          Solicitar Saque
        </Button>

        {/* Period Filter */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Ganhos por período
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {(["hoje", "semana", "mes", "custom"] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => { setPeriod(p); setShowCustom(p === "custom"); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    period === p
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>

            {showCustom && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">De</Label>
                  <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Até</Label>
                  <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                </div>
              </div>
            )}

            <div className="bg-secondary/50 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{periodLabels[period]}</p>
              <p className="text-3xl font-bold text-primary">R$ {earnings.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">{rides.length} corrida{rides.length !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>

        {/* Bank Accounts */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Landmark size={16} className="text-primary" />
              Contas Bancárias
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowAddConta(!showAddConta)}>
              <Plus size={16} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {showAddConta && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 bg-secondary/30 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Banco *</Label>
                    <Input placeholder="Ex: Nubank" value={newConta.banco} onChange={e => setNewConta({ ...newConta, banco: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={newConta.tipo_conta}
                      onChange={e => setNewConta({ ...newConta, tipo_conta: e.target.value })}
                    >
                      <option value="corrente">Corrente</option>
                      <option value="poupanca">Poupança</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Agência *</Label>
                    <Input placeholder="0001" value={newConta.agencia} onChange={e => setNewConta({ ...newConta, agencia: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Conta *</Label>
                    <Input placeholder="12345-6" value={newConta.conta} onChange={e => setNewConta({ ...newConta, conta: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Titular *</Label>
                  <Input placeholder="Nome completo" value={newConta.titular} onChange={e => setNewConta({ ...newConta, titular: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">CPF do Titular *</Label>
                    <Input placeholder="000.000.000-00" value={newConta.cpf_titular} onChange={e => setNewConta({ ...newConta, cpf_titular: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Chave PIX</Label>
                    <Input placeholder="Opcional" value={newConta.chave_pix} onChange={e => setNewConta({ ...newConta, chave_pix: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowAddConta(false)}>Cancelar</Button>
                  <Button className="flex-1" onClick={handleAddConta}>Salvar</Button>
                </div>
              </motion.div>
            )}

            {contas.length === 0 && !showAddConta && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma conta cadastrada</p>
            )}

            {contas.map(conta => (
              <div key={conta.id} className="flex items-center justify-between bg-secondary/30 rounded-xl p-3">
                <div>
                  <p className="text-sm font-semibold">{conta.banco}</p>
                  <p className="text-xs text-muted-foreground">
                    Ag {conta.agencia} • Cc {conta.conta} • {conta.tipo_conta === "corrente" ? "Corrente" : "Poupança"}
                  </p>
                  {conta.chave_pix && <p className="text-xs text-primary">PIX: {conta.chave_pix}</p>}
                </div>
                <button onClick={() => handleDeleteConta(conta.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Withdrawals */}
        {saques.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                Histórico de Saques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {saques.slice(0, 10).map(saque => (
                <div key={saque.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-semibold">R$ {Number(saque.valor).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(saque.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    saque.status === "pago" ? "bg-success/20 text-success" :
                    saque.status === "rejeitado" ? "bg-destructive/20 text-destructive" :
                    "bg-warning/20 text-warning"
                  }`}>
                    {saque.status === "pago" ? "Pago" : saque.status === "rejeitado" ? "Rejeitado" : "Pendente"}
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

export default DriverWallet;
