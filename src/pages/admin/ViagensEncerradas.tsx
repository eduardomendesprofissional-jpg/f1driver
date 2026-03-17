import { useState, useEffect } from "react";
import { Trophy, Filter, ChevronDown, Loader2, Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV, printTable } from "@/lib/table-utils";
import { toast } from "sonner";

interface ViagemEncerrada {
  id: string;
  status: string;
  origem_endereco: string;
  destino_endereco: string;
  valor: number | null;
  valor_final: number | null;
  forma_pagamento: string;
  created_at: string;
  finalizada_em: string | null;
  cancelada_em: string | null;
  passageiro_nome?: string;
  motorista_nome?: string;
}

const headers = [
  { key: "status", label: "Status" },
  { key: "motorista_nome", label: "Motorista" },
  { key: "passageiro_nome", label: "Passageiro" },
  { key: "valor_display", label: "Valor" },
  { key: "origem_endereco", label: "Origem" },
  { key: "destino_endereco", label: "Destino" },
  { key: "data_display", label: "Data/Hora" },
  { key: "forma_pagamento", label: "Pagamento" },
];

const ViagensEncerradas = () => {
  const [statusFilter, setStatusFilter] = useState("todos");
  const [viagens, setViagens] = useState<ViagemEncerrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split("T")[0];
  });
  const [dataFim, setDataFim] = useState(today);

  const fetchViagens = async () => {
    setLoading(true);
    let query = supabase
      .from("rides")
      .select("id, status, origem_endereco, destino_endereco, valor, valor_final, forma_pagamento, created_at, finalizada_em, cancelada_em, passageiro_id, motorista_id")
      .in("status", ["finalizada", "cancelada", "no_show"])
      .gte("created_at", `${dataInicio}T00:00:00`)
      .lte("created_at", `${dataFim}T23:59:59`)
      .order("created_at", { ascending: false })
      .limit(200);

    const { data } = await query;

    if (data && data.length > 0) {
      const userIds = [...new Set([...data.map(r => r.passageiro_id), ...data.map(r => r.motorista_id).filter(Boolean)])];
      const { data: profiles } = await supabase.from("profiles").select("id, nome").in("id", userIds as string[]);
      const profileMap = new Map((profiles || []).map(p => [p.id, p.nome]));

      setViagens(data.map(r => ({
        ...r,
        passageiro_nome: profileMap.get(r.passageiro_id) || "Passageiro",
        motorista_nome: r.motorista_id ? (profileMap.get(r.motorista_id) || "Motorista") : "—",
      })));
    } else {
      setViagens([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchViagens(); }, []);

  const handleFiltrar = () => {
    fetchViagens();
    toast.info("Filtro aplicado.");
  };

  const filtered = viagens.filter(v => {
    if (statusFilter !== "todos" && v.status !== statusFilter) return false;
    const q = search.toLowerCase();
    return !q || [v.passageiro_nome, v.motorista_nome, v.origem_endereco, v.destino_endereco].some(s => s?.toLowerCase().includes(q));
  });

  // Top 5 drivers
  const driverStats: Record<string, { nome: string; finalizadas: number; cancMot: number; cancPass: number }> = {};
  viagens.forEach(v => {
    if (!v.motorista_nome || v.motorista_nome === "—") return;
    if (!driverStats[v.motorista_nome]) driverStats[v.motorista_nome] = { nome: v.motorista_nome, finalizadas: 0, cancMot: 0, cancPass: 0 };
    if (v.status === "finalizada") driverStats[v.motorista_nome].finalizadas++;
    if (v.status === "cancelada") driverStats[v.motorista_nome].cancMot++;
  });
  const top5 = Object.values(driverStats).sort((a, b) => b.finalizadas - a.finalizadas).slice(0, 5);

  const exportData = filtered.map(v => ({
    status: v.status,
    motorista_nome: v.motorista_nome,
    passageiro_nome: v.passageiro_nome,
    valor_display: `R$ ${Number(v.valor_final || v.valor || 0).toFixed(2)}`,
    origem_endereco: v.origem_endereco,
    destino_endereco: v.destino_endereco,
    data_display: new Date(v.created_at).toLocaleString("pt-BR"),
    forma_pagamento: v.forma_pagamento,
  }));

  return (
    <div className="space-y-6">
      {/* Top 5 */}
      <div className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-500 p-5 text-white">
        <div className="flex items-center gap-2 text-lg font-bold">
          <Trophy size={22} />
          Top 5 Performance
        </div>
        <div className="mt-4 bg-white/10 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20 hover:bg-transparent">
                <TableHead className="text-white/80 text-xs font-semibold">POS.</TableHead>
                <TableHead className="text-white/80 text-xs font-semibold">MOTORISTA</TableHead>
                <TableHead className="text-blue-200 text-xs font-semibold text-center">FINALIZADAS</TableHead>
                <TableHead className="text-white/80 text-xs font-semibold text-right">EFICIÊNCIA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top5.length === 0 ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={4} className="text-center text-white/60 py-6 text-sm">Sem dados para o período.</TableCell>
                </TableRow>
              ) : top5.map((d, i) => {
                const total = d.finalizadas + d.cancMot;
                const eficiencia = total > 0 ? ((d.finalizadas / total) * 100).toFixed(0) : "100";
                return (
                  <TableRow key={i} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-white font-bold">{i + 1}º</TableCell>
                    <TableCell className="text-white">{d.nome}</TableCell>
                    <TableCell className="text-blue-200 text-center font-bold">{d.finalizadas}</TableCell>
                    <TableCell className="text-white text-right font-bold">{eficiencia}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <h2 className="text-lg font-bold text-primary mb-4">Filtros de Pesquisa</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">Data Início</label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">Data Fim</label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="no_show">No-show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleFiltrar} className="h-10 gap-2">
              <Filter size={16} /> Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Listagem */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => exportToCSV(exportData as any, headers, "viagens-encerradas")}>CSV</Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => printTable(exportData as any, headers, "Viagens Encerradas")}>Print</Button>
            </div>
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48 h-8 text-xs bg-background border-border" />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Motorista</TableHead>
                  <TableHead className="text-xs font-semibold">Passageiro</TableHead>
                  <TableHead className="text-xs font-semibold">Valor</TableHead>
                  <TableHead className="text-xs font-semibold">Origem</TableHead>
                  <TableHead className="text-xs font-semibold">Data/Hora</TableHead>
                  <TableHead className="text-xs font-semibold">Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-sm">Nenhum registro encontrado.</TableCell>
                  </TableRow>
                ) : filtered.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <Badge variant={v.status === "finalizada" ? "default" : "destructive"} className="text-[10px]">
                        {v.status === "finalizada" ? "Finalizada" : v.status === "no_show" ? "No-show" : "Cancelada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{v.motorista_nome}</TableCell>
                    <TableCell className="text-sm">{v.passageiro_nome}</TableCell>
                    <TableCell className="text-sm font-semibold text-primary">R$ {Number(v.valor_final || v.valor || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">{v.origem_endereco}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(v.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-sm capitalize">{v.forma_pagamento}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViagensEncerradas;
