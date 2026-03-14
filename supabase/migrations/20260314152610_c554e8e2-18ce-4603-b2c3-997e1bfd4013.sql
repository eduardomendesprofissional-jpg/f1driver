
-- Tabela de corridas
CREATE TABLE public.rides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  passageiro_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motorista_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  origem_endereco TEXT NOT NULL,
  origem_lat DOUBLE PRECISION NOT NULL,
  origem_lng DOUBLE PRECISION NOT NULL,
  destino_endereco TEXT NOT NULL,
  destino_lat DOUBLE PRECISION NOT NULL,
  destino_lng DOUBLE PRECISION NOT NULL,
  distancia_km NUMERIC DEFAULT 0,
  duracao_min NUMERIC DEFAULT 0,
  valor NUMERIC DEFAULT 0,
  forma_pagamento TEXT NOT NULL DEFAULT 'pix',
  status TEXT NOT NULL DEFAULT 'solicitada',
  categoria TEXT NOT NULL DEFAULT 'Comum',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  aceita_em TIMESTAMP WITH TIME ZONE,
  iniciada_em TIMESTAMP WITH TIME ZONE,
  finalizada_em TIMESTAMP WITH TIME ZONE,
  cancelada_em TIMESTAMP WITH TIME ZONE
);

-- Tabela de avaliações
CREATE TABLE public.ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  avaliador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avaliado_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS rides
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Passageiro pode ver suas corridas"
  ON public.rides FOR SELECT TO authenticated
  USING (auth.uid() = passageiro_id OR auth.uid() = motorista_id);

CREATE POLICY "Passageiro pode solicitar corrida"
  ON public.rides FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = passageiro_id);

CREATE POLICY "Participante pode atualizar corrida"
  ON public.rides FOR UPDATE TO authenticated
  USING (auth.uid() = passageiro_id OR auth.uid() = motorista_id);

-- RLS ratings
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário pode ver avaliações relacionadas"
  ON public.ratings FOR SELECT TO authenticated
  USING (auth.uid() = avaliador_id OR auth.uid() = avaliado_id);

CREATE POLICY "Usuário pode criar avaliação"
  ON public.ratings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = avaliador_id);

-- Realtime para corridas
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
