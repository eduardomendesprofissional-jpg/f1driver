import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const WEBHOOK_TOKEN = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    const incomingToken = req.headers.get("asaas-access-token") || new URL(req.url).searchParams.get("access_token");
    if (WEBHOOK_TOKEN && incomingToken !== WEBHOOK_TOKEN) {
      console.error("Invalid webhook token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();

    console.log("asaas-webhook received:", JSON.stringify({ event: body.event, paymentId: body.payment?.id }));

    const event = body.event;
    const paymentId = body.payment?.id;

    if (!paymentId) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      // 1. Check if it's a wallet top-up (passenger or driver)
      const { data: topup } = await supabase
        .from("wallet_topups")
        .select("id, user_id, valor, status, tipo")
        .eq("payment_id", paymentId)
        .maybeSingle();

      if (topup && topup.status !== "paid") {
        if (topup.tipo === "driver") {
          // Driver credit top-up → add to driver_balance
          await supabase.rpc("add_driver_balance", {
            p_user_id: topup.user_id,
            p_amount: topup.valor,
          });
          console.log(`Driver topup ${topup.id} completed: +R$${topup.valor} for driver ${topup.user_id}`);
        } else {
          // Passenger wallet top-up → add to balance
          await supabase.rpc("add_wallet_balance", {
            p_user_id: topup.user_id,
            p_amount: topup.valor,
          });
          console.log(`Wallet topup ${topup.id} completed: +R$${topup.valor} for user ${topup.user_id}`);
        }

        await supabase
          .from("wallet_topups")
          .update({ status: "paid" })
          .eq("id", topup.id);

        return new Response(JSON.stringify({ received: true, type: topup.tipo === "driver" ? "driver_topup" : "wallet_topup" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2. Check if it's a ride payment
      const { data: ride, error: findError } = await supabase
        .from("rides")
        .select("id, origem_endereco, destino_endereco, valor, motorista_id, origem_lat, origem_lng")
        .eq("payment_intent_id", paymentId)
        .maybeSingle();

      if (findError) {
        console.error("Error finding ride:", findError.message);
      }

      if (ride) {
        // Update payment_status to 'paid' — the DB trigger will handle:
        // - setting status to 'solicitada'
        // - setting broadcast_search to true
        // - finding and assigning the nearest driver within 5km
        const { error: updateError } = await supabase
          .from("rides")
          .update({ payment_status: "paid" })
          .eq("id", ride.id);

        if (updateError) {
          console.error("Error updating ride:", updateError.message);
        } else {
          console.log(`Ride ${ride.id} payment confirmed — trigger will handle dispatch`);

          // Re-fetch to get the driver assigned by trigger
          const { data: updatedRide } = await supabase
            .from("rides")
            .select("motorista_id, origem_endereco, destino_endereco, valor")
            .eq("id", ride.id)
            .single();

          // Send push notification to the assigned driver
          if (updatedRide?.motorista_id) {
            await supabase.functions.invoke("send-push-notification", {
              body: {
                user_id: updatedRide.motorista_id,
                title: "Nova corrida disponível!",
                body: `De ${updatedRide.origem_endereco} → ${updatedRide.destino_endereco} | R$ ${Number(updatedRide.valor || 0).toFixed(2)}`,
                data: { ride_id: ride.id },
              },
            });
            console.log(`Push notification sent to driver ${updatedRide.motorista_id}`);
          } else {
            console.log(`No driver found within 5km for ride ${ride.id}`);
          }
        }
      } else {
        console.log(`No ride or topup found for payment ${paymentId}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("asaas-webhook error:", err.message);
    return new Response(JSON.stringify({ received: true, error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
