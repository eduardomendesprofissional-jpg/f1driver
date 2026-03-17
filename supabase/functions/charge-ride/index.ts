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
    const { ride_id, payment_method_id } = await req.json();

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
      return new Response(JSON.stringify({ error: "Ride not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get passenger profile with stripe_customer_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", ride.passageiro_id)
      .single();

    let customerId = profile?.stripe_customer_id;
    const pmId = payment_method_id || ride.stripe_payment_method_id;

    // Create Stripe customer if not exists
    if (!customerId) {
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
      if (customer.error) throw new Error(customer.error.message);
      customerId = customer.id;

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
      params.append("payment_method_types[]", "card");
    }

    const piRes = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const paymentIntent = await piRes.json();
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

    // For PIX, include QR code data
    if (isPix && paymentIntent.next_action?.pix_display_qr_code) {
      response.pix = {
        qr_code_url:
          paymentIntent.next_action.pix_display_qr_code.image_url_png,
        qr_code_data: paymentIntent.next_action.pix_display_qr_code.data,
        expires_at:
          paymentIntent.next_action.pix_display_qr_code.expires_at || null,
      };
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
