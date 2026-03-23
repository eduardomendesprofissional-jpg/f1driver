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
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ASAAS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    // Get user from JWT
    const authHeader = req.headers.get("Authorization");
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "", {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const {
      holder_name,
      card_number,
      expiry_month,
      expiry_year,
      cvv,
      holder_cpf,
      holder_email,
      holder_phone,
      postal_code,
      address_number,
    } = body;

    // Validate required fields
    if (!holder_name || !card_number || !expiry_month || !expiry_year || !cvv || !holder_cpf) {
      return new Response(
        JSON.stringify({ error: "Todos os campos obrigatórios devem ser preenchidos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get or create Asaas customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("asaas_customer_id, nome, telefone, cpf")
      .eq("id", user.id)
      .single();

    let asaasCustomerId = profile?.asaas_customer_id;

    if (!asaasCustomerId) {
      // Create customer in Asaas
      const customerRes = await fetch("https://www.asaas.com/api/v3/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          access_token: ASAAS_API_KEY,
        },
        body: JSON.stringify({
          name: profile?.nome || holder_name,
          cpfCnpj: profile?.cpf || holder_cpf,
          email: holder_email || user.email,
          phone: profile?.telefone || holder_phone,
        }),
      });
      const customerData = await customerRes.json();
      console.log("Asaas customer response:", JSON.stringify(customerData));

      if (!customerRes.ok) {
        return new Response(
          JSON.stringify({ error: customerData.errors?.[0]?.description || "Erro ao criar cliente no Asaas" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      asaasCustomerId = customerData.id;
      await supabase
        .from("profiles")
        .update({ asaas_customer_id: asaasCustomerId } as any)
        .eq("id", user.id);
    }

    // Tokenize card via Asaas
    const tokenizeRes = await fetch("https://www.asaas.com/api/v3/creditCard/tokenize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: ASAAS_API_KEY,
      },
      body: JSON.stringify({
        customer: asaasCustomerId,
        creditCard: {
          holderName: holder_name,
          number: card_number.replace(/\s/g, ""),
          expiryMonth: expiry_month,
          expiryYear: expiry_year,
          ccv: cvv,
        },
        creditCardHolderInfo: {
          name: holder_name,
          cpfCnpj: holder_cpf.replace(/\D/g, ""),
          email: holder_email || user.email || "",
          phone: (holder_phone || profile?.telefone || "").replace(/\D/g, ""),
          postalCode: (postal_code || "").replace(/\D/g, ""),
          addressNumber: address_number || "0",
        },
      }),
    });

    const tokenData = await tokenizeRes.json();
    console.log("Asaas tokenize response:", JSON.stringify({
      status: tokenizeRes.status,
      has_token: !!tokenData.creditCardToken,
      error: tokenData.errors,
    }));

    if (!tokenizeRes.ok || !tokenData.creditCardToken) {
      const errorMsg = tokenData.errors?.[0]?.description || "Erro ao tokenizar cartão";
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save ONLY the token and last 4 digits - NEVER raw card data
    const last4 = card_number.replace(/\s/g, "").slice(-4);
    const brand = detectBrand(card_number.replace(/\s/g, ""));

    await supabase
      .from("profiles")
      .update({ credit_card_token: tokenData.creditCardToken } as any)
      .eq("id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        credit_card_token: tokenData.creditCardToken,
        last4,
        brand,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("asaas-tokenize-card error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function detectBrand(number: string): string {
  if (/^4/.test(number)) return "visa";
  if (/^5[1-5]/.test(number)) return "mastercard";
  if (/^3[47]/.test(number)) return "amex";
  if (/^(636368|438935|504175|451416|636297|5067|4576|4011)/.test(number)) return "elo";
  if (/^(606282|3841)/.test(number)) return "hipercard";
  return "outro";
}
