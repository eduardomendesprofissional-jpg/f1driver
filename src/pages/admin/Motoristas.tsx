import { Trophy, Search, User, MoreVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Motoristas = () => {
  return (
    <div className="space-y-6">
      {/* Top 5 Performance */}
      <div className="rounded-xl bg-gradient-to-r from-slate-800 to-slate-700 p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <button className="flex items-center gap-2 text-lg font-bold">
            <Trophy size={22} />
            Top 5 Performance
          </button>
          <div className="flex items-center gap-2">
            <Input type="date" className="h-8 text-xs bg-white/10 border-white/20 text-white w-36" />
            <Input type="date" className="h-8 text-xs bg-white/10 border-white/20 text-white w-36" />
            <Button size="sm" variant="outline" className="text-xs border-white/30 text-white hover:bg-white/10 gap-1">
              <Search size={14} /> Filtrar
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-white/20 hover:bg-transparent">
              <TableHead className="text-white/70 text-xs">POS.</TableHead>
              <TableHead className="text-white/70 text-xs">MOTORISTA</TableHead>
              <TableHead className="text-blue-300 text-xs text-center">FINALIZADAS (1)</TableHead>
              <TableHead className="text-yellow-300 text-xs text-center">CANC. MOTORISTA (D)</TableHead>
              <TableHead className="text-rose-300 text-xs text-center">CANC. PASSAGEIRO (P)</TableHead>
              <TableHead className="text-white/70 text-xs text-right">APROV.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableCell colSpan={6} className="text-center text-white/50 py-8 text-sm">
                Nenhum dado disponível.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Listagem de Motoristas */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary gap-1">📋 CSV</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary gap-1">📄 PDF</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary gap-1">🖨 Imprimir</Button>
            </div>
            <Input placeholder="Pesquisar motorista..." className="w-48 h-8 text-xs bg-background border-border" />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="text-xs font-semibold">ID</TableHead>
                  <TableHead className="text-xs font-semibold">Motorista</TableHead>
                  <TableHead className="text-xs font-semibold">E-mail / Status</TableHead>
                  <TableHead className="text-xs font-semibold">Categorias</TableHead>
                  <TableHead className="text-xs font-semibold">Veículo</TableHead>
                  <TableHead className="text-xs font-semibold">Placa</TableHead>
                  <TableHead className="text-xs font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8 text-sm">
                    Nenhum motorista cadastrado.
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

export default Motoristas;
