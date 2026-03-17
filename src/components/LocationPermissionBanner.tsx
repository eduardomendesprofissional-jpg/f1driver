import { MapPin, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  permission: "prompt" | "denied" | "unsupported" | "granted";
  loading: boolean;
  error: string | null;
  onRequest: () => void;
}

const LocationPermissionBanner = ({ permission, loading, error, onRequest }: Props) => {
  // If granted, don't show anything
  if (permission === "granted" && !error) return null;

  if (permission === "unsupported") {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 text-center space-y-2 shadow-lg">
        <AlertTriangle size={24} className="mx-auto text-destructive" />
        <p className="text-sm text-foreground font-semibold">Navegador não suporta geolocalização</p>
        <p className="text-xs text-muted-foreground">Use um navegador moderno para acessar esta funcionalidade.</p>
      </div>
    );
  }

  // Error after granting permission (timeout, etc.)
  if (permission === "granted" && error) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 text-center space-y-2 shadow-lg">
        <AlertTriangle size={24} className="mx-auto text-amber-500" />
        <p className="text-sm text-foreground font-semibold">Erro ao obter localização</p>
        <p className="text-xs text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={onRequest} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <RefreshCw size={14} className="mr-1.5" />}
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 text-center space-y-2 shadow-lg">
        <AlertTriangle size={24} className="mx-auto text-amber-500" />
        <p className="text-sm text-foreground font-semibold">Localização bloqueada</p>
        <p className="text-xs text-muted-foreground">
          Habilite a permissão de localização nas configurações do navegador e recarregue a página.
        </p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Recarregar página
        </Button>
      </div>
    );
  }

  // prompt state
  return (
    <div className="bg-card border border-border rounded-2xl p-5 text-center space-y-3 shadow-lg">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <MapPin size={24} className="text-primary" />
      </div>
      <p className="text-base text-foreground font-bold">Permitir acesso à localização</p>
      <p className="text-xs text-muted-foreground">
        Precisamos da sua localização para mostrar o mapa e encontrar motoristas próximos.
      </p>
      <Button className="w-full h-11 font-bold" onClick={onRequest} disabled={loading}>
        {loading ? <Loader2 size={18} className="animate-spin mr-2" /> : <MapPin size={16} className="mr-2" />}
        {loading ? "Obtendo localização..." : "Permitir localização"}
      </Button>
    </div>
  );
};

export default LocationPermissionBanner;
