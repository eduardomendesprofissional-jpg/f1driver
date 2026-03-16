import { MapPin, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  permission: "prompt" | "denied" | "unsupported";
  loading: boolean;
  error: string | null;
  onRequest: () => void;
}

const LocationPermissionBanner = ({ permission, loading, error, onRequest }: Props) => {
  if (permission === "unsupported") {
    return (
      <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="bg-card border border-border rounded-2xl p-6 text-center max-w-sm space-y-3">
          <AlertTriangle size={32} className="mx-auto text-destructive" />
          <p className="text-sm text-foreground font-semibold">Navegador não suporta geolocalização</p>
          <p className="text-xs text-muted-foreground">Use um navegador moderno para acessar esta funcionalidade.</p>
        </div>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="bg-card border border-border rounded-2xl p-6 text-center max-w-sm space-y-3">
          <AlertTriangle size={32} className="mx-auto text-warning" />
          <p className="text-sm text-foreground font-semibold">Localização bloqueada</p>
          <p className="text-xs text-muted-foreground">
            {error || "Habilite a permissão de localização nas configurações do navegador e recarregue a página."}
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Recarregar página
          </Button>
        </div>
      </div>
    );
  }

  // prompt state
  return (
    <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-2xl p-6 text-center max-w-sm space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <MapPin size={28} className="text-primary" />
        </div>
        <p className="text-base text-foreground font-bold">Permitir acesso à localização</p>
        <p className="text-xs text-muted-foreground">
          Precisamos da sua localização para mostrar o mapa, calcular rotas e encontrar motoristas próximos.
        </p>
        <Button className="w-full h-11 font-bold" onClick={onRequest} disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <MapPin size={16} className="mr-2" />}
          {loading ? "Obtendo localização..." : "Permitir localização"}
        </Button>
      </div>
    </div>
  );
};

export default LocationPermissionBanner;
