-- Add stripe_customer_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Add payment tracking columns to rides
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS payment_intent_id text;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS stripe_payment_method_id text;