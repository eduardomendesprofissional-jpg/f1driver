-- Deliveries table
CREATE TABLE public.envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  
  -- Package details
  descricao text NOT NULL,
  peso_kg numeric NOT NULL DEFAULT 1,
  tamanho text NOT NULL DEFAULT 'pequeno',
  
  -- Pickup address
  coleta_endereco text NOT NULL,
  coleta_lat double precision NOT NULL,
  coleta_lng double precision NOT NULL,
  
  -- Delivery address
  entrega_endereco text NOT NULL,
  entrega_lat double precision NOT NULL,
  entrega_lng double precision NOT NULL,
  
  -- Pricing & route
  distancia_km numeric,
  valor numeric,
  forma_pagamento text NOT NULL DEFAULT 'pix',
  
  -- Driver
  motorista_id uuid,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  coletado_em timestamptz,
  entregue_em timestamptz,
  cancelado_em timestamptz
);

ALTER TABLE public.envios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own deliveries" ON public.envios
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "User can create own deliveries" ON public.envios
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own deliveries" ON public.envios
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime for deliveries
ALTER PUBLICATION supabase_realtime ADD TABLE public.envios;