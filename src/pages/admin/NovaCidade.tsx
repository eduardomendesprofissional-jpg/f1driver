import { MapPin, Plus, Trash2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";

const NovaCidade = () => {
  const [cidades] = useState<{ nome: string; uf: string }[]>([]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 p-5 text-white">
        <div className="flex items-center gap-2">
          <MapPin size={22} />
          <div>
            <h1 className="text-lg font-bold">Área de Cobertura</h1>
            <p className="text-xs text-white/80">Cadastre as cidades onde o aplicativo irá operar.</p>
          </div>
        </div>
      </div>

      {/* Buscar Nova Cidade */}
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <p className="text-sm font-medium text-foreground mb-3">Buscar Nova Cidade</p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
              <Input placeholder="Digite o nome da cidade..." className="pl-10 bg-background border-border" />
            </div>
            <Button className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8">
              <Plus size={16} />
              ADICIONAR
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cidades Cadastradas */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="px-5 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Cidades Cadastradas</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold">Cidade</TableHead>
                <TableHead className="text-xs font-semibold">Estado (UF)</TableHead>
                <TableHead className="text-xs font-semibold text-center">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cidades.length > 0 ? cidades.map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm font-medium">{c.nome}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{c.uf}</Badge></TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-500 hover:bg-rose-500/10">
                      <Trash2 size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-sm">
                    Nenhuma cidade cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default NovaCidade;
