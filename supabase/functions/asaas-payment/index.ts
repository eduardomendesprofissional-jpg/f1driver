import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_BASE = "https://www.asaas.com/api/v3";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { action } = body;
    console.log("asaas-payment called:", JSON.stringify(body));

    // ─── ACTION: create_customer ───
    if (action === "create_customer") {
      const { user_id, name, cpf_cnpj, email } = body;
      if (!user_id || !name || !cpf_cnpj) {
        return new Response(
          JSON.stringify({ error: "Campos 'user_id', 'name' e 'cpf_cnpj' são obrigatórios." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const customerBody: Record<string, any> = {
        name,
        cpfCnpj: cpf_cnpj.replace(/\D/g, ""),
      };
      if (email) customerBody.email = email;

      console.log("Creating Asaas customer:", JSON.stringify(customerBody));

      const asaasRes = await fetch(`${ASAAS_BASE}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", access_token: ASAAS_API_KEY },
        body: JSON.stringify(customerBody),
      });
      const asaasData = await asaasRes.json();
      console.log("Asaas customer response:", JSON.stringify(asaasData));

      if (!asaasRes.ok) {
        return new Response(
          JSON.stringify({ error: asaasData.errors?.[0]?.description || "Erro ao criar cliente no Asaas", details: asaasData }),
          { status: asaasRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Save asaas_customer_id to profiles
      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update({ asaas_customer_id: asaasData.id })
        .eq("id", user_id);

      if (updateErr) {
        console.error("Error saving asaas_customer_id:", updateErr.message);
        return new Response(
          JSON.stringify({ error: "Cliente criado no Asaas mas falha ao salvar no banco.", asaas_customer_id: asaasData.id }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, asaas_customer_id: asaasData.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── ACTION: create_payment ───
    if (action === "create_payment") {
      const { amount, customer_id, user_id, billing_type, driver_wallet_id, topup_id } = body;
      const billingType = (billing_type || "PIX").toUpperCase();

      // Resolve real customer_id: prefer explicit, otherwise fetch from DB
      let resolvedCustomerId = customer_id;
      if (!resolvedCustomerId && user_id) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("asaas_customer_id")
          .eq("id", user_id)
          .single();
        resolvedCustomerId = profile?.asaas_customer_id;
      }

      if (!amount || !resolvedCustomerId) {
        return new Response(
          JSON.stringify({ error: "Campos 'amount' e 'customer_id' (ou 'user_id' com cadastro Asaas) são obrigatórios." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const driverAmount = Math.round(amount * 0.8 * 100) / 100;

      const paymentBody: Record<string, any> = {
        customer: resolvedCustomerId,
        billingType,
        value: amount,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        description: topup_id ? "Recarga de carteira" : "Pagamento de corrida",
      };

      if (driver_wallet_id) {
        paymentBody.split = [{ walletId: driver_wallet_id, fixedValue: driverAmount }];
      }

      console.log("Calling Asaas API:", JSON.stringify(paymentBody));

      const asaasRes = await fetch(`${ASAAS_BASE}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", access_token: ASAAS_API_KEY },
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

      if (billingType === "PIX" && asaasData.id) {
        const pixRes = await fetch(`${ASAAS_BASE}/payments/${asaasData.id}/pixQrCode`, {
          headers: { access_token: ASAAS_API_KEY },
        });
        const pixData = await pixRes.json();
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
    }

    return new Response(
      JSON.stringify({ error: `Ação '${action}' não suportada. Use 'create_customer' ou 'create_payment'.` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("asaas-payment error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
