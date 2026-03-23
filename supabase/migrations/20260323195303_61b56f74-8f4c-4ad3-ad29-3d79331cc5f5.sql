
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
BEGIN
  -- Only proceed if nome and cpf are set AND asaas_customer_id is still null/invalid
  IF NEW.nome IS NULL OR NEW.nome = '' OR NEW.cpf IS NULL OR NEW.cpf = '' THEN
    RETURN NEW;
  END IF;

  IF NEW.asaas_customer_id IS NOT NULL AND NEW.asaas_customer_id LIKE 'cus_%' THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO v_supabase_url
  FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;

  SELECT decrypted_secret INTO v_service_key
  FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;

  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING 'sync_profile_to_asaas: missing SUPABASE_URL or SERVICE_ROLE_KEY secrets';
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'action', 'sync',
    'user_id', NEW.id
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
