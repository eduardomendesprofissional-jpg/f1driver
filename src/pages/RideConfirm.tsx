import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ArrowLeft, Loader2, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRide, RideEstimate } from "@/hooks/useRide";
import { toast } from "sonner";
import MultiStopInput, { StopPoint } from "@/components/MultiStopInput";
import RoutePreviewMap from "@/components/RoutePreviewMap";
import ScheduleRidePicker from "@/components/ScheduleRidePicker";
import VoucherInput from "@/components/VoucherInput";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

const RideConfirm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { origem, destino } = (location.state as any) || {};
  const { estimate, estimating, dispatchRide } = useRide();
  const [est, setEst] = useState<RideEstimate | null>(null);
  const [stops, setStops] = useState<StopPoint[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<"dinheiro" | "pix" | "maquininha">("dinheiro");

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
    setRequesting(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error("Usuário não autenticado.");
        setRequesting(false);
        return;
      }

      // Create ride directly as 'solicitada' with forma_pagamento = 'dinheiro'
      const { data: ride, error } = await supabase
        .from("rides")
        .insert({
          passageiro_id: user.id,
          origem_endereco: est.origem_endereco,
          origem_lat: est.origem_lat,
          origem_lng: est.origem_lng,
          destino_endereco: est.destino_endereco,
          destino_lat: est.destino_lat,
          destino_lng: est.destino_lng,
          distancia_km: est.distancia_km,
          duracao_min: est.duracao_min,
          valor: est.valor,
          forma_pagamento: formaPagamento,
          status: "solicitada",
          broadcast_search: true,
          agendada_para: scheduledDate?.toISOString() || null,
        })
        .select()
        .single();

      if (error || !ride) {
        toast.error("Erro ao solicitar corrida.");
        setRequesting(false);
        return;
      }

      // Dispatch to find nearest driver
      await dispatchRide(ride.id, est);

      toast.success("Corrida chamada com sucesso! Seu pagamento é direto com o motorista.", { duration: 5000 });
      navigate("/ride-active", { state: { rideId: ride.id } });
    } catch (err) {
      toast.error("Erro ao processar. Tente novamente.");
      setRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl bg-secondary/60 border border-border/20 press"
          disabled={requesting}
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Confirmar corrida</h1>
      </div>

      <div className="px-4 flex-1 overflow-y-auto pb-24">
        {/* Map with route */}
        {origem && destino && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden border border-border/50 mb-4"
          >
            <RoutePreviewMap
              origin={{ lat: origem.lat, lng: origem.lng }}
              destination={{ lat: destino.lat, lng: destino.lng }}
              className="w-full h-[55vh] min-h-[320px] sm:h-[420px]"
            />
          </motion.div>
        )}

        {/* Route card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
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

        {/* Forma de pagamento (informativo — pago direto ao motorista) */}
        <div className="mt-5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Forma de pagamento
          </p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: "dinheiro", label: "Dinheiro", icon: "💵" },
              { id: "pix", label: "PIX", icon: "📱" },
              { id: "maquininha", label: "Maquininha", icon: "💳" },
            ] as const).map((opt) => {
              const active = formaPagamento === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormaPagamento(opt.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition press ${
                    active
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-card border-border/50 text-foreground"
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            O pagamento é feito direto com o motorista no fim da corrida.
          </p>
        </div>

        {/* Multi-stop */}
        <div className="mt-5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Paradas intermediárias</p>
          <MultiStopInput
            stops={stops}
            onStopsChange={setStops}
            userPosition={origem ? { lat: origem.lat, lng: origem.lng } : undefined}
          />
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
      </div>

      {/* CTA */}
      <div className="p-4 safe-bottom glass-heavy border-t border-border/30">
        <Button
          onClick={handleConfirm}
          className="w-full h-14 text-base font-bold glow-blue rounded-xl"
          disabled={!est || requesting}
        >
          {requesting ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
          {requesting
            ? "Solicitando corrida..."
            : scheduledDate
              ? "Agendar corrida"
              : `Pedir corrida • R$ ${est?.valor.toFixed(2) || "—"}`}
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
