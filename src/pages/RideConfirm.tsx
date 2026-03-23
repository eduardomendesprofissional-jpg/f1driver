import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, CreditCard, QrCode, ArrowLeft, Loader2, Calendar, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
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

type RidePhase = "confirm" | "waiting_payment" | "searching_driver";

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
  const [phase, setPhase] = useState<RidePhase>("confirm");
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<{
    encoded_image?: string;
    payload?: string;
    qr_code_url?: string;
    qr_code_data?: string;
    payment_intent_id?: string;
    ride_id: string;
    expiration_date?: string;
  } | null>(null);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const realtimeChannelRef = useRef<any>(null);

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

  // Cleanup realtime channel on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  // Subscribe to ride changes via Realtime
  const subscribeToRide = (rideId: string) => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase
      .channel(`ride-payment-${rideId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
          filter: `id=eq.${rideId}`,
        },
        async (payload) => {
          const updated = payload.new as any;

          if (updated.payment_status === "paid" && phase !== "searching_driver") {
            // Payment confirmed via webhook → dispatch!
            setPhase("searching_driver");
            setShowPixModal(false);
            toast.success("Pagamento confirmado! Buscando motorista...");

            // Update ride status to solicitada for dispatch
            await supabase
              .from("rides")
              .update({ status: "solicitada" } as any)
              .eq("id", rideId);

            if (est) {
              await dispatchRide(rideId, est);
            }
            navigate("/ride-active", { state: { rideId } });
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;
  };

  const handleConfirm = async () => {
    if (!est || !selectedPayment) return;
    setPhase("waiting_payment");

    try {
      const formaPagamento = selectedPayment.type === "card" ? "card" : "pix";
      const ride = await createRide(est, formaPagamento);
      if (!ride) {
        toast.error("Erro ao solicitar corrida.");
        setPhase("confirm");
        return;
      }

      setCurrentRideId(ride.id);

      // Save stripe payment method if card
      if (selectedPayment.type === "card" && selectedPayment.stripe_payment_method_id) {
        await supabase
          .from("rides")
          .update({ stripe_payment_method_id: selectedPayment.stripe_payment_method_id } as any)
          .eq("id", ride.id);
      }

      // Subscribe to realtime updates for this ride
      subscribeToRide(ride.id);

      // Get passenger profile for Asaas info
      const { data: profile } = await supabase
        .from("profiles")
        .select("credit_card_token, asaas_customer_id")
        .eq("id", ride.passageiro_id)
        .single();

      const hasAsaasToken = !!(profile as any)?.credit_card_token && !!(profile as any)?.asaas_customer_id;

      if (hasAsaasToken) {
        const isPix = selectedPayment.type === "pix";

        const { data: asaasData, error: asaasError } = await supabase.functions.invoke("asaas-payment", {
          body: {
            action: "create_payment",
            amount: est.valor,
            customer_id: (profile as any).asaas_customer_id,
            driver_wallet_id: "",
            billing_type: isPix ? "PIX" : "CREDIT_CARD",
          },
        });

        if (asaasError || !asaasData?.success) {
          toast.error(asaasData?.error || asaasError?.message || "Erro ao processar pagamento.");
          await cancelRide(ride.id, "Falha no pagamento");
          return;
        }

        // Save payment_id on ride
        await supabase
          .from("rides")
          .update({
            payment_intent_id: asaasData.payment_id,
            payment_status: asaasData.status === "CONFIRMED" || asaasData.status === "RECEIVED" ? "paid" : "pending",
          } as any)
          .eq("id", ride.id);

        // If already confirmed (card instant), go straight to dispatch
        if (asaasData.status === "CONFIRMED" || asaasData.status === "RECEIVED") {
          setPhase("searching_driver");
          toast.success("Pagamento confirmado! Buscando motorista...");
          await supabase.from("rides").update({ status: "solicitada" } as any).eq("id", ride.id);
          await dispatchRide(ride.id, est);
          navigate("/ride-active", { state: { rideId: ride.id } });
          return;
        }

        // PIX: show QR modal, wait for realtime webhook confirmation
        if (isPix && asaasData.pix) {
          setPixData({
            encoded_image: asaasData.pix.encoded_image,
            payload: asaasData.pix.payload,
            ride_id: ride.id,
            payment_intent_id: asaasData.payment_id,
            expiration_date: asaasData.pix.expiration_date,
          });
          setShowPixModal(true);
          return; // Stay on page, realtime will handle the rest
        }

        // PENDING card: wait for webhook
        toast.info("Aguardando confirmação do pagamento...");
        return;
      }

      // ── Fallback: Stripe charge-ride flow ──
      const { data, error } = await supabase.functions.invoke("charge-ride", {
        body: {
          ride_id: ride.id,
          payment_method_id: selectedPayment.stripe_payment_method_id || null,
        },
      });

      if (error || (!data?.success && !data?.pix)) {
        toast.error(data?.error || error?.message || "Erro ao processar pagamento.");
        await cancelRide(ride.id, "Falha no pagamento");
        return;
      }

      // Stripe PIX flow
      if (selectedPayment.type === "pix" && data?.pix) {
        setPixData({
          qr_code_url: data.pix.qr_code_url,
          qr_code_data: data.pix.qr_code_data,
          payment_intent_id: data.payment_intent_id,
          ride_id: ride.id,
        });
        setShowPixModal(true);
        return;
      }

      // Stripe card confirmed
      if (data?.payment_status === "paid") {
        setPhase("searching_driver");
        toast.success("Pagamento confirmado! Buscando motorista...");
        await supabase.from("rides").update({ status: "solicitada" } as any).eq("id", ride.id);
        await dispatchRide(ride.id, est);
        navigate("/ride-active", { state: { rideId: ride.id } });
      } else {
        toast.error("Pagamento não confirmado.");
        await cancelRide(ride.id, "Pagamento não confirmado");
      }
    } catch (err) {
      toast.error("Erro ao processar. Tente novamente.");
      setPhase("confirm");
    }
  };

  const cancelRide = async (rideId: string, motivo: string) => {
    await supabase
      .from("rides")
      .update({
        status: "cancelada",
        cancelada_em: new Date().toISOString(),
        motivo_cancelamento: motivo,
        cancelado_por: "sistema",
      } as any)
      .eq("id", rideId);
    setPhase("confirm");
    setCurrentRideId(null);
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
  };

  const handleCancelRequest = async () => {
    if (!currentRideId || phase !== "waiting_payment") return;
    setCancelling(true);
    await cancelRide(currentRideId, "Cancelado pelo passageiro antes do pagamento");
    setShowPixModal(false);
    setCancelling(false);
    toast.info("Solicitação cancelada.");
  };

  const handlePixSuccess = async () => {
    // This is called by realtime or manual confirmation in PixPaymentModal
    if (!currentRideId || !est) return;
    setShowPixModal(false);
    setPhase("searching_driver");
    toast.success("Pagamento confirmado! Buscando motorista...");
    await supabase.from("rides").update({ status: "solicitada" } as any).eq("id", currentRideId);
    await dispatchRide(currentRideId, est);
    navigate("/ride-active", { state: { rideId: currentRideId } });
  };

  const handlePixClose = async () => {
    setShowPixModal(false);
    if (currentRideId && phase === "waiting_payment") {
      await cancelRide(currentRideId, "Pagamento PIX cancelado");
      if (pixData?.payment_intent_id) {
        supabase.functions.invoke("refund-ride", { body: { ride_id: currentRideId } }).catch(() => {});
      }
    }
  };

  const isProcessing = creating || phase === "waiting_payment" || phase === "searching_driver";

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => phase === "confirm" ? navigate(-1) : undefined}
          className={`p-2.5 rounded-xl bg-secondary/60 border border-border/20 press ${phase !== "confirm" ? "opacity-50" : ""}`}
          disabled={phase !== "confirm"}
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">
          {phase === "waiting_payment"
            ? "Aguardando pagamento..."
            : phase === "searching_driver"
              ? "Buscando motorista..."
              : "Confirmar corrida"}
        </h1>
      </div>

      {/* Waiting payment overlay */}
      <AnimatePresence>
        {phase === "waiting_payment" && !showPixModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-8 flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
            <p className="text-base font-bold text-foreground">Processando pagamento...</p>
            <p className="text-sm text-muted-foreground text-center">
              Aguarde a confirmação. Não feche esta tela.
            </p>
            <Button
              variant="outline"
              onClick={handleCancelRequest}
              disabled={cancelling}
              className="mt-4 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              {cancelling ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
              Cancelar solicitação
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content - only visible in confirm phase */}
      {phase === "confirm" && (
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

          {/* Payment selection */}
          <div className="mt-5">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Pagamento</p>
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
              <p className="text-xs text-destructive mt-1.5 ml-1">* Selecione uma forma de pagamento para continuar</p>
            )}
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

          {/* Split */}
          {est && (
            <div className="mt-3">
              <SplitPayment rideId="" totalValue={est.valor} />
            </div>
          )}
        </div>
      )}

      {/* CTA - only in confirm phase */}
      {phase === "confirm" && (
        <div className="p-4 safe-bottom glass-heavy border-t border-border/30">
          <Button
            onClick={handleConfirm}
            className="w-full h-14 text-base font-bold glow-blue rounded-xl"
            disabled={!est || isProcessing || !selectedPayment}
          >
            {creating ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
            {creating
              ? "Criando corrida..."
              : scheduledDate
                ? "Agendar corrida"
                : `Pedir corrida • R$ ${est?.valor.toFixed(2) || "—"}`}
          </Button>
        </div>
      )}

      {/* Schedule Picker */}
      <AnimatePresence>
        {showScheduler && (
          <ScheduleRidePicker
            onSchedule={(dt) => { setScheduledDate(dt); setShowScheduler(false); }}
            onCancel={() => setShowScheduler(false)}
          />
        )}
      </AnimatePresence>

      {/* Payment Method Selector */}
      <PaymentMethodSelector
        open={showPaymentSelector}
        onClose={() => setShowPaymentSelector(false)}
        onSelect={(payment) => { setSelectedPayment(payment); setShowPaymentSelector(false); }}
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
