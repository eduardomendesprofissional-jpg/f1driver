import { Trophy, Search, User, MoreVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const driversData = [
  { id: "#3798", name: "Antonio luiz colaço lira", phone: "81981986978", email: "antonio@irlogo.com", status: "Ativo", categoria: "Carro", veiculo: "S10 branca", placa: "Qsi4i27" },
  { id: "#3780", name: "Antônio Luiz colaço", phone: "81981986978", email: "antoniodoegito19@gmail.com", status: "Ativo", categoria: "Carro", veiculo: "S10", placa: "Qsi4i27" },
];

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
            <Input type="date" defaultValue="2026-03-01" className="h-8 text-xs bg-white/10 border-white/20 text-white w-36" />
            <Input type="date" defaultValue="2026-03-12" className="h-8 text-xs bg-white/10 border-white/20 text-white w-36" />
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
              <TableCell className="text-white">
                <Trophy size={16} className="text-yellow-400" />
              </TableCell>
              <TableCell className="text-white text-sm">Antonio luiz colaço lira</TableCell>
              <TableCell className="text-center">
                <Badge className="bg-emerald-500 text-white">1</Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="border-yellow-400 text-yellow-400">0</Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="border-rose-400 text-rose-400">0</Badge>
              </TableCell>
              <TableCell className="text-right text-emerald-400 font-bold">100%</TableCell>
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
                {driversData.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell><input type="checkbox" className="rounded border-border" /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <User size={14} className="text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs">{d.email}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs text-emerald-500">{d.status}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{d.categoria}</Badge></TableCell>
                    <TableCell className="text-sm">{d.veiculo}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{d.placa}</Badge></TableCell>
                    <TableCell><Button variant="ghost" size="sm"><MoreVertical size={14} /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-muted-foreground">
            <span>Mostrando de 1 até 2 de 2 registros</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="text-xs h-8" disabled>Anterior</Button>
              <Button size="sm" className="text-xs h-8 bg-primary text-primary-foreground">1</Button>
              <Button variant="outline" size="sm" className="text-xs h-8" disabled>Próximo</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Motoristas;
