import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

const RelatorioEstabelecimentos = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="p-5 pb-0">
            <h2 className="text-lg font-bold text-primary">Relatório de 01/03 00h00 até 12/03 23h59</h2>
            <p className="text-sm text-muted-foreground">Veja o seu relatório</p>
          </div>

          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary">Copy</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary">CSV</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary">PDF</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary">Print</Button>
            </div>
            <Input placeholder="Procurar" className="w-40 h-8 text-xs bg-background border-border" />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">#</TableHead>
                  <TableHead className="text-xs font-semibold">Estabelecimento</TableHead>
                  <TableHead className="text-xs font-semibold">Distância Percorrida (KM)</TableHead>
                  <TableHead className="text-xs font-semibold">Tempo de Viagens (Minutos)</TableHead>
                  <TableHead className="text-xs font-semibold">Total de Entregas</TableHead>
                  <TableHead className="text-xs font-semibold">Viagens no Dinheiro/ Maquininha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6 text-sm">
                    No data available in table
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-muted-foreground">
            <span>Showing 0 to 0 of 0 entries</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="text-xs h-8" disabled>Previous</Button>
              <Button variant="outline" size="sm" className="text-xs h-8" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Filtro */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-lg">Insira o Intervalo de datas para filtragem do relatório dos estabelecimentos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input type="date" placeholder="De" className="bg-background border-border" />
            <Input type="date" placeholder="Até" className="bg-background border-border" />
            <Button onClick={() => setOpen(false)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              Pesquisar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RelatorioEstabelecimentos;
