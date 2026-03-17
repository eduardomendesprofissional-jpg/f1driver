
-- Add destination mode columns to driver_locations
ALTER TABLE public.driver_locations ADD COLUMN IF NOT EXISTS destino_modo_ativo BOOLEAN DEFAULT false;
ALTER TABLE public.driver_locations ADD COLUMN IF NOT EXISTS destino_lat DOUBLE PRECISION;
ALTER TABLE public.driver_locations ADD COLUMN IF NOT EXISTS destino_lng DOUBLE PRECISION;
ALTER TABLE public.driver_locations ADD COLUMN IF NOT EXISTS destino_endereco TEXT;

-- Split payment table
CREATE TABLE public.ride_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  convidado_email TEXT NOT NULL,
  convidado_user_id UUID,
  percentual NUMERIC NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ride_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ride participants can view splits"
  ON public.ride_splits FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_splits.ride_id
        AND (rides.passageiro_id = auth.uid() OR auth.uid() = ride_splits.convidado_user_id)
    )
  );

CREATE POLICY "Passenger can create splits"
  ON public.ride_splits FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_splits.ride_id AND rides.passageiro_id = auth.uid()
    )
  );

CREATE POLICY "Invited user can update split status"
  ON public.ride_splits FOR UPDATE TO authenticated
  USING (auth.uid() = convidado_user_id);

-- Corporate vouchers table
CREATE TABLE public.vouchers_corporativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_nome TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  valor_limite NUMERIC NOT NULL DEFAULT 100,
  valor_usado NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  validade DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vouchers_corporativos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active vouchers"
  ON public.vouchers_corporativos FOR SELECT TO authenticated
  USING (ativo = true);

CREATE POLICY "Admins can manage vouchers"
  ON public.vouchers_corporativos FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Voucher usage table
CREATE TABLE public.voucher_usos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES public.vouchers_corporativos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  valor NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.voucher_usos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own voucher usage"
  ON public.voucher_usos FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "User can create voucher usage"
  ON public.voucher_usos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Selfie verification table
CREATE TABLE public.verificacao_selfie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
  foto_url TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  solicitado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  respondido_em TIMESTAMP WITH TIME ZONE,
  resultado TEXT
);

ALTER TABLE public.verificacao_selfie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver can view own verifications"
  ON public.verificacao_selfie FOR SELECT TO authenticated
  USING (auth.uid() = driver_id);

CREATE POLICY "Driver can insert own verification"
  ON public.verificacao_selfie FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Driver can update own verification"
  ON public.verificacao_selfie FOR UPDATE TO authenticated
  USING (auth.uid() = driver_id);
