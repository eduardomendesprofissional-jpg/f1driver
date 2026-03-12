import { Settings, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ConfigurarApp = () => {
  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Settings size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-primary">Configurar Aplicativo</h2>
          </div>
          <p className="text-sm text-muted-foreground">Ajuste as configurações gerais do seu aplicativo.</p>
        </CardContent>
      </Card>

      {/* Informações Gerais */}
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Informações Gerais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nome do Aplicativo</label>
              <Input defaultValue="F1 Driver" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Telefone de Suporte</label>
              <Input placeholder="(00) 00000-0000" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">E-mail de Contato</label>
              <Input placeholder="contato@f1driver.com" type="email" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Moeda</label>
              <Select defaultValue="brl">
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brl">Real (BRL)</SelectItem>
                  <SelectItem value="usd">Dólar (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Corrida */}
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Configurações de Corrida</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Raio de Busca (km)</label>
              <Input type="number" defaultValue="10" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tempo Máximo de Espera (min)</label>
              <Input type="number" defaultValue="5" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Taxa da Plataforma (%)</label>
              <Input type="number" defaultValue="15" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Valor Mínimo da Corrida (R$)</label>
              <Input type="number" defaultValue="5.00" className="bg-background border-border" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades */}
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Funcionalidades</h3>
          <div className="space-y-3">
            {[
              { label: "Pagamento por Cartão", desc: "Permitir pagamentos via cartão de crédito/débito" },
              { label: "Pagamento por PIX", desc: "Habilitar pagamento via PIX" },
              { label: "Corrida Agendada", desc: "Permitir que passageiros agendem corridas" },
              { label: "Chat no App", desc: "Habilitar chat entre motorista e passageiro" },
              { label: "Avaliação Obrigatória", desc: "Exigir avaliação após cada corrida" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 h-11">
          <Save size={16} />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default ConfigurarApp;
