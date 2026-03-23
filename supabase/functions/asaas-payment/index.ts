import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_BASE = "https://www.asaas.com/api/v3";

// ─── HELPERS ───

function validateCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // all same digit
  // Validate check digits
  for (let t = 9; t < 11; t++) {
    let sum = 0;
    for (let i = 0; i < t; i++) {
      sum += parseInt(digits[i]) * (t + 1 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(digits[t])) return false;
  }
  return true;
}

function validateCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  return digits.length === 14;
}

function isValidCpfCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 ? validateCpf(value) : digits.length === 14 ? validateCnpj(value) : false;
}

function jsonRes(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── ASAAS HELPERS ───

async function findExistingAsaasCustomer(cpfCnpj: string, apiKey: string): Promise<string | null> {
  const res = await fetch(`${ASAAS_BASE}/customers?cpfCnpj=${cpfCnpj}`, {
    headers: { access_token: apiKey },
  });
  const data = await res.json();
  if (res.ok && data.data?.length > 0) {
    return data.data[0].id; // Return first matching customer
  }
  return null;
}

async function createAsaasCustomer(
  name: string,
  cpfCnpj: string,
  email: string | null,
  apiKey: string
): Promise<{ id: string | null; error: string | null }> {
  const cleanCpf = cpfCnpj.replace(/\D/g, "");

  // First try to find existing customer with this CPF/CNPJ
  const existingId = await findExistingAsaasCustomer(cleanCpf, apiKey);
  if (existingId) {
    console.log(`Found existing Asaas customer: ${existingId} for CPF ${cleanCpf}`);
    return { id: existingId, error: null };
  }

  // Create new customer
  const body: Record<string, string> = { name, cpfCnpj: cleanCpf };
  if (email) body.email = email;

  const res = await fetch(`${ASAAS_BASE}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", access_token: apiKey },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log("Asaas create customer response:", JSON.stringify(data));

  if (!res.ok) {
    // Handle duplicate error — try to find existing
    const errDesc = data.errors?.[0]?.description || "";
    if (errDesc.toLowerCase().includes("já existe") || errDesc.toLowerCase().includes("already") || res.status === 409) {
      const fallbackId = await findExistingAsaasCustomer(cleanCpf, apiKey);
      if (fallbackId) return { id: fallbackId, error: null };
    }
    return { id: null, error: errDesc || "Erro ao criar cliente no Asaas" };
  }

  return { id: data.id, error: null };
}

// ─── MAIN ───

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
    console.log("asaas-payment action:", action, JSON.stringify(body));

    // ════════════════════════════════════════════════════
    // ACTION: sync — Create/find Asaas customer and save to profiles
    // Called from DB trigger or frontend hook
    // ════════════════════════════════════════════════════
    if (action === "sync" || action === "create_customer") {
      const { user_id, name, cpf_cnpj, email } = body;

      if (!user_id) return jsonRes({ error: "Campo 'user_id' é obrigatório." }, 400);

      // If name/cpf not provided, fetch from DB
      let resolvedName = name;
      let resolvedCpf = cpf_cnpj;
      let resolvedEmail = email;

      if (!resolvedName || !resolvedCpf) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("nome, cpf, asaas_customer_id")
          .eq("id", user_id)
          .single();

        if (!profile) return jsonRes({ error: "Perfil não encontrado." }, 404);

        // Already synced? Return existing ID
        if (profile.asaas_customer_id?.startsWith("cus_")) {
          return jsonRes({ success: true, asaas_customer_id: profile.asaas_customer_id });
        }

        resolvedName = resolvedName || profile.nome;
        resolvedCpf = resolvedCpf || profile.cpf;
      }

      if (!resolvedName || !resolvedCpf) {
        return jsonRes({ error: "Nome e CPF são obrigatórios. Preencha o perfil." }, 400);
      }

      // Validate CPF/CNPJ
      if (!isValidCpfCnpj(resolvedCpf)) {
        return jsonRes({ error: "CPF/CNPJ inválido. Verifique os dados do perfil." }, 400);
      }

      // Get email from auth.users if not provided
      if (!resolvedEmail) {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user_id);
        resolvedEmail = authUser?.user?.email || null;
      }

      // Create or find customer in Asaas
      const result = await createAsaasCustomer(resolvedName, resolvedCpf, resolvedEmail, ASAAS_API_KEY);

      if (!result.id) {
        return jsonRes({ error: result.error || "Erro ao sincronizar com Asaas." }, 422);
      }

      // Save to profiles
      const { error: updateErr } = await supabaseAdmin
        .from("profiles")
        .update({ asaas_customer_id: result.id })
        .eq("id", user_id);

      if (updateErr) {
        console.error("Error saving asaas_customer_id:", updateErr.message);
        return jsonRes(
          { error: "Cliente criado no Asaas mas falha ao salvar no banco.", asaas_customer_id: result.id },
          500
        );
      }

      console.log(`Synced user ${user_id} → Asaas customer ${result.id}`);
      return jsonRes({ success: true, asaas_customer_id: result.id });
    }

    // ════════════════════════════════════════════════════
    // ACTION: pay — Create payment, resolving all data server-side
    // Accepts: ride_id OR (user_id + amount + topup_id)
    // ════════════════════════════════════════════════════
    if (action === "pay" || action === "create_payment") {
      const { ride_id, user_id, amount, billing_type, topup_id, customer_id, driver_wallet_id } = body;
      const billingType = (billing_type || "PIX").toUpperCase();

      let resolvedAmount = amount;
      let resolvedCustomerId = customer_id;
      let resolvedDriverWalletId = driver_wallet_id || "";
      let resolvedPassengerId = user_id;
      let description = topup_id ? "Recarga de carteira" : "Pagamento de corrida";

      // ── If ride_id provided, resolve everything from the ride ──
      if (ride_id) {
        const { data: ride } = await supabaseAdmin
          .from("rides")
          .select("passageiro_id, motorista_id, valor, valor_final, forma_pagamento")
          .eq("id", ride_id)
          .single();

        if (!ride) return jsonRes({ error: "Corrida não encontrada." }, 404);

        resolvedAmount = resolvedAmount || Number(ride.valor_final || ride.valor || 0);
        resolvedPassengerId = ride.passageiro_id;

        // Get passenger's asaas_customer_id
        const { data: passengerProfile } = await supabaseAdmin
          .from("profiles")
          .select("asaas_customer_id")
          .eq("id", ride.passageiro_id)
          .single();

        resolvedCustomerId = passengerProfile?.asaas_customer_id;

        // Get driver's asaas_wallet_id for split
        if (ride.motorista_id) {
          const { data: driverProfile } = await supabaseAdmin
            .from("profiles")
            .select("asaas_wallet_id")
            .eq("id", ride.motorista_id)
            .single();
          resolvedDriverWalletId = driverProfile?.asaas_wallet_id || "";
        }
      }

      // ── If still no customer_id, try resolving from user_id ──
      if (!resolvedCustomerId && resolvedPassengerId) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("asaas_customer_id")
          .eq("id", resolvedPassengerId)
          .single();
        resolvedCustomerId = profile?.asaas_customer_id;
      }

      // ── Validate customer_id is real ──
      if (!resolvedCustomerId || !resolvedCustomerId.startsWith("cus_")) {
        return jsonRes(
          { error: "Erro: Perfil financeiro não sincronizado. Cadastre-se antes de pagar." },
          400
        );
      }

      if (!resolvedAmount || resolvedAmount <= 0) {
        return jsonRes({ error: "Valor inválido para pagamento." }, 400);
      }

      // Build payment body
      const paymentBody: Record<string, unknown> = {
        customer: resolvedCustomerId,
        billingType,
        value: resolvedAmount,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        description,
      };

      // Split: 80% driver, 20% platform
      if (resolvedDriverWalletId) {
        const driverAmount = Math.round(resolvedAmount * 0.8 * 100) / 100;
        paymentBody.split = [{ walletId: resolvedDriverWalletId, fixedValue: driverAmount }];
      }

      console.log("Creating Asaas payment:", JSON.stringify(paymentBody));

      const asaasRes = await fetch(`${ASAAS_BASE}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", access_token: ASAAS_API_KEY },
        body: JSON.stringify(paymentBody),
      });
      const asaasData = await asaasRes.json();
      console.log("Asaas payment response:", JSON.stringify(asaasData));

      if (!asaasRes.ok) {
        return jsonRes(
          { error: asaasData.errors?.[0]?.description || "Erro ao criar cobrança no Asaas", details: asaasData },
          asaasRes.status
        );
      }

      const response: Record<string, unknown> = {
        success: true,
        payment_id: asaasData.id,
        status: asaasData.status,
        invoice_url: asaasData.invoiceUrl,
        value: asaasData.value,
        net_value: asaasData.netValue,
        due_date: asaasData.dueDate,
        billing_type: billingType,
      };

      // Fetch PIX QR code
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

      // If ride_id, auto-update ride payment fields
      if (ride_id) {
        const isPaid = asaasData.status === "CONFIRMED" || asaasData.status === "RECEIVED";
        await supabaseAdmin.from("rides").update({
          payment_intent_id: asaasData.payment_id || asaasData.id,
          payment_status: isPaid ? "paid" : "pending",
        }).eq("id", ride_id);
      }

      return jsonRes(response as Record<string, unknown>);
    }

    return jsonRes(
      { error: `Ação '${action}' não suportada. Use 'sync' ou 'pay'.` },
      400
    );
  } catch (err) {
    console.error("asaas-payment error:", err.message);
    return jsonRes({ error: err.message }, 500);
  }
});
