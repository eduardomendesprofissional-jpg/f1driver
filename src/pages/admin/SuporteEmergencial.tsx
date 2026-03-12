import { Shield, Phone, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { useTable } from "@/hooks/use-table";

const SuporteEmergencial = () => {
  const [chamados] = useState<Record<string, unknown>[]>([]);
  const table = useTable({ data: chamados, searchKeys: ["usuario", "descricao", "tipo"] });

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 p-5 text-white">
        <div className="flex items-center gap-2">
          <Shield size={22} />
          <div>
            <h1 className="text-lg font-bold">Suporte Emergencial</h1>
            <p className="text-xs text-white/80">Gerencie chamados de emergência de motoristas e passageiros.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border border-l-4 border-l-rose-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chamados Abertos</p>
              <p className="text-2xl font-bold text-foreground">0</p>
            </div>
            <AlertTriangle size={28} className="text-rose-500/30" />
          </CardContent>
        </Card>
        <Card className="bg-card border-border border-l-4 border-l-emerald-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resolvidos Hoje</p>
              <p className="text-2xl font-bold text-foreground">0</p>
            </div>
            <Phone size={28} className="text-emerald-500/30" />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Últimos Chamados</h3>
            <Input placeholder="Buscar..." value={table.search} onChange={(e) => table.setSearch(e.target.value)} className="w-40 h-8 text-xs bg-background border-border" />
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold">ID</TableHead>
                <TableHead className="text-xs font-semibold">Tipo</TableHead>
                <TableHead className="text-xs font-semibold">Usuário</TableHead>
                <TableHead className="text-xs font-semibold">Descrição</TableHead>
                <TableHead className="text-xs font-semibold">Data/Hora</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.paginatedData.length > 0 ? table.paginatedData.map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{String(c.id)}</TableCell>
                  <TableCell className="text-sm">{String(c.tipo)}</TableCell>
                  <TableCell className="text-sm">{String(c.usuario)}</TableCell>
                  <TableCell className="text-sm">{String(c.descricao)}</TableCell>
                  <TableCell className="text-sm">{String(c.dataHora)}</TableCell>
                  <TableCell className="text-sm">{String(c.status)}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8 text-sm">Nenhum chamado registrado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuporteEmergencial;
