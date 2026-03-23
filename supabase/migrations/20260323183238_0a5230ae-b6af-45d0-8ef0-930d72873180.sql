ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS asaas_customer_id text,
  ADD COLUMN IF NOT EXISTS asaas_wallet_id text,
  ADD COLUMN IF NOT EXISTS credit_card_token text;