import { Tag, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CuponsCriar = () => {
  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Tag size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-primary">Criar Novo Cupom</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Código do Cupom</label>
              <Input placeholder="Ex: PROMO10" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Desconto</label>
              <Select defaultValue="percentual">
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentual">Percentual (%)</SelectItem>
                  <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Valor do Desconto</label>
              <Input placeholder="Ex: 10" type="number" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Limite de Usos</label>
              <Input placeholder="Ex: 100" type="number" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data de Início</label>
              <Input type="date" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data de Expiração</label>
              <Input type="date" className="bg-background border-border" />
            </div>
          </div>

          <Button className="w-full h-11 gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
            <Plus size={16} />
            Criar Cupom
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CuponsCriar;
