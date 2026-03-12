import { RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { useTable } from "@/hooks/use-table";

const CaixaResumo = () => {
  const [entradas] = useState<Record<string, unknown>[]>([]);
  const table = useTable({ data: entradas, searchKeys: ["motorista", "data", "situacao"] });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6 text-center space-y-3">
            <h2 className="text-lg font-bold text-emerald-500">Saldo Disponível (Empresa)</h2>
            <p className="text-sm text-muted-foreground">Total acumulado no App</p>
            <p className="text-4xl font-bold text-emerald-500">R$ 0,00</p>
            <Button disabled className="w-full h-11 bg-muted text-muted-foreground font-bold uppercase tracking-wider">Saldo Insuficiente</Button>
            <p className="text-xs text-emerald-500">Mínimo para saque: R$ 2,01</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <RefreshCw size={18} className="text-foreground" />
              <h2 className="text-base font-bold">Histórico de Saques</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs font-semibold">Data</TableHead>
                  <TableHead className="text-xs font-semibold">Valores (Bruto / Líquido)</TableHead>
                  <TableHead className="text-xs font-semibold">Detalhes Pix</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-sm">Nenhum saque realizado.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="p-5 pb-0">
            <h2 className="text-lg font-bold text-primary mb-4">Extrato Geral de Entradas</h2>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Exibir</span>
              <Select value={String(table.pageSize)} onValueChange={(v) => table.setPageSize(Number(v))}>
                <SelectTrigger className="w-20 h-8 bg-background border-border text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>resultados por página</span>
            </div>
            <Input placeholder="Buscar registros" value={table.search} onChange={(e) => table.setSearch(e.target.value)} className="w-44 h-8 text-xs bg-background border-border" />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Data</TableHead>
                  <TableHead className="text-xs font-semibold">Motorista</TableHead>
                  <TableHead className="text-xs font-semibold">Valor Liq.</TableHead>
                  <TableHead className="text-xs font-semibold">Situação</TableHead>
                  <TableHead className="text-xs font-semibold">Status Saque</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.paginatedData.length > 0 ? table.paginatedData.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{String(e.data)}</TableCell>
                    <TableCell className="text-sm">{String(e.motorista)}</TableCell>
                    <TableCell className="text-sm">{String(e.valorLiq)}</TableCell>
                    <TableCell className="text-sm">{String(e.situacao)}</TableCell>
                    <TableCell className="text-sm">{String(e.statusSaque)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">Nenhum registro encontrado</TableCell>
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

export default CaixaResumo;
