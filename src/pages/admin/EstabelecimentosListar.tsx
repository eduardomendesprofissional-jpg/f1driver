import { Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { useTable } from "@/hooks/use-table";
import { exportToCSV, exportToPDF, printTable } from "@/lib/table-utils";

const headers = [
  { key: "id", label: "ID" },
  { key: "nome", label: "Nome" },
  { key: "endereco", label: "Endereço" },
  { key: "telefone", label: "Telefone" },
  { key: "status", label: "Status" },
];

const EstabelecimentosListar = () => {
  const [estabelecimentos] = useState<Record<string, unknown>[]>([]);
  const table = useTable({ data: estabelecimentos, searchKeys: ["nome", "endereco", "telefone"] });

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="p-5 pb-0 flex items-center gap-2">
            <Store size={20} className="text-primary" />
            <div>
              <h2 className="text-lg font-bold text-primary">Estabelecimentos</h2>
              <p className="text-sm text-muted-foreground">Gerencie os estabelecimentos cadastrados na plataforma.</p>
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary" onClick={() => exportToCSV(estabelecimentos, headers, "estabelecimentos")}>CSV</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary" onClick={() => exportToPDF(estabelecimentos, headers, "Estabelecimentos")}>PDF</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary" onClick={() => printTable(estabelecimentos, headers, "Estabelecimentos")}>Print</Button>
            </div>
            <Input placeholder="Buscar..." value={table.search} onChange={(e) => table.setSearch(e.target.value)} className="w-44 h-8 text-xs bg-background border-border" />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">ID</TableHead>
                  <TableHead className="text-xs font-semibold">Nome</TableHead>
                  <TableHead className="text-xs font-semibold">Endereço</TableHead>
                  <TableHead className="text-xs font-semibold">Telefone</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.paginatedData.length > 0 ? table.paginatedData.map((e, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{String(e.id)}</TableCell>
                    <TableCell className="text-sm">{String(e.nome)}</TableCell>
                    <TableCell className="text-sm">{String(e.endereco)}</TableCell>
                    <TableCell className="text-sm">{String(e.telefone)}</TableCell>
                    <TableCell className="text-sm">{String(e.status)}</TableCell>
                    <TableCell className="text-right text-sm">—</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                      Nenhum estabelecimento cadastrado.
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

export default EstabelecimentosListar;
