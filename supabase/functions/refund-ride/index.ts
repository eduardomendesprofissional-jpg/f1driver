import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { ride_id, amount_to_refund } = await req.json();

    if (!ride_id) {
      return new Response(JSON.stringify({ error: "ride_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("payment_intent_id, payment_status, valor, forma_pagamento, passageiro_id")
      .eq("id", ride_id)
      .single();

    if (rideError || !ride) {
      return new Response(JSON.stringify({ error: "Ride not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ride.payment_intent_id) {
      return new Response(JSON.stringify({ error: "No payment to refund" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ride.payment_status === "refunded") {
      return new Response(JSON.stringify({ message: "Already refunded" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create refund
    const params = new URLSearchParams();
    params.append("payment_intent", ride.payment_intent_id);
    if (amount_to_refund) {
      params.append("amount", String(Math.round(amount_to_refund * 100)));
    }

    const refundRes = await fetch("https://api.stripe.com/v1/refunds", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const refund = await refundRes.json();
    if (refund.error) {
      return new Response(JSON.stringify({ error: refund.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update ride payment status
    const newStatus = amount_to_refund ? "partially_refunded" : "refunded";
    await supabase
      .from("rides")
      .update({ payment_status: newStatus })
      .eq("id", ride_id);

    // Determine refund message based on payment type
    const isPix = ride.forma_pagamento === "pix";
    const refundAmount = amount_to_refund || ride.valor || 0;
    const prazoMsg = isPix
      ? "O reembolso via PIX é instantâneo."
      : "Prazo de estorno: 5 a 10 dias úteis no cartão.";

    // Notify passenger
    await supabase.from("notificacoes").insert({
      user_id: ride.passageiro_id,
      titulo: "Reembolso processado",
      mensagem: amount_to_refund
        ? `Reembolso parcial de R$ ${Number(refundAmount).toFixed(2)} realizado. ${prazoMsg}`
        : `Reembolso total de R$ ${Number(refundAmount).toFixed(2)} realizado. ${prazoMsg}`,
      tipo: "pagamento",
    });

    return new Response(
      JSON.stringify({
        refund_id: refund.id,
        status: refund.status,
        payment_status: newStatus,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
