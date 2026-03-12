import { Store, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const EstabelecimentosCadastrar = () => {
  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Store size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-primary">Cadastrar Estabelecimento</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome do Estabelecimento</label>
              <Input placeholder="Ex: Restaurante Sabor" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Telefone</label>
              <Input placeholder="(00) 00000-0000" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">E-mail</label>
              <Input placeholder="email@exemplo.com" type="email" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CNPJ</label>
              <Input placeholder="00.000.000/0000-00" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Endereço</label>
              <Input placeholder="Rua, número, bairro, cidade - UF" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Observações</label>
              <Textarea placeholder="Informações adicionais..." className="bg-background border-border min-h-[80px]" />
            </div>
          </div>

          <Button className="w-full h-11 gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
            <Plus size={16} />
            Cadastrar Estabelecimento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EstabelecimentosCadastrar;
