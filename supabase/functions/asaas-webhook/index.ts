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
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
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
      const { data: ride, error: findError } = await supabase
        .from("rides")
        .select("id")
        .eq("payment_intent_id", paymentId)
        .maybeSingle();

      if (findError) {
        console.error("Error finding ride:", findError.message);
      }

      if (ride) {
        const { error: updateError } = await supabase
          .from("rides")
          .update({
            payment_status: "paid",
            status: "completed",
          } as any)
          .eq("id", ride.id);

        if (updateError) {
          console.error("Error updating ride:", updateError.message);
        } else {
          console.log(`Ride ${ride.id} marked as completed/paid`);
        }
      } else {
        console.log(`No ride found for payment ${paymentId}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("asaas-webhook error:", err.message);
    // Always return 200 to prevent Asaas retries
    return new Response(JSON.stringify({ received: true, error: err.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
