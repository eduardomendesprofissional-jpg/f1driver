import { Tag, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { useTable } from "@/hooks/use-table";
import { exportToCSV, exportToPDF } from "@/lib/table-utils";
import { useConfirm } from "@/components/ConfirmDialogProvider";
import { toast } from "sonner";

const headers = [
  { key: "codigo", label: "Código" },
  { key: "tipo", label: "Tipo" },
  { key: "valor", label: "Valor" },
  { key: "usos", label: "Usos" },
  { key: "validade", label: "Validade" },
  { key: "status", label: "Status" },
];

const CuponsListar = () => {
  const [cupons] = useState<Record<string, unknown>[]>([]);
  const table = useTable({ data: cupons, searchKeys: ["codigo", "tipo"] });

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="p-5 pb-0 flex items-center gap-2">
            <Tag size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-primary">Cupons Cadastrados</h2>
          </div>

          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary" onClick={() => exportToCSV(cupons, headers, "cupons")}>CSV</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary" onClick={() => exportToPDF(cupons, headers, "Cupons")}>PDF</Button>
            </div>
            <Input placeholder="Buscar cupom..." value={table.search} onChange={(e) => table.setSearch(e.target.value)} className="w-44 h-8 text-xs bg-background border-border" />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Código</TableHead>
                  <TableHead className="text-xs font-semibold">Tipo</TableHead>
                  <TableHead className="text-xs font-semibold">Valor</TableHead>
                  <TableHead className="text-xs font-semibold">Usos</TableHead>
                  <TableHead className="text-xs font-semibold">Validade</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.paginatedData.length > 0 ? table.paginatedData.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium">{String(c.codigo)}</TableCell>
                    <TableCell className="text-sm">{String(c.tipo)}</TableCell>
                    <TableCell className="text-sm">{String(c.valor)}</TableCell>
                    <TableCell className="text-sm">{String(c.usos)}</TableCell>
                    <TableCell className="text-sm">{String(c.validade)}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{String(c.status)}</Badge></TableCell>
                    <TableCell className="text-right"><Trash2 size={14} className="text-destructive" /></TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-sm">
                      Nenhum cupom cadastrado.
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

export default CuponsListar;
