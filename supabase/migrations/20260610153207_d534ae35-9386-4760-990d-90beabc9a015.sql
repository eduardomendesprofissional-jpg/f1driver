
CREATE OR REPLACE FUNCTION public.dump_auth_users_migration()
RETURNS SETOF auth.users
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$ SELECT * FROM auth.users; $$;

CREATE OR REPLACE FUNCTION public.dump_auth_identities_migration()
RETURNS SETOF auth.identities
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$ SELECT * FROM auth.identities; $$;

GRANT EXECUTE ON FUNCTION public.dump_auth_users_migration() TO sandbox_exec;
GRANT EXECUTE ON FUNCTION public.dump_auth_identities_migration() TO sandbox_exec;
