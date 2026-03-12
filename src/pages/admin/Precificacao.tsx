import { MapPin, Car, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import carIcon from "@/assets/car-3d.png";

const Precificacao = () => {
  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-lg font-bold text-primary">Preços e Veículos</h2>
              <p className="text-sm text-muted-foreground">Gerencie as categorias de veículos e precificação.</p>
            </div>
          </div>

          <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-3 mt-4 flex items-center gap-2">
            <Info size={14} className="text-sky-400" />
            <p className="text-xs text-sky-300"><strong>Dica:</strong> Agora você pode modificar os ícones das categorias. Contate o suporte.</p>
          </div>

          <div className="mt-6">
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma categoria cadastrada. Adicione uma cidade primeiro.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Precificacao;
