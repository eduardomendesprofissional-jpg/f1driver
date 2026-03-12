import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const WhatsClientes = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <Users size={24} />
          <div>
            <h1 className="text-lg font-bold">Meus Clientes</h1>
            <p className="text-xs text-white/80">Gerencie os usuários vinculados ao seu WhatsApp</p>
          </div>
        </div>
        <span className="bg-white text-rose-500 text-sm font-bold px-3 py-1 rounded-full">0 Total</span>
      </div>

      {/* Tabela */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs">Exportar CSV</Button>
              <Button variant="outline" size="sm" className="text-xs">Imprimir</Button>
            </div>
            <Input placeholder="Buscar..." className="w-40 h-8 text-xs bg-background border-border" />
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
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
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

export default WhatsClientes;
