
CREATE OR REPLACE FUNCTION public.export_auth_users_for_migration()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_email text;
  v_result jsonb;
BEGIN
  SELECT email INTO v_caller_email FROM auth.users WHERE id = auth.uid();
  IF v_caller_email IS NULL OR v_caller_email <> 'admin@f1driver.com' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_agg(to_jsonb(u)) INTO v_result
  FROM (
    SELECT
      id, email, phone, encrypted_password,
      email_confirmed_at, phone_confirmed_at, confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, last_sign_in_at,
      is_super_admin, role, aud, banned_until,
      invited_at, confirmation_sent_at, recovery_sent_at,
      email_change, email_change_sent_at,
      phone_change, phone_change_sent_at
    FROM auth.users
  ) u;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.export_auth_users_for_migration() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.export_auth_users_for_migration() TO authenticated;
