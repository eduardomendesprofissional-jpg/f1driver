import { Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { useTable } from "@/hooks/use-table";
import { exportToCSV, exportToPDF, printTable } from "@/lib/table-utils";

const headers = [
  { key: "id", label: "ID" },
  { key: "cadastro", label: "Cadastro" },
  { key: "nome", label: "Nome" },
  { key: "email", label: "E-mail" },
  { key: "status", label: "Status" },
];

const Passageiros = () => {
  const [passageiros] = useState<Record<string, unknown>[]>([]);
  const table = useTable({ data: passageiros, searchKeys: ["nome", "email"] });

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="p-5 pb-0">
            <h2 className="text-lg font-bold text-primary">Passageiros Registrados</h2>
            <p className="text-sm text-muted-foreground">Gerencie as informações e status de acesso dos passageiros da plataforma.</p>
          </div>

          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary" onClick={() => exportToCSV(passageiros, headers, "passageiros")}>CSV</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary" onClick={() => exportToPDF(passageiros, headers, "Passageiros")}>PDF</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary" onClick={() => printTable(passageiros, headers, "Passageiros")}>Print</Button>
            </div>
            <Input placeholder="Buscar..." value={table.search} onChange={(e) => table.setSearch(e.target.value)} className="w-40 h-8 text-xs bg-background border-border" />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">ID</TableHead>
                  <TableHead className="text-xs font-semibold">Cadastro</TableHead>
                  <TableHead className="text-xs font-semibold">Nome</TableHead>
                  <TableHead className="text-xs font-semibold">E-mail</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.paginatedData.length > 0 ? table.paginatedData.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{String(p.id)}</TableCell>
                    <TableCell className="text-sm">{String(p.cadastro)}</TableCell>
                    <TableCell className="text-sm">{String(p.nome)}</TableCell>
                    <TableCell className="text-sm">{String(p.email)}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{String(p.status)}</Badge></TableCell>
                    <TableCell><Settings size={14} className="text-muted-foreground" /></TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">
                      Nenhum passageiro registrado.
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

export default Passageiros;
