
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Function that calls asaas-payment edge function to create customer
CREATE OR REPLACE FUNCTION public.sync_profile_to_asaas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_supabase_url text;
  v_service_key text;
  v_payload jsonb;
  v_email text;
BEGIN
  -- Only proceed if nome and cpf are set AND asaas_customer_id is still null
  IF NEW.nome IS NULL OR NEW.nome = '' OR NEW.cpf IS NULL OR NEW.cpf = '' THEN
    RETURN NEW;
  END IF;

  IF NEW.asaas_customer_id IS NOT NULL AND NEW.asaas_customer_id != '' THEN
    RETURN NEW;
  END IF;

  -- Get Supabase URL and service role key from vault/settings
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  v_service_key := current_setting('app.settings.service_role_key', true);

  -- Fallback: try to get from secrets
  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    SELECT decrypted_secret INTO v_supabase_url
    FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
  END IF;

  IF v_service_key IS NULL OR v_service_key = '' THEN
    SELECT decrypted_secret INTO v_service_key
    FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;
  END IF;

  -- Get user email from auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;

  v_payload := jsonb_build_object(
    'action', 'create_customer',
    'user_id', NEW.id,
    'name', NEW.nome,
    'cpf_cnpj', NEW.cpf,
    'email', COALESCE(v_email, '')
  );

  -- Fire async HTTP POST via pg_net
  PERFORM extensions.http_post(
    url := v_supabase_url || '/functions/v1/asaas-payment',
    body := v_payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    )
  );

  RETURN NEW;
END;
$$;

-- Trigger on INSERT (new user) and UPDATE (when cpf/nome are filled later)
CREATE TRIGGER sync_to_asaas
  AFTER INSERT OR UPDATE OF nome, cpf ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_to_asaas();
