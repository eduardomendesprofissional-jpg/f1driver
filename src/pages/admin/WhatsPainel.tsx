import { MessageCircle, Filter, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { useTable } from "@/hooks/use-table";
import { exportToCSV } from "@/lib/table-utils";
import { toast } from "sonner";

const headers = [
  { key: "status", label: "STATUS" },
  { key: "passageiro", label: "PASSAGEIRO" },
  { key: "enderecos", label: "ENDEREÇOS" },
  { key: "valor", label: "VALOR" },
  { key: "motorista", label: "MOTORISTA" },
  { key: "data", label: "DATA" },
];

const WhatsPainel = () => {
  const [status, setStatus] = useState("aceitas-canceladas");
  const today = new Date().toISOString().split("T")[0];
  const [historico] = useState<Record<string, unknown>[]>([]);
  const table = useTable({ data: historico, searchKeys: ["passageiro", "motorista", "enderecos"] });

  const handleFiltrar = () => {
    toast.info("Filtro aplicado com sucesso.");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 p-5 text-white">
        <button className="flex items-center gap-2 text-lg font-bold">
          <MessageCircle size={22} />
          Top Motoristas (Aceites)
          <ChevronDown size={18} />
        </button>
        <div className="mt-4 bg-white/10 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20 hover:bg-transparent">
                <TableHead className="text-white/80 text-xs font-semibold">POS.</TableHead>
                <TableHead className="text-white/80 text-xs font-semibold">MOTORISTA</TableHead>
                <TableHead className="text-white/80 text-xs font-semibold text-center">ACEITAS</TableHead>
                <TableHead className="text-white/80 text-xs font-semibold text-right">ÚLTIMA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableCell colSpan={4} className="text-center text-white/60 py-6 text-sm">Sem dados para o período.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4 md:p-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Início</label>
              <Input type="date" defaultValue={today} className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fim</label>
              <Input type="date" defaultValue={today} className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aceitas-canceladas">Aceitas e Canceladas</SelectItem>
                  <SelectItem value="aceitas">Aceitas</SelectItem>
                  <SelectItem value="canceladas">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cidade</label>
              <Input placeholder="Cidade..." className="bg-background border-border" />
            </div>
            <Button onClick={handleFiltrar} className="h-10 gap-2 bg-emerald-500 hover:bg-emerald-600 text-white col-span-2 md:col-span-1">
              <Filter size={16} /> Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-emerald-500">Histórico (Aceitas & Canceladas)</h2>
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => exportToCSV(historico, headers, "whats-historico")}>CSV</Button>
              <Input placeholder="Buscar..." value={table.search} onChange={(e) => table.setSearch(e.target.value)} className="w-40 h-8 text-xs bg-background border-border" />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {headers.map((h) => (
                      <TableHead key={h.key} className="text-xs font-semibold">{h.label}</TableHead>
                    ))}
                    <TableHead className="text-xs font-semibold">AÇÃO</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.paginatedData.length > 0 ? table.paginatedData.map((r, i) => (
                    <TableRow key={i}>
                      {headers.map((h) => (
                        <TableCell key={h.key} className="text-sm">{String(r[h.key] ?? "")}</TableCell>
                      ))}
                      <TableCell className="text-sm">—</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-sm">Nenhum registro encontrado</TableCell>
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
    </div>
  );
};

export default WhatsPainel;
