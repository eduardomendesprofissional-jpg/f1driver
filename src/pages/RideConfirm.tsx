import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CreditCard, Banknote, QrCode, ArrowLeft, Loader2, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRide, RideEstimate } from "@/hooks/useRide";
import { toast } from "sonner";
import MultiStopInput, { StopPoint } from "@/components/MultiStopInput";
import ScheduleRidePicker from "@/components/ScheduleRidePicker";
import SplitPayment from "@/components/SplitPayment";
import VoucherInput from "@/components/VoucherInput";
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
    if (!origem || !destino) { navigate("/passenger"); return; }
    estimate(origem, destino).then((r) => {
      if (r) setEst(r);
      else toast.error("Não foi possível calcular a rota.");
    });
  }, []);

  const handleConfirm = async () => {
    if (!est) return;
    const ride = await createRide(est, selectedPayment);
    if (ride) navigate("/ride-active", { state: { rideId: ride.id } });
    else toast.error("Erro ao solicitar corrida.");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => navigate(-1)} className="p-2.5 rounded-xl bg-secondary/60 border border-border/20 press">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Confirmar corrida</h1>
      </div>

      {/* Content */}
      <div className="px-4 flex-1 overflow-y-auto pb-24">
        {/* Route card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 border border-border/50 space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1 mt-1.5">
              <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_hsl(210_100%_56%/0.5)]" />
              <div className="w-px h-8 bg-border" />
              <MapPin size={14} className="text-destructive" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Origem</p>
                <p className="text-sm font-semibold truncate">{origem?.endereco || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Destino</p>
                <p className="text-sm font-semibold truncate">{destino?.endereco || "—"}</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-border/50" />

          {estimating ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Distância", value: est ? `${est.distancia_km} km` : "—" },
                { label: "Tempo est.", value: est ? `${est.duracao_min} min` : "—" },
                { label: "Valor", value: est ? `R$ ${est.valor.toFixed(2)}` : "—", accent: true },
              ].map((item) => (
                <div key={item.label} className="text-center p-2 bg-secondary/40 rounded-xl">
                  <p className="text-[10px] text-muted-foreground font-medium">{item.label}</p>
                  <p className={`text-base font-bold ${item.accent ? "text-primary" : ""}`}>{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Payment */}
        <div className="mt-5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Pagamento</p>
          <div className="flex gap-2.5">
            {paymentMethods.map((pm) => (
              <button
                key={pm.id}
                onClick={() => setSelectedPayment(pm.id)}
                className={`flex-1 flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all duration-200 press ${
                  selectedPayment === pm.id
                    ? "border-primary bg-primary/10 shadow-[0_0_12px_hsl(210_100%_56%/0.15)]"
                    : "border-border/40 bg-secondary/40"
                }`}
              >
                <pm.icon size={20} className={selectedPayment === pm.id ? "text-primary" : "text-muted-foreground"} />
                <span className={`text-xs font-semibold ${selectedPayment === pm.id ? "text-primary" : "text-muted-foreground"}`}>
                  {pm.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Multi-stop */}
        <div className="mt-5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Paradas intermediárias</p>
          <MultiStopInput stops={stops} onStopsChange={setStops} userPosition={origem ? { lat: origem.lat, lng: origem.lng } : undefined} />
        </div>

        {/* Schedule */}
        <div className="mt-4">
          {scheduledDate ? (
            <div className="flex items-center gap-2 bg-primary/8 border border-primary/20 rounded-xl px-4 py-3">
              <Calendar size={16} className="text-primary" />
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground">Agendada para</p>
                <p className="text-sm font-bold text-primary">
                  {format(scheduledDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <button onClick={() => setScheduledDate(null)} className="text-muted-foreground hover:text-foreground p-1 press">✕</button>
            </div>
          ) : (
            <button onClick={() => setShowScheduler(true)} className="flex items-center gap-2 text-xs font-semibold text-primary py-2 press">
              <Clock size={14} />
              Agendar para depois
            </button>
          )}
        </div>

        {/* Voucher */}
        <div className="mt-4">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Voucher</p>
          <VoucherInput onApply={(id, val, nome) => toast.success(`Voucher ${nome} aplicado!`)} />
        </div>

        {/* Split */}
        {est && (
          <div className="mt-3">
            <SplitPayment rideId="" totalValue={est.valor} />
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="p-4 safe-bottom glass-heavy border-t border-border/30">
        <Button onClick={handleConfirm} className="w-full h-14 text-base font-bold glow-blue rounded-xl" disabled={!est || creating}>
          {creating ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
          {creating ? "Solicitando..." : scheduledDate ? "Agendar corrida" : "Confirmar corrida"}
        </Button>
      </div>

      {/* Schedule Picker */}
      <AnimatePresence>
        {showScheduler && (
          <ScheduleRidePicker
            onSchedule={(dt) => { setScheduledDate(dt); setShowScheduler(false); }}
            onCancel={() => setShowScheduler(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RideConfirm;
