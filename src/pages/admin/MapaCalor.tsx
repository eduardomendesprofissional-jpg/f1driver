import { MapPin, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import MapboxMap from "@/components/MapboxMap";

const MapaCalor = () => {
  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-primary">Mapa de Calor</h2>
          </div>
          <p className="text-sm text-muted-foreground">Visualize as regiões com maior demanda de corridas.</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-center gap-2 mb-4">
            <Info size={16} className="text-primary" />
            <p className="text-sm text-muted-foreground">O mapa de calor será atualizado com base nos dados de corridas realizadas.</p>
          </div>
          <MapboxMap className="w-full h-[500px] rounded-lg overflow-hidden" />
        </CardContent>
      </Card>
    </div>
  );
};

export default MapaCalor;
