// One-off: export auth.users + identities for migration to another Supabase project.
// Requires the caller to be the admin (admin@f1driver.com) to avoid leaking password hashes.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user || userData.user.email !== "admin@f1driver.com") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(url, serviceKey);

    // Page through all auth users (admin API doesn't return password hashes — we need raw SQL)
    // Use the service_role's direct REST access to auth.users via PostgREST? auth schema isn't exposed.
    // Instead: use Postgres REST via rpc, or use the raw db via fetch. Easiest: a SQL RPC.
    // We'll call a custom function added in a migration.
    const { data, error } = await admin.rpc("export_auth_users_for_migration");
    if (error) throw error;

    return new Response(JSON.stringify({ users: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
