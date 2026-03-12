import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useTable } from "@/hooks/use-table";
import { exportToCSV, exportToPDF, printTable, copyToClipboard } from "@/lib/table-utils";
import { toast } from "sonner";

const headers = [
  { key: "id", label: "#" },
  { key: "estabelecimento", label: "Estabelecimento" },
  { key: "distancia", label: "Distância Percorrida (KM)" },
  { key: "tempo", label: "Tempo de Viagens (Minutos)" },
  { key: "entregas", label: "Total de Entregas" },
  { key: "dinheiro", label: "Viagens no Dinheiro/ Maquininha" },
];

const RelatorioEstabelecimentos = () => {
  const [open, setOpen] = useState(true);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [dados] = useState<Record<string, unknown>[]>([]);
  const table = useTable({ data: dados, searchKeys: ["estabelecimento"] });

  const handlePesquisar = () => {
    if (!dateStart || !dateEnd) {
      toast.error("Selecione as datas de início e fim.");
      return;
    }
    setOpen(false);
    toast.success("Relatório filtrado com sucesso.");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="p-5 pb-0">
            <h2 className="text-lg font-bold text-primary">Relatório de Estabelecimentos</h2>
            <p className="text-sm text-muted-foreground">Veja o seu relatório</p>
          </div>

          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary" onClick={() => copyToClipboard(dados, headers)}>Copy</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary" onClick={() => exportToCSV(dados, headers, "relatorio-estabelecimentos")}>CSV</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary" onClick={() => exportToPDF(dados, headers, "Relatório de Estabelecimentos")}>PDF</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary" onClick={() => printTable(dados, headers, "Relatório de Estabelecimentos")}>Print</Button>
            </div>
            <Input placeholder="Procurar" value={table.search} onChange={(e) => table.setSearch(e.target.value)} className="w-40 h-8 text-xs bg-background border-border" />
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
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6 text-sm">Nenhum dado disponível</TableCell>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">Insira o Intervalo de datas para filtragem do relatório dos estabelecimentos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="bg-background border-border" />
            <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="bg-background border-border" />
            <Button onClick={handlePesquisar} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              Pesquisar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RelatorioEstabelecimentos;
