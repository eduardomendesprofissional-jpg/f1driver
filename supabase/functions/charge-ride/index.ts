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
    
    const body = await req.json();
    const { ride_id, payment_method_id } = body;
    console.log("charge-ride called with:", JSON.stringify({ ride_id, payment_method_id }));

    if (!ride_id) {
      return new Response(JSON.stringify({ error: "ride_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get ride details
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("*")
      .eq("id", ride_id)
      .single();

    if (rideError || !ride) {
      console.error("Ride not found:", rideError?.message);
      return new Response(JSON.stringify({ error: "Ride not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Ride found:", JSON.stringify({ id: ride.id, valor: ride.valor, forma_pagamento: ride.forma_pagamento, passageiro_id: ride.passageiro_id }));

    // Get passenger profile with stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", ride.passageiro_id)
      .single();

    console.log("Profile:", JSON.stringify({ stripe_customer_id: profile?.stripe_customer_id, error: profileError?.message }));

    let customerId = profile?.stripe_customer_id;
    const pmId = payment_method_id || ride.stripe_payment_method_id;

    // Create Stripe customer if not exists
    if (!customerId) {
      console.log("Creating new Stripe customer...");
      const customerRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          "metadata[user_id]": ride.passageiro_id,
        }).toString(),
      });
      const customer = await customerRes.json();
      if (customer.error) {
        console.error("Stripe customer creation error:", customer.error.message);
        throw new Error(customer.error.message);
      }
      customerId = customer.id;
      console.log("Created customer:", customerId);

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", ride.passageiro_id);
    }

    const amount = Math.round((ride.valor || 0) * 100);
    if (amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isCard = ride.forma_pagamento === "card" && pmId;
    const isPix = ride.forma_pagamento === "pix";

    console.log("Payment type:", { isCard, isPix, pmId, amount, forma_pagamento: ride.forma_pagamento });

    const params = new URLSearchParams();
    params.append("amount", String(amount));
    params.append("currency", "brl");
    params.append("customer", customerId);
    params.append("metadata[ride_id]", ride_id);

    if (isCard && pmId) {
      params.append("payment_method", pmId);
      params.append("payment_method_types[]", "card");
      params.append("confirm", "true");
      params.append("off_session", "true");
    } else if (isPix) {
      params.append("payment_method_types[]", "pix");
      params.append("confirm", "false");
    } else {
      // Fallback - no valid payment method for card
      console.error("No valid payment method. forma_pagamento:", ride.forma_pagamento, "pmId:", pmId);
      return new Response(
        JSON.stringify({ success: false, error: "Método de pagamento inválido. Selecione um cartão ou PIX." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Creating PaymentIntent...");
    const piRes = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const paymentIntent = await piRes.json();
    console.log("PaymentIntent response:", JSON.stringify({ id: paymentIntent.id, status: paymentIntent.status, error: paymentIntent.error?.message }));
    
    if (paymentIntent.error) {
      return new Response(
        JSON.stringify({ success: false, error: paymentIntent.error.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update ride with payment info
    const paymentStatus =
      paymentIntent.status === "succeeded" ? "paid" : "pending";
    await supabase
      .from("rides")
      .update({
        payment_intent_id: paymentIntent.id,
        payment_status: paymentStatus,
        stripe_payment_method_id: pmId || null,
      })
      .eq("id", ride_id);

    // Build response
    const response: Record<string, any> = {
      success: paymentIntent.status === "succeeded" || isPix,
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      status: paymentIntent.status,
      payment_status: paymentStatus,
    };

    // For PIX, we need to confirm the PaymentIntent to get the QR code
    if (isPix) {
      // First confirm the PI to generate PIX QR code
      const confirmRes = await fetch(
        `https://api.stripe.com/v1/payment_intents/${paymentIntent.id}/confirm`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            "payment_method_types[]": "pix",
            "payment_method_data[type]": "pix",
          }).toString(),
        }
      );
      const confirmedPI = await confirmRes.json();
      console.log("PIX confirm response:", JSON.stringify({ status: confirmedPI.status, has_next_action: !!confirmedPI.next_action, error: confirmedPI.error?.message }));

      if (confirmedPI.error) {
        return new Response(
          JSON.stringify({ success: false, error: confirmedPI.error.message }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (confirmedPI.next_action?.pix_display_qr_code) {
        response.pix = {
          qr_code_url: confirmedPI.next_action.pix_display_qr_code.image_url_png,
          qr_code_data: confirmedPI.next_action.pix_display_qr_code.data,
          expires_at: confirmedPI.next_action.pix_display_qr_code.expires_at || null,
        };
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("charge-ride error:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
