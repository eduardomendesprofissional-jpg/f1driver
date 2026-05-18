import { useState, useEffect, useMemo } from "react";
import {
  Radio, Loader2, MapPin, Clock, DollarSign, Car, User, UserCheck,
  CheckCircle2, Circle, MessageCircle, Search, CreditCard, Hash,
  TrendingUp, AlertCircle, RefreshCw, Phone, Navigation
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface RideLive {
  id: string;
  status: string;
  origem_endereco: string;
  destino_endereco: string;
  origem_lat: number;
  origem_lng: number;
  destino_lat: number;
  destino_lng: number;
  valor: number | null;
  valor_final: number | null;
  categoria: string;
  forma_pagamento: string;
  distancia_km: number | null;
  duracao_min: number | null;
  created_at: string;
  aceita_em: string | null;
  iniciada_em: string | null;
  finalizada_em: string | null;
  cancelada_em: string | null;
  chegou_em: string | null;
  motorista_tentativas: string[] | null;
  passageiro_id: string;
  motorista_id: string | null;
  passageiro_nome?: string;
  passageiro_telefone?: string;
  motorista_nome?: string;
  motorista_telefone?: string;
  motorista_veiculo?: string;
  motorista_placa?: string;
  mensagens_count?: number;
}

const STATUS_INFO: Record<string, { label: string; color: string; dot: string }> = {
  solicitada:   { label: "Buscando",        color: "bg-muted-foreground/15 text-muted-foreground", dot: "bg-muted-foreground" },
  aceita:       { label: "A caminho",       color: "bg-amber-500/15 text-amber-600",               dot: "bg-amber-500" },
  aguardando:   { label: "Aguardando",      color: "bg-emerald-500/15 text-emerald-600",           dot: "bg-emerald-500" },
  em_andamento: { label: "Em rota",         color: "bg-primary/15 text-primary",                   dot: "bg-primary animate-pulse" },
};

const PAYMENT_LABEL: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao: "Maquininha",
  card: "Maquininha",
  maquininha: "Maquininha",
};

const fmtTime = (iso?: string | null) => iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDate = (iso?: string | null) => iso ? new Date(iso).toLocaleDateString("pt-BR") : "—";

