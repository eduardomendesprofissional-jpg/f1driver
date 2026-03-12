import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { useTable } from "@/hooks/use-table";
import { exportToCSV, printTable } from "@/lib/table-utils";

const headers = [
  { key: "status", label: "Status" },
  { key: "nome", label: "Nome do Cliente" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "categoria", label: "Categoria Padrão" },
];

const WhatsClientes = () => {
  const [clientes] = useState<Record<string, unknown>[]>([]);
  const table = useTable({ data: clientes, searchKeys: ["nome", "whatsapp"] });

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <Users size={24} />
          <div>
            <h1 className="text-lg font-bold">Meus Clientes</h1>
            <p className="text-xs text-white/80">Gerencie os usuários vinculados ao seu WhatsApp</p>
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
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Nome do Cliente</TableHead>
                  <TableHead className="text-xs font-semibold">WhatsApp</TableHead>
                  <TableHead className="text-xs font-semibold">Categoria Padrão</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.paginatedData.length > 0 ? table.paginatedData.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{String(c.status)}</TableCell>
                    <TableCell className="text-sm">{String(c.nome)}</TableCell>
                    <TableCell className="text-sm">{String(c.whatsapp)}</TableCell>
                    <TableCell className="text-sm">{String(c.categoria)}</TableCell>
                    <TableCell className="text-right text-sm">—</TableCell>
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
