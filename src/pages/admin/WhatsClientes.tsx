import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { useTable } from "@/hooks/use-table";
import { exportToCSV, printTable } from "@/lib/table-utils";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const headers = [
  { key: "tipo", label: "Tipo" },
  { key: "nome", label: "Nome do Cliente" },
  { key: "telefone", label: "WhatsApp" },
  { key: "status_aprovacao", label: "Status" },
  { key: "created_at", label: "Cadastro" },
];

interface Cliente {
  id: string;
  nome: string | null;
  telefone: string | null;
  tipo: string;
  status_aprovacao: string;
  created_at: string;
  [key: string]: unknown;
}

const WhatsClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const table = useTable({ data: clientes, searchKeys: ["nome", "telefone", "tipo"] });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, telefone, tipo, status_aprovacao, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (!error && data) setClientes(data as Cliente[]);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel("profiles-clientes")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => load())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fmtDate = (v: string) => {
    try { return new Date(v).toLocaleDateString("pt-BR"); } catch { return v; }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <Users size={24} />
          <div>
            <h1 className="text-lg font-bold">Meus Clientes</h1>
            <p className="text-xs text-white/80">Todos os usuários cadastrados (passageiros e motoristas)</p>
          </div>
        </div>
        <span className="bg-white text-rose-500 text-sm font-bold px-3 py-1 rounded-full">{clientes.length} Total</span>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => exportToCSV(clientes, headers, "clientes-whatsapp")}>Exportar CSV</Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => printTable(clientes, headers, "Clientes WhatsApp")}>Imprimir</Button>
            </div>
            <Input placeholder="Buscar..." value={table.search} onChange={(e) => table.setSearch(e.target.value)} className="w-40 h-8 text-xs bg-background border-border" />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Tipo</TableHead>
                  <TableHead className="text-xs font-semibold">Nome do Cliente</TableHead>
                  <TableHead className="text-xs font-semibold">WhatsApp</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">Carregando...</TableCell></TableRow>
                ) : table.paginatedData.length > 0 ? table.paginatedData.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">
                      <Badge variant={c.tipo === "motorista" ? "default" : "secondary"} className="capitalize">{c.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{c.nome || "—"}</TableCell>
                    <TableCell className="text-sm">{c.telefone || "—"}</TableCell>
                    <TableCell className="text-sm capitalize">{c.status_aprovacao}</TableCell>
                    <TableCell className="text-sm">{fmtDate(c.created_at)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
            <span>{table.paginationLabel}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="text-xs h-8" disabled={!table.canPrev} onClick={table.prev}>Anterior</Button>
              <Button variant="outline" size="sm" className="text-xs h-8" disabled={!table.canNext} onClick={table.next}>Próximo</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsClientes;
