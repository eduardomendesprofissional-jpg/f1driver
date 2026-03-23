
-- Table to track wallet top-ups
CREATE TABLE public.wallet_topups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  valor numeric NOT NULL,
  payment_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_topups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own topups" ON public.wallet_topups
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "User can insert own topups" ON public.wallet_topups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Security definer function to add balance (called by webhook)
CREATE OR REPLACE FUNCTION public.add_wallet_balance(p_user_id uuid, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET balance = balance + p_amount WHERE id = p_user_id;
END;
$$;

-- Security definer function to deduct balance (called from client for rides)
CREATE OR REPLACE FUNCTION public.deduct_wallet_balance(p_user_id uuid, p_amount numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance numeric;
BEGIN
  SELECT balance INTO current_balance FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF current_balance >= p_amount THEN
    UPDATE public.profiles SET balance = balance - p_amount WHERE id = p_user_id;
    RETURN true;
  END IF;
  RETURN false;
END;
$$;
