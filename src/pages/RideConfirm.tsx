import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CreditCard, QrCode, ArrowLeft, Loader2, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRide, RideEstimate } from "@/hooks/useRide";
import { toast } from "sonner";
import MultiStopInput, { StopPoint } from "@/components/MultiStopInput";
import ScheduleRidePicker from "@/components/ScheduleRidePicker";
import SplitPayment from "@/components/SplitPayment";
import VoucherInput from "@/components/VoucherInput";
import PaymentMethodSelector, { SelectedPayment } from "@/components/PaymentMethodSelector";
import PixPaymentModal from "@/components/PixPaymentModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

const RideConfirm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { origem, destino } = (location.state as any) || {};
  const { estimate, estimating, createRide, creating, dispatchRide } = useRide();
  const [est, setEst] = useState<RideEstimate | null>(null);
  const [stops, setStops] = useState<StopPoint[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<SelectedPayment | null>(null);
  const [charging, setCharging] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<{
    qr_code_url: string;
    qr_code_data: string;
    payment_intent_id: string;
    ride_id: string;
  } | null>(null);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);

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
    if (!est || !selectedPayment) return;
    setCharging(true);

    try {
      const formaPagamento = selectedPayment.type === "card" ? "card" : "pix";
      const ride = await createRide(est, formaPagamento);
      if (!ride) {
        toast.error("Erro ao solicitar corrida.");
        return;
      }

      setCurrentRideId(ride.id);

      // Save payment method on ride if card
      if (selectedPayment.type === "card" && selectedPayment.stripe_payment_method_id) {
        await supabase
          .from("rides")
          .update({
            stripe_payment_method_id: selectedPayment.stripe_payment_method_id,
          } as any)
          .eq("id", ride.id);
      }

      // Charge ride - MUST succeed before dispatching
      console.log("Calling charge-ride with:", { ride_id: ride.id, payment_method_id: selectedPayment.stripe_payment_method_id || null });
      const { data, error } = await supabase.functions.invoke("charge-ride", {
        body: {
          ride_id: ride.id,
          payment_method_id: selectedPayment.stripe_payment_method_id || null,
        },
      });

      console.log("charge-ride response:", { data, error });

      if (error || (!data?.success && !data?.pix)) {
        const errorMsg = data?.error || error?.message || "Erro ao processar pagamento. Tente novamente.";
        console.error("Payment failed:", errorMsg);
        toast.error(errorMsg);
        // Cancel the ride since payment failed
        await supabase
          .from("rides")
          .update({
            status: "cancelada",
            cancelada_em: new Date().toISOString(),
            motivo_cancelamento: "Falha no pagamento",
            cancelado_por: "sistema",
          } as any)
          .eq("id", ride.id);
        return;
      }

      // PIX flow - show QR code and wait
      if (selectedPayment.type === "pix" && data?.pix) {
        setPixData({
          qr_code_url: data.pix.qr_code_url,
          qr_code_data: data.pix.qr_code_data,
          payment_intent_id: data.payment_intent_id,
          ride_id: ride.id,
        });
        setShowPixModal(true);
        return; // Don't navigate yet, wait for PIX confirmation
      }

      // Card flow - payment succeeded, dispatch and navigate
      if (data?.payment_status === "paid") {
        toast.success("Pagamento confirmado!");
        await dispatchRide(ride.id, est);
        navigate("/ride-active", { state: { rideId: ride.id } });
      } else {
        toast.error("Pagamento não confirmado. Tente novamente.");
        await supabase
          .from("rides")
          .update({
            status: "cancelada",
            cancelada_em: new Date().toISOString(),
            motivo_cancelamento: "Pagamento não confirmado",
            cancelado_por: "sistema",
          } as any)
          .eq("id", ride.id);
      }
    } catch (err) {
      toast.error("Erro ao processar. Tente novamente.");
    } finally {
      setCharging(false);
    }
  };

  const handlePixSuccess = async () => {
    if (!currentRideId || !est) return;
    setShowPixModal(false);
    // PIX confirmed - dispatch ride
    await dispatchRide(currentRideId, est);
    navigate("/ride-active", { state: { rideId: currentRideId } });
  };

  const handlePixClose = async () => {
    setShowPixModal(false);
    // Cancel ride if PIX was abandoned
    if (currentRideId) {
      await supabase
        .from("rides")
        .update({
          status: "cancelada",
          cancelada_em: new Date().toISOString(),
          motivo_cancelamento: "Pagamento PIX cancelado",
          cancelado_por: "passageiro",
        } as any)
        .eq("id", currentRideId);
      // Refund if intent was created
      if (pixData?.payment_intent_id) {
        supabase.functions
          .invoke("refund-ride", { body: { ride_id: currentRideId } })
          .catch(() => {});
      }
    }
    setCharging(false);
  };

  const isProcessing = creating || charging;

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl bg-secondary/60 border border-border/20 press"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Confirmar corrida</h1>
      </div>

      {/* Content */}
      <div className="px-4 flex-1 overflow-y-auto pb-24">
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
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  Origem
                </p>
                <p className="text-sm font-semibold truncate">
                  {origem?.endereco || "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  Destino
                </p>
                <p className="text-sm font-semibold truncate">
                  {destino?.endereco || "—"}
                </p>
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
                {
                  label: "Distância",
                  value: est ? `${est.distancia_km} km` : "—",
                },
                {
                  label: "Tempo est.",
                  value: est ? `${est.duracao_min} min` : "—",
                },
                {
                  label: "Valor",
                  value: est ? `R$ ${est.valor.toFixed(2)}` : "—",
                  accent: true,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-center p-2 bg-secondary/40 rounded-xl"
                >
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {item.label}
                  </p>
                  <p
                    className={`text-base font-bold ${item.accent ? "text-primary" : ""}`}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Payment selection */}
        <div className="mt-5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
            Pagamento
          </p>
          <button
            onClick={() => setShowPaymentSelector(true)}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card hover:bg-secondary/30 transition-all press"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              {selectedPayment?.type === "pix" ? (
                <QrCode size={18} className="text-primary" />
              ) : selectedPayment?.type === "card" ? (
                <CreditCard size={18} className="text-primary" />
              ) : (
                <CreditCard size={18} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">
                {selectedPayment?.label || "Selecione a forma de pagamento"}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedPayment ? "Toque para alterar" : "Obrigatório"}
              </p>
            </div>
            <ArrowLeft size={14} className="text-muted-foreground rotate-180" />
          </button>
          {!selectedPayment && (
            <p className="text-xs text-destructive mt-1.5 ml-1">
              * Selecione uma forma de pagamento para continuar
            </p>
          )}
        </div>

        {/* Multi-stop */}
        <div className="mt-5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Paradas intermediárias
          </p>
          <MultiStopInput
            stops={stops}
            onStopsChange={setStops}
            userPosition={
              origem ? { lat: origem.lat, lng: origem.lng } : undefined
            }
          />
        </div>

        {/* Schedule */}
        <div className="mt-4">
          {scheduledDate ? (
            <div className="flex items-center gap-2 bg-primary/8 border border-primary/20 rounded-xl px-4 py-3">
              <Calendar size={16} className="text-primary" />
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground">
                  Agendada para
                </p>
                <p className="text-sm font-bold text-primary">
                  {format(scheduledDate, "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              <button
                onClick={() => setScheduledDate(null)}
                className="text-muted-foreground hover:text-foreground p-1 press"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowScheduler(true)}
              className="flex items-center gap-2 text-xs font-semibold text-primary py-2 press"
            >
              <Clock size={14} />
              Agendar para depois
            </button>
          )}
        </div>

        {/* Voucher */}
        <div className="mt-4">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Voucher
          </p>
          <VoucherInput
            onApply={(id, val, nome) =>
              toast.success(`Voucher ${nome} aplicado!`)
            }
          />
        </div>

        {/* Split */}
        {est && (
          <div className="mt-3">
            <SplitPayment rideId="" totalValue={est.valor} />
          </div>
        )}
      </div>

      {/* CTA - only shows when payment method is selected */}
      <div className="p-4 safe-bottom glass-heavy border-t border-border/30">
        <Button
          onClick={handleConfirm}
          className="w-full h-14 text-base font-bold glow-blue rounded-xl"
          disabled={!est || isProcessing || !selectedPayment}
        >
          {isProcessing ? (
            <Loader2 className="animate-spin mr-2" size={20} />
          ) : null}
          {isProcessing
            ? "Processando pagamento..."
            : scheduledDate
              ? "Agendar corrida"
              : `Confirmar • R$ ${est?.valor.toFixed(2) || "—"}`}
        </Button>
      </div>

      {/* Schedule Picker */}
      <AnimatePresence>
        {showScheduler && (
          <ScheduleRidePicker
            onSchedule={(dt) => {
              setScheduledDate(dt);
              setShowScheduler(false);
            }}
            onCancel={() => setShowScheduler(false)}
          />
        )}
      </AnimatePresence>

      {/* Payment Method Selector */}
      <PaymentMethodSelector
        open={showPaymentSelector}
        onClose={() => setShowPaymentSelector(false)}
        onSelect={(payment) => {
          setSelectedPayment(payment);
          setShowPaymentSelector(false);
        }}
        currentSelection={selectedPayment}
      />

      {/* PIX Payment Modal */}
      <PixPaymentModal
        open={showPixModal}
        onClose={handlePixClose}
        onSuccess={handlePixSuccess}
        pixData={pixData}
      />
    </div>
  );
};

export default RideConfirm;
