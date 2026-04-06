import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

const GpsJustificationModal = ({ open, onAccept, onCancel }: Props) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader className="items-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Navigation size={28} className="text-primary" />
          </div>
          <DialogTitle className="text-lg">Localização Necessária</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed mt-2">
            O <strong className="text-foreground">F1 Driver</strong> usa sua localização para encontrar 
            motoristas próximos, calcular rotas e estimar o tempo de chegada. Sua localização é 
            usada apenas durante corridas ativas.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
          <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Você pode desativar a localização a qualquer momento nas configurações do seu dispositivo.
          </p>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={onAccept} className="w-full font-bold">
            Entendi
          </Button>
          <Button variant="ghost" onClick={onCancel} className="w-full text-muted-foreground">
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GpsJustificationModal;
