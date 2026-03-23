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
  if (/^(\d)\1{10}$/.test(digits)) return false;
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

function isValidCpfCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return validateCpf(value);
  if (digits.length === 14) return true; // CNPJ basic length check
  return false;
}

function jsonRes(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─── ASAAS CUSTOMER HELPERS ───

async function findExistingAsaasCustomer(cpfCnpj: string, apiKey: string): Promise<string | null> {
  const res = await fetch(`${ASAAS_BASE}/customers?cpfCnpj=${cpfCnpj}`, {
    headers: { access_token: apiKey },
  });
  const data = await res.json();
  if (res.ok && data.data?.length > 0) return data.data[0].id;
  return null;
}

async function ensureAsaasCustomer(
  name: string,
  cpfCnpj: string,
  email: string | null,
  apiKey: string
): Promise<{ id: string | null; error: string | null }> {
  const cleanCpf = cpfCnpj.replace(/\D/g, "");

  // Try to find existing customer first
  const existingId = await findExistingAsaasCustomer(cleanCpf, apiKey);
  if (existingId) {
    console.log(`Found existing Asaas customer: ${existingId}`);
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
    const errDesc = data.errors?.[0]?.description || "";
    // Handle duplicate — try to find existing
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // Service Role — resolve tudo server-side
    );

    const body = await req.json();
    // Support both formats: { action, ... } and { rideId, amount, paymentMethod }
    let action = body.action;
    if (!action && body.rideId) {
      action = "pay"; // Simplified frontend format
    }
    console.log("asaas-payment action:", action, JSON.stringify(body));

    // ════════════════════════════════════════════════════
    // ACTION: sync — Create/find Asaas customer for a user
    // ════════════════════════════════════════════════════
    if (action === "sync" || action === "create_customer") {
      const { user_id } = body;
      if (!user_id) return jsonRes({ error: "Campo 'user_id' é obrigatório." }, 400);

      // Fetch profile data server-side
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome, cpf, asaas_customer_id")
        .eq("id", user_id)
        .single();

      if (!profile) return jsonRes({ error: "Perfil não encontrado." }, 404);

      // Already synced?
      if (profile.asaas_customer_id?.startsWith("cus_")) {
        return jsonRes({ success: true, asaas_customer_id: profile.asaas_customer_id });
      }

      if (!profile.nome || !profile.cpf) {
        return jsonRes({ error: "Nome e CPF são obrigatórios. Preencha o perfil." }, 400);
      }

      if (!isValidCpfCnpj(profile.cpf)) {
        return jsonRes({ error: "CPF/CNPJ inválido. Verifique os dados do perfil." }, 400);
      }

      // Get email from auth.users
      const { data: authUser } = await supabase.auth.admin.getUserById(user_id);
      const email = authUser?.user?.email || null;

      // Create or find customer in Asaas
      const result = await ensureAsaasCustomer(profile.nome, profile.cpf, email, ASAAS_API_KEY);

      if (!result.id) {
        return jsonRes({ error: result.error || "Erro ao sincronizar com Asaas." }, 422);
      }

      // Save to profiles
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ asaas_customer_id: result.id })
        .eq("id", user_id);

      if (updateErr) {
        console.error("Error saving asaas_customer_id:", updateErr.message);
        return jsonRes({ error: "Cliente criado mas falha ao salvar no banco.", asaas_customer_id: result.id }, 500);
      }

      console.log(`Synced user ${user_id} → Asaas customer ${result.id}`);
      return jsonRes({ success: true, asaas_customer_id: result.id });
    }

    // ════════════════════════════════════════════════════
    // ACTION: pay — Create payment resolving ALL data server-side
    // Accepts: ride_id (required)
    // ════════════════════════════════════════════════════
    if (action === "pay" || action === "create_payment") {
      // Accept both formats: { ride_id, billing_type } and { rideId, paymentMethod }
      const ride_id = body.ride_id || body.rideId;
      const billing_type = body.billing_type || body.paymentMethod;

      if (!ride_id) return jsonRes({ error: "ride_id é obrigatório." }, 400);

      // 1. Fetch ride data
      const { data: ride, error: rideError } = await supabase
        .from("rides")
        .select("passageiro_id, motorista_id, valor, valor_final, forma_pagamento")
        .eq("id", ride_id)
        .single();

      if (rideError || !ride) return jsonRes({ error: "Corrida não encontrada." }, 404);

      const amount = Number(ride.valor_final || ride.valor || 0);
      if (amount <= 0) return jsonRes({ error: "Valor inválido para pagamento." }, 400);

      // 2. Fetch passenger's asaas_customer_id from DB (server-side, no test IDs)
      const { data: passenger } = await supabase
        .from("profiles")
        .select("asaas_customer_id")
        .eq("id", ride.passageiro_id)
        .single();

      if (!passenger?.asaas_customer_id?.startsWith("cus_")) {
        return jsonRes({ error: "Passageiro não sincronizado com Asaas. Aguarde a sincronização do perfil." }, 400);
      }

      // 3. Fetch driver's asaas_wallet_id for split
      let driverWalletId = "";
      if (ride.motorista_id) {
        const { data: driver } = await supabase
          .from("profiles")
          .select("asaas_wallet_id")
          .eq("id", ride.motorista_id)
          .single();
        driverWalletId = driver?.asaas_wallet_id || "";
      }

      // 4. Determine billing type
      const billingType = (billing_type || ride.forma_pagamento || "pix").toUpperCase() === "PIX" ? "PIX" : "CREDIT_CARD";

      // 5. Build payment
      const paymentBody: Record<string, unknown> = {
        customer: passenger.asaas_customer_id,
        billingType,
        value: amount,
        dueDate: new Date().toISOString().split("T")[0], // Vencimento HOJE
        description: `Corrida #${ride_id}`,
      };

      // Split: 80% driver, 20% platform
      if (driverWalletId) {
        paymentBody.split = [{ walletId: driverWalletId, percentualValue: 80 }];
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

      // 6. Update ride payment fields
      const isPaid = asaasData.status === "CONFIRMED" || asaasData.status === "RECEIVED";
      await supabase.from("rides").update({
        payment_intent_id: asaasData.id,
        payment_status: isPaid ? "paid" : "pending",
      }).eq("id", ride_id);

      // 7. Build response
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

      // 8. If PIX, fetch QR Code
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

      return jsonRes(response);
    }

    return jsonRes({ error: `Ação '${action}' não suportada. Use 'sync' ou 'pay'.` }, 400);
  } catch (err) {
    console.error("asaas-payment error:", err.message);
    return jsonRes({ error: err.message }, 500);
  }
});
