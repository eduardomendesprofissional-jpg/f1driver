import { useState, useEffect } from "react";
import { Search, User, CheckCircle2, Clock, XCircle, Eye, Car, FileText, Shield, Wallet, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DriverProfile {
  id: string;
  nome: string | null;
  telefone: string | null;
  avatar_url: string | null;
  cpf: string | null;
  cnh: string | null;
  veiculo_placa: string | null;
  veiculo_modelo: string | null;
  veiculo_cor: string | null;
  status_aprovacao: string;
  created_at: string;
  driver_balance?: number | null;
  is_blocked?: boolean | null;
}

interface DriverStats {
  totalCorridas: number;
  corridasFinalizadas: number;
  totalRecargas: number;
  recargasAprovadas: number;
  horaPico: string | null;
  ultimaCorrida: string | null;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive"; icon: typeof CheckCircle2 }> = {
  pendente: { label: "Pendente", variant: "secondary", icon: Clock },
  em_analise: { label: "Em análise", variant: "default", icon: Clock },
  aprovado: { label: "Aprovado", variant: "default", icon: CheckCircle2 },
  rejeitado: { label: "Rejeitado", variant: "destructive", icon: XCircle },
};

const Motoristas = () => {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<DriverProfile | null>(null);
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    if (selectedDriver) fetchStats(selectedDriver.id);
    else setStats(null);
  }, [selectedDriver]);

  const fetchDrivers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome, telefone, avatar_url, cpf, cnh, veiculo_placa, veiculo_modelo, veiculo_cor, status_aprovacao, created_at, driver_balance, is_blocked")
      .eq("tipo", "motorista")
      .order("created_at", { ascending: false });
    if (!error && data) setDrivers(data as unknown as DriverProfile[]);
    setLoading(false);
  };

  const fetchStats = async (driverId: string) => {
    setLoadingStats(true);
    const [ridesRes, creditsRes] = await Promise.all([
      supabase.from("rides").select("status, iniciada_em, finalizada_em").eq("motorista_id", driverId),
      supabase.from("extrato_creditos").select("valor, status").eq("perfil_id", driverId),
    ]);
    const rides = (ridesRes.data || []) as any[];
    const credits = (creditsRes.data || []) as any[];

    const horas: Record<number, number> = {};
    let ultima: string | null = null;
    rides.forEach((r) => {
      const dt = r.iniciada_em || r.finalizada_em;
      if (dt) {
        const h = new Date(dt).getHours();
        horas[h] = (horas[h] || 0) + 1;
        if (!ultima || dt > ultima) ultima = dt;
      }
    });
    const horaPicoNum = Object.entries(horas).sort((a, b) => b[1] - a[1])[0]?.[0];
    const horaPico = horaPicoNum != null ? `${String(horaPicoNum).padStart(2, "0")}:00 - ${String((+horaPicoNum + 1) % 24).padStart(2, "0")}:00` : null;

    setStats({
      totalCorridas: rides.length,
      corridasFinalizadas: rides.filter((r) => r.status === "finalizada").length,
      totalRecargas: credits.filter((c) => c.status === "aprovado").reduce((s, c) => s + Number(c.valor || 0), 0),
      recargasAprovadas: credits.filter((c) => c.status === "aprovado").length,
      horaPico,
      ultimaCorrida: ultima,
    });
    setLoadingStats(false);
  };

  const updateStatus = async (driverId: string, status: string) => {
    setUpdating(true);
    const { error } = await supabase
      .from("profiles")
      .update({ status_aprovacao: status } as any)
      .eq("id", driverId);
    setUpdating(false);
    if (error) return toast.error("Erro ao atualizar status");
    toast.success(status === "aprovado" ? "Motorista aprovado!" : "Motorista rejeitado");
    setDrivers((prev) => prev.map((d) => d.id === driverId ? { ...d, status_aprovacao: status } : d));
    setSelectedDriver((prev) => prev ? { ...prev, status_aprovacao: status } : null);

    // Send push notification
    supabase.functions.invoke("send-push-notification", {
      body: {
        user_id: driverId,
        title: status === "aprovado" ? "✅ Cadastro aprovado!" : "❌ Cadastro não aprovado",
        body: status === "aprovado"
          ? "Seu cadastro foi aprovado! Agora você pode ficar online e receber corridas."
          : "Seu cadastro não foi aprovado. Revise seus dados e envie novamente.",
        data: { type: "approval_status", status },
      },
    }).catch(() => {});
  };

  const seedCredit = async (driverId: string) => {
    setUpdating(true);
    const { error } = await supabase
      .from("extrato_creditos" as any)
      .insert({ perfil_id: driverId, valor: 50, status: "aprovado" } as any);
    setUpdating(false);
    if (error) return toast.error("Erro ao creditar: " + error.message);
    toast.success("R$ 50,00 creditados ao motorista (teste).");
  };

  const filtered = drivers.filter((d) => {
    const q = searchQuery.toLowerCase();
    return !q || [d.nome, d.cpf, d.veiculo_placa, d.veiculo_modelo].some((v) => v?.toLowerCase().includes(q));
  });

  const counts = {
    total: drivers.length,
    pendente: drivers.filter((d) => d.status_aprovacao === "pendente").length,
    em_analise: drivers.filter((d) => d.status_aprovacao === "em_analise").length,
    aprovado: drivers.filter((d) => d.status_aprovacao === "aprovado").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.total, color: "text-foreground" },
          { label: "Pendentes", value: counts.pendente, color: "text-muted-foreground" },
          { label: "Em análise", value: counts.em_analise, color: "text-amber-500" },
          { label: "Aprovados", value: counts.aprovado, color: "text-success" },
        ].map((s) => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h2 className="font-semibold text-sm">Motoristas cadastrados</h2>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48 h-8 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Motorista</TableHead>
                  <TableHead className="text-xs font-semibold">CPF</TableHead>
                  <TableHead className="text-xs font-semibold">Veículo</TableHead>
                  <TableHead className="text-xs font-semibold">Placa</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                      Nenhum motorista encontrado.
                    </TableCell>
                  </TableRow>
                ) : filtered.map((d) => {
                  const st = STATUS_MAP[d.status_aprovacao] || STATUS_MAP.pendente;
                  const StIcon = st.icon;
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            {d.avatar_url ? <AvatarImage src={d.avatar_url} /> : null}
                            <AvatarFallback className="text-xs bg-secondary">{d.nome?.charAt(0)?.toUpperCase() || "M"}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{d.nome || "Sem nome"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.cpf || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.veiculo_modelo || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.veiculo_placa || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={st.variant} className="text-[10px] gap-1">
                          <StIcon size={10} />
                          {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setSelectedDriver(d)}>
                          <Eye size={14} /> Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedDriver} onOpenChange={() => setSelectedDriver(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User size={18} />
              Dados do Motorista
            </DialogTitle>
          </DialogHeader>
          {selectedDriver && (() => {
            const st = STATUS_MAP[selectedDriver.status_aprovacao] || STATUS_MAP.pendente;
            const StIcon = st.icon;
            return (
              <div className="space-y-4">
                {/* Avatar + Name */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    {selectedDriver.avatar_url ? <AvatarImage src={selectedDriver.avatar_url} /> : null}
                    <AvatarFallback className="bg-secondary text-primary text-lg">
                      {selectedDriver.nome?.charAt(0)?.toUpperCase() || "M"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-foreground">{selectedDriver.nome || "Sem nome"}</p>
                    <Badge variant={st.variant} className="text-[10px] gap-1 mt-1">
                      <StIcon size={10} />
                      {st.label}
                    </Badge>
                  </div>
                </div>

                {/* Personal */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Shield size={12} /> Dados Pessoais
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">CPF:</span> <span className="font-medium">{selectedDriver.cpf || "—"}</span></div>
                    <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{selectedDriver.telefone || "—"}</span></div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><FileText size={12} /> CNH:</span>
                    <span className="font-medium ml-5">{selectedDriver.cnh || "—"}</span>
                  </div>
                </div>

                {/* Vehicle */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Car size={12} /> Veículo
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Modelo:</span> <span className="font-medium">{selectedDriver.veiculo_modelo || "—"}</span></div>
                    <div><span className="text-muted-foreground">Cor:</span> <span className="font-medium">{selectedDriver.veiculo_cor || "—"}</span></div>
                    <div><span className="text-muted-foreground">Placa:</span> <span className="font-medium">{selectedDriver.veiculo_placa || "—"}</span></div>
                  </div>
                </div>

                {/* Actions */}
                {selectedDriver.status_aprovacao === "em_analise" && (
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 font-bold border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => updateStatus(selectedDriver.id, "pendente")}
                      disabled={updating}
                    >
                      <XCircle size={16} className="mr-2" />
                      Rejeitar
                    </Button>
                    <Button
                      className="flex-1 h-11 font-bold bg-success hover:bg-success/90 text-success-foreground"
                      onClick={() => updateStatus(selectedDriver.id, "aprovado")}
                      disabled={updating}
                    >
                      <CheckCircle2 size={16} className="mr-2" />
                      Aprovar
                    </Button>
                  </div>
                )}

                {selectedDriver.status_aprovacao === "aprovado" && (
                  <Button
                    variant="outline"
                    className="w-full h-11 font-bold border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => updateStatus(selectedDriver.id, "pendente")}
                    disabled={updating}
                  >
                    Revogar aprovação
                  </Button>
                )}

                {/* Seed test balance */}
                <Button
                  variant="outline"
                  className="w-full h-10 font-semibold border-primary/40 text-primary hover:bg-primary/10"
                  onClick={() => seedCredit(selectedDriver.id)}
                  disabled={updating}
                >
                  <Wallet size={14} className="mr-2" />
                  Creditar R$ 50,00 (teste)
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Motoristas;
