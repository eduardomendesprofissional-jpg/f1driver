import { MapPin, Car, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import carIcon from "@/assets/car-3d.png";

const cidades = [
  "Agrestina - PE", "Água Preta - PE", "Altinho - PE", "Barreiros - PE",
  "Bonito - PE", "Camocim de São Félix - PE", "Catende - PE", "Cupira - PE",
  "Jaqueira - PE", "Maragogi - AL", "Palmares - PE", "Panelas - PE",
  "Porto Calvo - AL", "Ribeirão - PE", "São Caetano - PE",
  "São José da Coroa Grande - PE", "Tamandaré - PE",
];

const Precificacao = () => {
  const [cidade, setCidade] = useState(cidades[0]);

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-lg font-bold text-primary">Preços e Veículos</h2>
              <p className="text-sm text-muted-foreground">Gerencie as categorias para: <strong className="text-foreground">{cidade}</strong></p>
            </div>
            <Select value={cidade} onValueChange={setCidade}>
              <SelectTrigger className="w-56 bg-background border-border gap-1">
                <MapPin size={14} className="text-primary" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cidades.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-3 mt-4 flex items-center gap-2">
            <Info size={14} className="text-sky-400" />
            <p className="text-xs text-sky-300"><strong>Dica:</strong> Agora você pode modificar os ícones das categorias. Contate o suporte.</p>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border hover:border-primary/50 cursor-pointer transition-colors">
              <CardContent className="p-4 text-center">
                <img src={carIcon} alt="Carro" className="w-16 h-16 mx-auto mb-2 object-contain" />
                <p className="text-sm font-bold text-primary">Carro</p>
                <p className="text-xs text-muted-foreground">Clique para editar</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Precificacao;
