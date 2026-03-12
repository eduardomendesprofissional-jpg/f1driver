import { Filter, ChevronDown, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { useTable } from "@/hooks/use-table";
import { exportToCSV, printTable } from "@/lib/table-utils";
import { toast } from "sonner";

const headers = [
  { key: "id", label: "ID" },
  { key: "dataHora", label: "DATA/HORA" },
  { key: "status", label: "STATUS" },
  { key: "motorista", label: "MOTORISTA" },
  { key: "idMotorista", label: "ID" },
  { key: "origem", label: "ORIGEM (LOG)" },
  { key: "destino", label: "DESTINO (LOG)" },
];

const ViagensRegistroChamadas = () => {
  const today = new Date().toISOString().split("T")[0];
  const [registros] = useState<Record<string, unknown>[]>([]);
  const table = useTable({ data: registros, searchKeys: ["motorista", "origem", "destino", "status"] });

  const handleAtualizar = () => {
    toast.info("Período atualizado.");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <h2 className="text-lg font-bold text-primary mb-4">Filtro de Período</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">Data Inicial</label>
              <Input type="date" defaultValue={today} className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">Data Final</label>
              <Input type="date" defaultValue={today} className="bg-background border-border" />
            </div>
            <Button onClick={handleAtualizar} className="h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Filter size={16} /> Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Funil */}
      <div className="rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 p-5 text-white">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2 text-lg font-bold">
            Funil de Aceitação (Top 10)
            <ChevronDown size={18} />
          </button>
          <span className="text-xs text-white/80">Quem mais recebe vs. aceita</span>
        </div>
        <div className="mt-4 bg-white rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 text-muted-foreground">
            <Info size={14} />
            <span className="text-sm">Análise de eficiência dos motoristas que mais recebem chamados em tela.</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-foreground">MOTORISTA</TableHead>
                <TableHead className="text-xs font-semibold text-foreground">RECEBEU EM TELA</TableHead>
                <TableHead className="text-xs font-semibold text-foreground">ACEITOU</TableHead>
                <TableHead className="text-xs font-semibold text-foreground">TAXA DE ACEITAÇÃO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-sm">
                  Nenhum dado encontrado para este período.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Log Detalhado */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="p-5 pb-0">
            <h2 className="text-lg font-bold text-primary mb-3">Log Detalhado de Disparos</h2>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => exportToCSV(registros, headers, "registro-chamadas")}>CSV</Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => printTable(registros, headers, "Registro de Chamadas")}>Print</Button>
            </div>
            <Input placeholder="Buscar..." value={table.search} onChange={(e) => table.setSearch(e.target.value)} className="w-40 h-8 text-xs bg-background border-border" />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {headers.map((h) => (
                    <TableHead key={h.key} className="text-xs font-semibold">{h.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.paginatedData.length > 0 ? table.paginatedData.map((r, i) => (
                  <TableRow key={i}>
                    {headers.map((h) => (
                      <TableCell key={h.key} className="text-sm">{String(r[h.key] ?? "")}</TableCell>
                    ))}
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-sm">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-muted-foreground">
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

export default ViagensRegistroChamadas;
