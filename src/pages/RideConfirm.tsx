import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CreditCard, Banknote, QrCode, ArrowLeft, Loader2, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRide, RideEstimate } from "@/hooks/useRide";
import { toast } from "sonner";
import MultiStopInput, { StopPoint } from "@/components/MultiStopInput";
import ScheduleRidePicker from "@/components/ScheduleRidePicker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const paymentMethods = [
  { id: "pix", label: "Pix", icon: QrCode },
  { id: "card", label: "Cartão", icon: CreditCard },
  { id: "cash", label: "Dinheiro", icon: Banknote },
];

const RideConfirm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { origem, destino } = (location.state as any) || {};
  const [selectedPayment, setSelectedPayment] = useState("pix");
  const { estimate, estimating, createRide, creating } = useRide();
  const [est, setEst] = useState<RideEstimate | null>(null);
  const [stops, setStops] = useState<StopPoint[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);

  useEffect(() => {
    if (!origem || !destino) {
      navigate("/passenger");
      return;
    }
    estimate(origem, destino).then((r) => {
      if (r) setEst(r);
      else toast.error("Não foi possível calcular a rota.");
    });
  }, []);

  const handleConfirm = async () => {
    if (!est) return;
    const ride = await createRide(est, selectedPayment);
    if (ride) {
      navigate("/ride-active", { state: { rideId: ride.id } });
    } else {
      toast.error("Erro ao solicitar corrida.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Confirmar corrida</h1>
      </div>

      {/* Route Summary */}
      <div className="px-4 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 border border-border space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1 mt-1">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-px h-8 bg-border" />
              <MapPin size={14} className="text-destructive" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Origem</p>
                <p className="text-sm font-semibold truncate">{origem?.endereco || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Destino</p>
                <p className="text-sm font-semibold truncate">{destino?.endereco || "—"}</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {estimating ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Distância</p>
                <p className="text-lg font-bold">{est ? `${est.distancia_km} km` : "—"}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Tempo estimado</p>
                <p className="text-lg font-bold">{est ? `${est.duracao_min} min` : "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Valor estimado</p>
                <p className="text-lg font-bold text-primary">
                  {est ? `R$ ${est.valor.toFixed(2)}` : "—"}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Payment Methods */}
        <div className="mt-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pagamento</p>
          <div className="flex gap-3">
            {paymentMethods.map((pm) => (
              <button
                key={pm.id}
                onClick={() => setSelectedPayment(pm.id)}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  selectedPayment === pm.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary"
                }`}
              >
                <pm.icon size={22} className={selectedPayment === pm.id ? "text-primary" : "text-muted-foreground"} />
                <span className={`text-xs font-semibold ${selectedPayment === pm.id ? "text-primary" : "text-muted-foreground"}`}>
                  {pm.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Multi-stop */}
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Paradas intermediárias</p>
          <MultiStopInput
            stops={stops}
            onStopsChange={setStops}
            userPosition={origem ? { lat: origem.lat, lng: origem.lng } : undefined}
          />
        </div>

        {/* Schedule */}
        <div className="mt-4">
          {scheduledDate ? (
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
              <Calendar size={16} className="text-primary" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Agendada para</p>
                <p className="text-sm font-bold text-primary">
                  {format(scheduledDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <button onClick={() => setScheduledDate(null)} className="text-xs text-muted-foreground">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setShowScheduler(true)}
              className="flex items-center gap-2 text-xs font-semibold text-primary py-2 transition-all active:scale-95"
            >
              <Clock size={14} />
              Agendar para depois
            </button>
          )}
        </div>
      </div>

      {/* Confirm Button */}
      <div className="p-4">
        <Button
          onClick={handleConfirm}
          className="w-full h-14 text-base font-bold glow-blue"
          disabled={!est || creating}
        >
          {creating ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
          {creating ? "Solicitando..." : "Confirmar corrida"}
        </Button>
      </div>
    </div>
  );
};

export default RideConfirm;
