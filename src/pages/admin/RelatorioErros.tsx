import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useTable } from "@/hooks/use-table";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const RelatorioErros = () => {
  const [erros] = useState<Record<string, unknown>[]>([]);
  const table = useTable({ data: erros, searchKeys: ["passageiro", "categoria", "erro"] });

  return (
    <div className="space-y-6">
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-5 space-y-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <AlertTriangle size={20} className="text-rose-400" />
          Relatório de Erros
        </h2>
        <p className="text-sm text-muted-foreground">
          Erros e falhas detectadas no sistema.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground">Relatório de falhas recentes</h3>
        <p className="text-sm text-muted-foreground">Abaixo estão listadas as tentativas falhas. Use isso para saber onde está faltando preço.</p>

        <div className="flex justify-end">
          <Input placeholder="Buscar..." value={table.search} onChange={(e) => table.setSearch(e.target.value)} className="w-40 h-8 text-xs bg-background border-border" />
        </div>

        {table.paginatedData.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold">Passageiro</TableHead>
                <TableHead className="text-xs font-semibold">Categoria</TableHead>
                <TableHead className="text-xs font-semibold">Erro</TableHead>
                <TableHead className="text-xs font-semibold">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.paginatedData.map((e, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{String(e.passageiro)}</TableCell>
                  <TableCell className="text-sm">{String(e.categoria)}</TableCell>
                  <TableCell className="text-sm">{String(e.erro)}</TableCell>
                  <TableCell className="text-sm">{String(e.data)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma falha registrada.</p>
        )}
      </div>
    </div>
  );
};

export default RelatorioErros;
