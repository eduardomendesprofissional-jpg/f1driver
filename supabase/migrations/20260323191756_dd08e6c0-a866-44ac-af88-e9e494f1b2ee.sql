
-- Add type column to wallet_topups to distinguish passenger vs driver
ALTER TABLE public.wallet_topups ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'passenger';

-- Function to add driver balance
CREATE OR REPLACE FUNCTION public.add_driver_balance(p_user_id uuid, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET driver_balance = driver_balance + p_amount WHERE id = p_user_id;
END;
$$;
