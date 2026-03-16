
-- Notifications inbox table
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  tipo text NOT NULL DEFAULT 'geral',
  lida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own notifications" ON public.notificacoes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "User can update own notifications" ON public.notificacoes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications" ON public.notificacoes
  FOR INSERT TO authenticated WITH CHECK (true);

-- Referrals table
CREATE TABLE public.indicacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_email text NOT NULL,
  referred_user_id uuid,
  status text NOT NULL DEFAULT 'pendente',
  bonus_valor numeric NOT NULL DEFAULT 10.00,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.indicacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own referrals" ON public.indicacoes
  FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

CREATE POLICY "User can create referrals" ON public.indicacoes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = referrer_id);

-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS codigo_indicacao text UNIQUE;
