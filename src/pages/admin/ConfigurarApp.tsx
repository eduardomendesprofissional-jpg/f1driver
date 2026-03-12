import { Settings, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

const ConfigurarApp = () => {
  const [porcentagem, setPorcentagem] = useState("0");
  const [saving, setSaving] = useState(false);

  const handleSalvar = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Configurações salvas com sucesso!");
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Lucros */}
      <Card className="bg-card border-border relative">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-primary">Lucros</h2>
              <p className="text-sm text-muted-foreground">Configure os ganhos por Viagem</p>
              <p className="text-xs text-muted-foreground mt-0.5">* As informações inseridas abaixo irão refletir no relatório</p>
            </div>
            <Button onClick={handleSalvar} disabled={saving} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 h-10">
              <Save size={16} />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>

          <div className="grid grid-cols-[280px_1fr] items-center gap-y-4 mt-2">
            <label className="text-sm text-foreground">Porcentagem por Corrida</label>
            <Input value={porcentagem} onChange={(e) => setPorcentagem(e.target.value)} className="bg-background border-border" />
          </div>
        </CardContent>
      </Card>

      {/* Restrições */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-primary">Restrições</h2>
            <p className="text-sm text-muted-foreground">Bloqueie ferramentas e informações</p>
            <p className="text-xs text-muted-foreground mt-0.5">* Após alterado, os motoristas deverão ser notificados para reiniciar o aplicativo e surta os efeitos</p>
          </div>

          <div className="grid grid-cols-[280px_1fr] items-center gap-y-4">
            <label className="text-sm text-foreground">
              Ocultar o <strong>destino</strong> da corrida na tela de nova chamada?
            </label>
            <Select defaultValue="ocultar" onValueChange={() => toast.info("Preferência atualizada.")}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ocultar">Ocultar</SelectItem>
                <SelectItem value="mostrar">Mostrar</SelectItem>
              </SelectContent>
            </Select>

            <label className="text-sm text-foreground">
              Ocultar o <strong>telefone do passageiro</strong> para o motorista?
            </label>
            <Select defaultValue="nao-ocultar" onValueChange={() => toast.info("Preferência atualizada.")}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ocultar">Ocultar</SelectItem>
                <SelectItem value="nao-ocultar">Não ocultar</SelectItem>
              </SelectContent>
            </Select>

            <label className="text-sm text-foreground">
              Mostrar <strong>Tarifa Estimada</strong> para o motorista?
            </label>
            <Select defaultValue="mostrar" onValueChange={() => toast.info("Preferência atualizada.")}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mostrar">Mostrar</SelectItem>
                <SelectItem value="ocultar">Ocultar</SelectItem>
              </SelectContent>
            </Select>

            <label className="text-sm text-foreground">
              Permitir que o motorista <strong>cancele</strong> corridas?
            </label>
            <Select defaultValue="permitir" onValueChange={() => toast.info("Preferência atualizada.")}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="permitir">Permitir</SelectItem>
                <SelectItem value="nao-permitir">Não permitir</SelectItem>
              </SelectContent>
            </Select>

            <label className="text-sm text-foreground">
              Permitir passageiro <strong>ver o número de telefone</strong> do motorista?
            </label>
            <Select defaultValue="nao-permitir" onValueChange={() => toast.info("Preferência atualizada.")}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="permitir">Permitir</SelectItem>
                <SelectItem value="nao-permitir">Não permitir</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Central */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-primary">Central</h2>
            <p className="text-sm text-muted-foreground">Configure os meios de contato da sua empresa</p>
            <p className="text-xs text-muted-foreground mt-0.5">* As informações inseridas abaixo refletirão no aplicativo motorista e passageiro</p>
          </div>

          <div className="grid grid-cols-[280px_1fr] items-center gap-y-4">
            <label className="text-sm text-foreground">Valor mínimo para gerar desconto</label>
            <Input className="bg-background border-border" />
            <label className="text-sm text-foreground">Valor (%) - Cashback do <strong>indicado do passageiro</strong></label>
            <Input className="bg-background border-border" />
            <label className="text-sm text-foreground">Valor (R$) - Indicação Motorista</label>
            <Input className="bg-background border-border" />
            <label className="text-sm text-foreground">Valor (R$) - Indicação Passageiro</label>
            <Input className="bg-background border-border" />
            <label className="text-sm text-foreground">Valor (%) - Cashback do <strong>passageiro</strong></label>
            <Input className="bg-background border-border" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfigurarApp;
