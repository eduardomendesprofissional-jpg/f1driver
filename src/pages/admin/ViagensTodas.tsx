import { PlusSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const ViagensTodas = () => {
  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="p-5 pb-0">
            <h2 className="text-lg font-bold text-primary">Corridas</h2>
            <p className="text-sm text-muted-foreground">Acompanhe e obtenha mais detalhes de suas corridas.</p>
          </div>

          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary">Print</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary">CSV</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary">PDF</Button>
            </div>
            <Input placeholder="Procurar" className="w-40 h-8 text-xs bg-background border-border" />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">ID</TableHead>
                  <TableHead className="text-xs font-semibold">Motorista</TableHead>
                  <TableHead className="text-xs font-semibold">Passageiro</TableHead>
                  <TableHead className="text-xs font-semibold">Status da Corrida</TableHead>
                  <TableHead className="text-xs font-semibold">Valor da Corrida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Sample data rows */}
                {[
                  { id: "802658000", motorista: "Antonio luiz colaço lira", passageiro: "Antônio Luiz colaço lira", status: "Finalizada", valor: "R$ 10.99" },
                  { id: "659294000", motorista: "Antonio luiz colaço lira", passageiro: "Antônio Luiz colaço lira", status: "Cancelada pelo passageiro", valor: "R$ 9.99" },
                  { id: "638961000", motorista: "Antonio luiz colaço lira", passageiro: "Antônio Luiz colaço lira", status: "Finalizada", valor: "R$ 170.7" },
                  { id: "638254000", motorista: "Antonio luiz colaço lira", passageiro: "Antônio Luiz colaço lira", status: "Finalizada", valor: "R$ 32.66" },
                  { id: "632795000", motorista: "Antonio luiz colaço lira", passageiro: "Antônio Luiz colaço lira", status: "Finalizada", valor: "R$ 97.95" },
                ].map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5">
                        <PlusSquare size={14} className="text-primary" />
                        {row.id}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{row.motorista}</TableCell>
                    <TableCell className="text-sm">{row.passageiro}</TableCell>
                    <TableCell className="text-sm">
                      {row.status === "Finalizada" ? (
                        row.status
                      ) : (
                        <div>
                          <span>{row.status}</span>
                          <p className="text-xs text-muted-foreground">- Motivo: NÃO ESPECIFICADO</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{row.valor}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-muted-foreground">
            <span>1-10 de 11 registros</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="text-xs h-8" disabled>Previous</Button>
              <Button size="sm" className="text-xs h-8 bg-primary text-primary-foreground">1</Button>
              <Button variant="outline" size="sm" className="text-xs h-8">2</Button>
              <Button variant="outline" size="sm" className="text-xs h-8">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViagensTodas;
