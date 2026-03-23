import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) {
      throw new Error("ASAAS_API_KEY not configured");
    }

    const { action, amount, driver_wallet_id, customer_id, billing_type } = await req.json();
    const billingType = (billing_type || "PIX").toUpperCase();
    console.log("asaas-payment called:", JSON.stringify({ action, amount, driver_wallet_id, customer_id, billingType }));

    if (action !== "create_payment") {
      return new Response(
        JSON.stringify({ error: `Ação '${action}' não suportada. Use 'create_payment'.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!amount || !customer_id) {
      return new Response(
        JSON.stringify({ error: "Campos 'amount' e 'customer_id' são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate split: 80% driver, 20% platform
    const driverAmount = Math.round(amount * 0.8 * 100) / 100;

    const paymentBody: Record<string, any> = {
      customer: customer_id,
      billingType,
      value: amount,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      description: "Pagamento de corrida",
    };

    if (driver_wallet_id) {
      paymentBody.split = [
        { walletId: driver_wallet_id, fixedValue: driverAmount },
      ];
    }

    console.log("Calling Asaas API:", JSON.stringify(paymentBody));

    const asaasRes = await fetch("https://www.asaas.com/api/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify(paymentBody),
    });

    const asaasData = await asaasRes.json();
    console.log("Asaas payment response:", JSON.stringify(asaasData));

    if (!asaasRes.ok) {
      return new Response(
        JSON.stringify({ error: asaasData.errors?.[0]?.description || "Erro ao criar cobrança no Asaas", details: asaasData }),
        { status: asaasRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response: Record<string, any> = {
      success: true,
      payment_id: asaasData.id,
      status: asaasData.status,
      invoice_url: asaasData.invoiceUrl,
      value: asaasData.value,
      net_value: asaasData.netValue,
      due_date: asaasData.dueDate,
      billing_type: billingType,
    };

    // For PIX: fetch QR code data
    if (billingType === "PIX" && asaasData.id) {
      const pixRes = await fetch(`https://www.asaas.com/api/v3/payments/${asaasData.id}/pixQrCode`, {
        headers: { access_token: ASAAS_API_KEY },
      });
      const pixData = await pixRes.json();
      console.log("Asaas PIX QR response:", JSON.stringify({ success: pixRes.ok, has_image: !!pixData.encodedImage }));

      if (pixRes.ok && pixData.encodedImage) {
        response.pix = {
          encoded_image: pixData.encodedImage,
          payload: pixData.payload,
          expiration_date: pixData.expirationDate,
        };
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("asaas-payment error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
