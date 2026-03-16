
-- Table for driver bank accounts
CREATE TABLE public.contas_bancarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  banco text NOT NULL,
  agencia text NOT NULL,
  conta text NOT NULL,
  tipo_conta text NOT NULL DEFAULT 'corrente',
  titular text NOT NULL,
  cpf_titular text NOT NULL,
  chave_pix text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own bank accounts" ON public.contas_bancarias FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User can insert own bank accounts" ON public.contas_bancarias FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can update own bank accounts" ON public.contas_bancarias FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User can delete own bank accounts" ON public.contas_bancarias FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Table for driver withdrawals
CREATE TABLE public.saques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  valor numeric NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  conta_bancaria_id uuid REFERENCES public.contas_bancarias(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  processado_em timestamptz
);

ALTER TABLE public.saques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own withdrawals" ON public.saques FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User can request withdrawals" ON public.saques FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
