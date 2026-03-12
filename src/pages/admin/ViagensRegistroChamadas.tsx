import { Filter, ChevronDown, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ViagensRegistroChamadas = () => {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Filtro de Período */}
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <h2 className="text-lg font-bold text-primary mb-4">Filtro de Período</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">Data Inicial</label>
              <Input type="date" defaultValue={today} className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">Data Final</label>
              <Input type="date" defaultValue={today} className="bg-background border-border" />
            </div>
            <Button className="h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Filter size={16} />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Funil de Aceitação */}
      <div className="rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 p-5 text-white">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2 text-lg font-bold">
            Funil de Aceitação (Top 10)
            <ChevronDown size={18} />
          </button>
          <span className="text-xs text-white/80">Quem mais recebe vs. aceita</span>
        </div>

        <div className="mt-4 bg-white rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 text-muted-foreground">
            <Info size={14} />
            <span className="text-sm">Análise de eficiência dos motoristas que mais recebem chamados em tela.</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-foreground">MOTORISTA</TableHead>
                <TableHead className="text-xs font-semibold text-foreground">RECEBEU EM TELA</TableHead>
                <TableHead className="text-xs font-semibold text-foreground">ACEITOU</TableHead>
                <TableHead className="text-xs font-semibold text-foreground">TAXA DE ACEITAÇÃO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-sm">
                  Nenhum dado encontrado para este período.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Log Detalhado de Disparos */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="p-5 pb-0">
            <h2 className="text-lg font-bold text-primary mb-3">Log Detalhado de Disparos</h2>
          </div>
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs">CSV</Button>
              <Button variant="outline" size="sm" className="text-xs">Print</Button>
            </div>
            <Input placeholder="Buscar..." className="w-40 h-8 text-xs bg-background border-border" />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">ID</TableHead>
                  <TableHead className="text-xs font-semibold">DATA/HORA</TableHead>
                  <TableHead className="text-xs font-semibold">STATUS</TableHead>
                  <TableHead className="text-xs font-semibold">MOTORISTA</TableHead>
                  <TableHead className="text-xs font-semibold">ID</TableHead>
                  <TableHead className="text-xs font-semibold">ORIGEM (LOG)</TableHead>
                  <TableHead className="text-xs font-semibold">DESTINO (LOG)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-sm">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-muted-foreground">
            <span>Mostrando 0 até 0 de 0 registros</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="text-xs h-8" disabled>Anterior</Button>
              <Button variant="outline" size="sm" className="text-xs h-8" disabled>Próximo</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViagensRegistroChamadas;