function StepDot({ done, active, label, time }: { done: boolean; active?: boolean; label: string; time?: string | null }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[60px]">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
        done ? "bg-emerald-500 border-emerald-500 text-white" :
        active ? "bg-primary border-primary text-primary-foreground animate-pulse" :
        "bg-card border-border text-muted-foreground"
      }`}>
        {done ? <CheckCircle2 size={14} /> : <Circle size={10} />}
      </div>
      <p className="text-[10px] text-muted-foreground font-medium leading-none text-center">{label}</p>
      {time && <p className="text-[9px] text-muted-foreground/70">{time}</p>}
    </div>
  );
}

const RideCard = ({ r }: { r: RideLive }) => {
  const st = STATUS_INFO[r.status] || STATUS_INFO.solicitada;
  const valor = Number(r.valor_final || r.valor || 0);
  const tentativas = r.motorista_tentativas?.length || 0;
  const stepAceito = !!r.aceita_em;
  const stepIniciado = !!r.iniciada_em;
  const stepFinalizado = !!r.finalizada_em;
  const isCancelada = !!r.cancelada_em;

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2 bg-muted/30">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full ${st.dot} shrink-0`} />
            <Badge variant="outline" className={`text-[10px] ${st.color} border-0`}>{st.label}</Badge>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
              <Hash size={10} />{r.id.slice(0, 8)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
            <Clock size={10} />
            {fmtTime(r.created_at)} • {fmtDate(r.created_at)}
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: passageiro + motorista */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <User size={14} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Passageiro</p>
                <p className="text-sm font-semibold truncate">{r.passageiro_nome || "—"}</p>
                {r.passageiro_telefone && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Phone size={10} />{r.passageiro_telefone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                <UserCheck size={14} className="text-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Motorista</p>
                <p className="text-sm font-semibold truncate">{r.motorista_nome || "Aguardando aceite..."}</p>
                {r.motorista_veiculo && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {r.motorista_veiculo} {r.motorista_placa ? `• ${r.motorista_placa}` : ""}
                  </p>
                )}
                {r.motorista_telefone && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Phone size={10} />{r.motorista_telefone}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-muted/40 rounded-md p-2 text-center">
                <Car size={12} className="mx-auto text-primary mb-0.5" />
                <p className="text-[9px] uppercase text-muted-foreground">Categoria</p>
                <p className="text-[11px] font-semibold truncate">{r.categoria}</p>
              </div>
              <div className="bg-muted/40 rounded-md p-2 text-center">
                <CreditCard size={12} className="mx-auto text-emerald-500 mb-0.5" />
                <p className="text-[9px] uppercase text-muted-foreground">Pagamento</p>
                <p className="text-[11px] font-semibold truncate">{PAYMENT_LABEL[r.forma_pagamento] || r.forma_pagamento}</p>
              </div>
              <div className="bg-muted/40 rounded-md p-2 text-center">
                <MessageCircle size={12} className="mx-auto text-amber-500 mb-0.5" />
                <p className="text-[9px] uppercase text-muted-foreground">Chat</p>
                <p className="text-[11px] font-semibold">{r.mensagens_count ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Right: rota */}
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Origem</p>
                  <p className="text-xs leading-tight">{r.origem_endereco}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Navigation size={14} className="text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Destino</p>
                  <p className="text-xs leading-tight">{r.destino_endereco}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/40 rounded-md p-2 text-center">
                <p className="text-[9px] uppercase text-muted-foreground">Distância</p>
                <p className="text-sm font-bold text-primary">{Number(r.distancia_km || 0).toFixed(2)} km</p>
              </div>
              <div className="bg-muted/40 rounded-md p-2 text-center">
                <p className="text-[9px] uppercase text-muted-foreground">Tempo</p>
                <p className="text-sm font-bold text-primary">{Math.round(Number(r.duracao_min || 0))} min</p>
              </div>
              <div className="bg-muted/40 rounded-md p-2 text-center">
                <p className="text-[9px] uppercase text-muted-foreground">Valor</p>
                <p className="text-sm font-bold text-emerald-500">R$ {valor.toFixed(2)}</p>
              </div>
            </div>

            {tentativas > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Search size={10} />
                <span>{tentativas} motorista{tentativas > 1 ? "s" : ""} buscado{tentativas > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="px-4 py-3 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            <StepDot done={true} label="Solicitada" time={fmtTime(r.created_at)} />
            <div className="flex-1 h-px bg-border min-w-[20px]" />
            <StepDot done={stepAceito} active={!stepAceito && !isCancelada} label="Atendida" time={fmtTime(r.aceita_em)} />
            <div className="flex-1 h-px bg-border min-w-[20px]" />
            <StepDot done={stepIniciado} active={stepAceito && !stepIniciado && !isCancelada} label="Iniciada" time={fmtTime(r.iniciada_em)} />
            <div className="flex-1 h-px bg-border min-w-[20px]" />
            <StepDot done={stepFinalizado} active={stepIniciado && !stepFinalizado && !isCancelada} label="Finalizada" time={fmtTime(r.finalizada_em)} />
          </div>
          {isCancelada && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-destructive">
              <AlertCircle size={12} /> Cancelada em {fmtTime(r.cancelada_em)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const AcompanhamentoTempoReal = () => {
  const [rides, setRides] = useState<RideLive[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("ativas");
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchRides = async () => {
    const { data } = await supabase
      .from("rides")
      .select("*")
      .in("status", ["solicitada", "aceita", "aguardando", "em_andamento"])
      .order("created_at", { ascending: false });

    if (!data) { setRides([]); setLoading(false); return; }

    const userIds = [...new Set([
      ...data.map(r => r.passageiro_id),
      ...data.map(r => r.motorista_id).filter(Boolean) as string[],
    ])];

    const [profilesRes, msgsRes] = await Promise.all([
      userIds.length ? supabase.from("profiles").select("id, nome, telefone, veiculo_modelo, veiculo_placa").in("id", userIds) : Promise.resolve({ data: [] as any[] }),
      data.length ? supabase.from("ride_messages").select("ride_id").in("ride_id", data.map(r => r.id)) : Promise.resolve({ data: [] as any[] }),
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
    const msgCount: Record<string, number> = {};
    (msgsRes.data || []).forEach((m: any) => { msgCount[m.ride_id] = (msgCount[m.ride_id] || 0) + 1; });

    setRides(data.map(r => {
      const pax = profileMap.get(r.passageiro_id);
      const mot = r.motorista_id ? profileMap.get(r.motorista_id) : null;
      return {
        ...r,
        passageiro_nome: pax?.nome,
        passageiro_telefone: pax?.telefone,
        motorista_nome: mot?.nome,
        motorista_telefone: mot?.telefone,
        motorista_veiculo: mot?.veiculo_modelo,
        motorista_placa: mot?.veiculo_placa,
        mensagens_count: msgCount[r.id] || 0,
      } as RideLive;
    }));
    setLoading(false);
    setLastUpdate(new Date());
  };

  useEffect(() => { fetchRides(); }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("admin-rides-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "rides" }, () => fetchRides())
      .on("postgres_changes", { event: "*", schema: "public", table: "ride_messages" }, () => fetchRides())
      .subscribe();
    const interval = setInterval(fetchRides, 10000);
    return () => { supabase.removeChannel(channel); clearInterval(interval); };
  }, []);

  const counts = useMemo(() => ({
    buscando:   rides.filter(r => r.status === "solicitada").length,
    aceitas:    rides.filter(r => r.status === "aceita").length,
    aguardando: rides.filter(r => r.status === "aguardando").length,
    emRota:     rides.filter(r => r.status === "em_andamento").length,
    valor:      rides.reduce((s, r) => s + Number(r.valor_final || r.valor || 0), 0),
  }), [rides]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rides;
    if (tab === "buscando")   list = list.filter(r => r.status === "solicitada");
    if (tab === "andamento")  list = list.filter(r => ["aceita", "aguardando", "em_andamento"].includes(r.status));
    if (!q) return list;
    return list.filter(r =>
      [r.passageiro_nome, r.motorista_nome, r.origem_endereco, r.destino_endereco, r.id, r.motorista_placa]
        .some(s => s?.toLowerCase().includes(q))
    );
  }, [rides, search, tab]);

  const stats = [
    { label: "BUSCANDO",   value: counts.buscando,   color: "border-l-muted-foreground", icon: Search, iconColor: "text-muted-foreground" },
    { label: "A CAMINHO",  value: counts.aceitas,    color: "border-l-amber-500",        icon: Car, iconColor: "text-amber-500" },
    { label: "AGUARDANDO", value: counts.aguardando, color: "border-l-emerald-500",      icon: Clock, iconColor: "text-emerald-500" },
    { label: "EM ROTA",    value: counts.emRota,     color: "border-l-primary",          icon: TrendingUp, iconColor: "text-primary" },
    { label: "VALOR ATIVO", value: `R$ ${counts.valor.toFixed(2)}`, color: "border-l-sky-500", icon: DollarSign, iconColor: "text-sky-500" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio size={22} className="text-primary" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Acompanhamento em Tempo Real</h1>
            <p className="text-[11px] text-muted-foreground">
              Atualizado {fmtTime(lastUpdate.toISOString())} • {rides.length} corrida{rides.length !== 1 ? "s" : ""} ativa{rides.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRides} className="gap-1">
          <RefreshCw size={14} /> Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className={`bg-card border-border border-l-4 ${s.color}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </div>
              <s.icon size={20} className={s.iconColor} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="ativas" className="text-xs">Todas ({rides.length})</TabsTrigger>
            <TabsTrigger value="buscando" className="text-xs">Buscando ({counts.buscando})</TabsTrigger>
            <TabsTrigger value="andamento" className="text-xs">Em andamento ({counts.aceitas + counts.aguardando + counts.emRota})</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          placeholder="Buscar por nome, endereço, placa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-72 h-9 text-xs bg-background border-border"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-border border-dashed">
          <CardContent className="py-16 flex flex-col items-center gap-2 text-center">
            <Radio size={32} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Nenhuma corrida ativa no momento.</p>
            <p className="text-[11px] text-muted-foreground/60">Novas corridas aparecerão aqui automaticamente.</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[calc(100vh-320px)]">
          <div className="space-y-3 pr-3">
            {filtered.map(r => <RideCard key={r.id} r={r} />)}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default AcompanhamentoTempoReal;
