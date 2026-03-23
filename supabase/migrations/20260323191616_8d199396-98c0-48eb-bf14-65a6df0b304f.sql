
-- Add driver_balance and is_blocked columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS driver_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false;

-- Trigger function to auto-block when driver_balance < -40
CREATE OR REPLACE FUNCTION public.check_driver_balance_block()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.driver_balance < -40 THEN
    NEW.is_blocked := true;
  ELSE
    NEW.is_blocked := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_check_driver_balance ON public.profiles;
CREATE TRIGGER trigger_check_driver_balance
  BEFORE UPDATE OF driver_balance ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_driver_balance_block();
