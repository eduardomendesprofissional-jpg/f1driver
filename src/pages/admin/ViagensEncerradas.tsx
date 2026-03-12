import { Trophy, Filter, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";

const ViagensEncerradas = () => {
  const [status, setStatus] = useState("todos");
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Top 5 Performance */}
      <div className="rounded-xl bg-gradient-to-r from-sky-600 to-blue-500 p-5 text-white">
        <button className="flex items-center gap-2 text-lg font-bold">
          <Trophy size={22} />
          Top 5 Performance (Filtro Atual)
          <ChevronDown size={18} />
        </button>
        <p className="text-xs text-white/70 text-right -mt-5">Baseado nas datas selecionadas abaixo</p>

        <div className="mt-4 bg-white/10 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/20 hover:bg-transparent">
                <TableHead className="text-white/80 text-xs font-semibold">POS.</TableHead>
                <TableHead className="text-white/80 text-xs font-semibold">MOTORISTA</TableHead>
                <TableHead className="text-primary-foreground text-xs font-semibold text-center text-blue-200">FINALIZADAS</TableHead>
                <TableHead className="text-yellow-300 text-xs font-semibold text-center">CANC. MOT.</TableHead>
                <TableHead className="text-rose-300 text-xs font-semibold text-center">CANC. PASS.</TableHead>
                <TableHead className="text-white/80 text-xs font-semibold text-right">EFICIÊNCIA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableCell colSpan={6} className="text-center text-white/60 py-6 text-sm">
                  Sem dados para o período selecionado.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Filtros de Pesquisa */}
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <h2 className="text-lg font-bold text-primary mb-4">Filtros de Pesquisa</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">Data Início</label>
              <Input type="date" defaultValue={today} className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">Data Fim</label>
              <Input type="date" defaultValue={today} className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">Cidade</label>
              <Input placeholder="Ex: São Paulo" className="bg-background border-border" />
            </div>
            <Button className="h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground col-span-2 md:col-span-1">
              <Filter size={16} />
              Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Listagem Detalhada */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="p-5 pb-0">
            <h2 className="text-lg font-bold text-primary mb-3">Listagem Detalhada</h2>
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
                  <TableHead className="text-xs font-semibold">STATUS</TableHead>
                  <TableHead className="text-xs font-semibold">MOTORISTA</TableHead>
                  <TableHead className="text-xs font-semibold">PASSAGEIRO</TableHead>
                  <TableHead className="text-xs font-semibold">VALOR</TableHead>
                  <TableHead className="text-xs font-semibold">ORIGEM</TableHead>
                  <TableHead className="text-xs font-semibold">DESTINO</TableHead>
                  <TableHead className="text-xs font-semibold">DATA/HORA</TableHead>
                  <TableHead className="text-xs font-semibold">PAGAMENTO</TableHead>
                  <TableHead className="text-xs font-semibold">AÇÃO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8 text-sm">
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

export default ViagensEncerradas;
