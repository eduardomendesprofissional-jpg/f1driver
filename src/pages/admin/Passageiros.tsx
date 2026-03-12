import { Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const passageirosData = [
  { id: "35630", cadastro: "07/03/26 11:33", nome: "Eduardomendesprofissional@gmail.com", email: "Eduardomendesprofissional@gmail.com", status: "ATIVO" },
  { id: "18222", cadastro: "03/02/26 10:45", nome: "Antônio Luiz colaço lira", email: "antoniodoegito22020@gmail.com", status: "ATIVO" },
];

const Passageiros = () => {
  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="p-5 pb-0">
            <h2 className="text-lg font-bold text-primary">Passageiros Registrados</h2>
            <p className="text-sm text-muted-foreground">Gerencie as informações e status de acesso dos passageiros da plataforma.</p>
          </div>

          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary">CSV</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary">PDF</Button>
              <Button variant="outline" size="sm" className="text-xs text-primary border-primary">Print</Button>
            </div>
            <Input placeholder="Buscar..." className="w-40 h-8 text-xs bg-background border-border" />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">ID</TableHead>
                  <TableHead className="text-xs font-semibold">Cadastro</TableHead>
                  <TableHead className="text-xs font-semibold">Nome</TableHead>
                  <TableHead className="text-xs font-semibold">E-mail</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passageirosData.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">{p.id}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.cadastro}</TableCell>
                    <TableCell className="text-sm font-medium">{p.nome}</TableCell>
                    <TableCell className="text-sm">{p.email}</TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-500 text-white text-xs">{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="text-xs text-primary border-primary gap-1">
                        <Settings size={12} /> Gerenciar
                      </Button>
                    </TableCell>
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

export default Passageiros;
