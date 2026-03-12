import { Car } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";

const statusCards = [
  { label: "INDO AO PASSAGEIRO", value: 0, color: "border-b-4 border-b-amber-400" },
  { label: "AGUARDANDO EMBARQUE", value: 0, color: "border-b-4 border-b-emerald-500" },
  { label: "EM ROTA (VIAJANDO)", value: 0, color: "border-b-4 border-b-sky-500" },
];

const ViagensAndamento = () => {
  const [perPage, setPerPage] = useState("10");

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statusCards.map((card) => (
          <Card key={card.label} className={`bg-card border-border ${card.color}`}>
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Corridas em Andamento */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="p-5 pb-0">
            <div className="flex items-center gap-2">
              <Car size={20} className="text-primary" />
              <div>
                <h2 className="text-lg font-bold text-primary">Corridas em Andamento</h2>
                <p className="text-xs text-muted-foreground">Acompanhe as corridas em andamento</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Show</span>
              <Select value={perPage} onValueChange={setPerPage}>
                <SelectTrigger className="w-20 h-8 bg-background border-border text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>
            <Input placeholder="Buscar..." className="w-40 h-8 text-xs bg-background border-border" />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Status Atual</TableHead>
                  <TableHead className="text-xs font-semibold">Motorista</TableHead>
                  <TableHead className="text-xs font-semibold">Passageiro</TableHead>
                  <TableHead className="text-xs font-semibold">Origem (Partida)</TableHead>
                  <TableHead className="text-xs font-semibold">Destino</TableHead>
                  <TableHead className="text-xs font-semibold">Valor Est.</TableHead>
                  <TableHead className="text-xs font-semibold">Opções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-sm">
                    Nenhum dado recente encontrado.
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
    </div>
  );
};

export default ViagensAndamento;
