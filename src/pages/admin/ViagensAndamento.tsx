import { useState, useEffect } from "react";
import { Car, Loader2, MapPin, Eye, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface RideAndamento {
  id: string;
  status: string;
  origem_endereco: string;
  destino_endereco: string;
  valor: number | null;
  categoria: string;
  created_at: string;
  passageiro_id: string;
  motorista_id: string | null;
  passageiro_nome?: string;
  motorista_nome?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  solicitada: { label: "Buscando motorista", color: "bg-muted text-muted-foreground" },
  aceita: { label: "Indo ao passageiro", color: "bg-amber-500/15 text-amber-600" },
  aguardando: { label: "Aguardando embarque", color: "bg-emerald-500/15 text-emerald-600" },
  em_andamento: { label: "Em rota", color: "bg-primary/15 text-primary" },
};

const ViagensAndamento = () => {
  const [viagens, setViagens] = useState<RideAndamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchViagens = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("rides")
      .select("id, status, origem_endereco, destino_endereco, valor, categoria, created_at, passageiro_id, motorista_id")
      .in("status", ["solicitada", "aceita", "aguardando", "em_andamento"])
      .order("created_at", { ascending: false });

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

  // Auto-refresh every 15s
  useEffect(() => {
    const interval = setInterval(fetchViagens, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = viagens.filter(v => {
    const q = search.toLowerCase();
    return !q || [v.passageiro_nome, v.motorista_nome, v.origem_endereco, v.destino_endereco].some(s => s?.toLowerCase().includes(q));
  });

  const counts = {
    aceita: viagens.filter(v => v.status === "aceita").length,
    aguardando: viagens.filter(v => v.status === "aguardando").length,
    em_andamento: viagens.filter(v => v.status === "em_andamento").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "INDO AO PASSAGEIRO", value: counts.aceita, color: "border-b-4 border-b-amber-400" },
          { label: "AGUARDANDO EMBARQUE", value: counts.aguardando, color: "border-b-4 border-b-emerald-500" },
          { label: "EM ROTA (VIAJANDO)", value: counts.em_andamento, color: "border-b-4 border-b-sky-500" },
        ].map((card) => (
          <Card key={card.label} className={`bg-card border-border ${card.color}`}>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="p-5 pb-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car size={20} className="text-primary" />
              <div>
                <h2 className="text-lg font-bold text-primary">Corridas em Andamento</h2>
                <p className="text-xs text-muted-foreground">{viagens.length} corrida{viagens.length !== 1 ? "s" : ""} ativa{viagens.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchViagens} className="gap-1 text-xs">
              <RefreshCw size={14} /> Atualizar
            </Button>
          </div>

          <div className="flex items-center justify-end px-5 py-3">
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-48 h-8 text-xs bg-background border-border" />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Motorista</TableHead>
                  <TableHead className="text-xs font-semibold">Passageiro</TableHead>
                  <TableHead className="text-xs font-semibold">Origem</TableHead>
                  <TableHead className="text-xs font-semibold">Destino</TableHead>
                  <TableHead className="text-xs font-semibold">Valor Est.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="animate-spin h-6 w-6 text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                      Nenhuma corrida em andamento.
                    </TableCell>
                  </TableRow>
                ) : filtered.map((v) => {
                  const st = STATUS_LABELS[v.status] || STATUS_LABELS.solicitada;
                  return (
                    <TableRow key={v.id}>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{v.motorista_nome}</TableCell>
                      <TableCell className="text-sm">{v.passageiro_nome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{v.origem_endereco}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{v.destino_endereco}</TableCell>
                      <TableCell className="text-sm font-semibold text-primary">R$ {Number(v.valor || 0).toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViagensAndamento;
