import { PlusSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { useTable } from "@/hooks/use-table";
import { exportToCSV, exportToPDF, printTable } from "@/lib/table-utils";

const headers = [
  { key: "id", label: "ID" },
  { key: "motorista", label: "Motorista" },
  { key: "passageiro", label: "Passageiro" },
  { key: "status", label: "Status da Corrida" },
  { key: "valor", label: "Valor da Corrida" },
];

const ViagensTodas = () => {
  const [viagens] = useState<Record<string, unknown>[]>([]);
  const table = useTable({ data: viagens, searchKeys: ["id", "motorista", "passageiro", "status"] });

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="p-5 pb-0">
            <h2 className="text-lg font-bold text-primary">Corridas</h2>
            <p className="text-sm text-muted-foreground">Acompanhe e obtenha mais detalhes de suas corridas.</p>
          </div>

          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary" onClick={() => printTable(viagens, headers, "Corridas")}>Print</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary" onClick={() => exportToCSV(viagens, headers, "corridas")}>CSV</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary" onClick={() => exportToPDF(viagens, headers, "Corridas")}>PDF</Button>
            </div>
            <Input placeholder="Procurar" value={table.search} onChange={(e) => table.setSearch(e.target.value)} className="w-40 h-8 text-xs bg-background border-border" />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">ID</TableHead>
                  <TableHead className="text-xs font-semibold">Motorista</TableHead>
                  <TableHead className="text-xs font-semibold">Passageiro</TableHead>
                  <TableHead className="text-xs font-semibold">Status da Corrida</TableHead>
                  <TableHead className="text-xs font-semibold">Valor da Corrida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.paginatedData.length > 0 ? table.paginatedData.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5">
                        <PlusSquare size={14} className="text-primary" />
                        {String(row.id)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{String(row.motorista)}</TableCell>
                    <TableCell className="text-sm">{String(row.passageiro)}</TableCell>
                    <TableCell className="text-sm">{String(row.status)}</TableCell>
                    <TableCell className="text-sm font-medium">{String(row.valor)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">
                      Nenhuma corrida registrada.
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

export default ViagensTodas;
