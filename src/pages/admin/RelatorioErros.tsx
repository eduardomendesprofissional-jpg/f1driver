import { AlertTriangle, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma falha registrada.</p>
      </div>
    </div>
  );
};

export default RelatorioErros;
