import { AlertTriangle, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const errosData = [
  { cidade: "São José da Coroa Grande", km: "13.93", categoria: "Carro", horario: "15:28:05", dia: "Sexta" },
  { cidade: "Barreiros", km: "12.1", categoria: "Carro", horario: "12:39:50", dia: "Sábado" },
  { cidade: "São José da Coroa Grande", km: "87.95", categoria: "Carro", horario: "08:38:24", dia: "Quinta" },
];

const RelatorioErros = () => {
  return (
    <div className="space-y-6">
      {/* Alerta Principal */}
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-5 space-y-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <AlertTriangle size={20} className="text-rose-400" />
          Atenção: Passageiros não conseguem pedir corridas!
        </h2>
        <p className="text-sm text-muted-foreground">
          Detectamos que alguns passageiros tentaram solicitar veículos, mas o aplicativo não conseguiu calcular o preço. Isso acontece quando a sua <strong className="text-foreground">Tabela de Preços</strong> está incompleta.
        </p>
        <hr className="border-rose-500/20" />
        <p className="text-sm text-rose-400">
          <strong>Como corrigir?</strong> Você precisa garantir que todas as categorias (Ex: Comum, Luxo, Moto) tenham preços definidos para <strong>todos os horários (00:00 às 23:59)</strong> e para qualquer distância.
        </p>
      </div>

      <div className="flex justify-end">
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6">
          <Edit size={16} />
          Editar Tabela de Preços Agora
        </Button>
      </div>

      {/* Relatório de Falhas */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground">Relatório de falhas recentes</h3>
        <p className="text-sm text-muted-foreground">Abaixo estão listadas as tentativas falhas. Use isso para saber onde está faltando preço.</p>

        {errosData.map((erro, i) => (
          <Card key={i} className="bg-card border-border border-l-4 border-l-rose-500">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-rose-400">Falha ao calcular rota em: {erro.cidade}</p>
                <p className="text-sm text-muted-foreground">
                  O passageiro tentou andar <strong className="text-foreground">{erro.km} KM</strong> na categoria <strong className="text-foreground">{erro.categoria}</strong>.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  🕐 Horário: {erro.horario} | 📅 Dia: {erro.dia}
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-xs text-rose-400 border-rose-400 hover:bg-rose-500/10">
                Corrigir Regra
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RelatorioErros;
