
CREATE TABLE public.rotas_salvas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  origem_endereco text NOT NULL,
  origem_lat double precision NOT NULL,
  origem_lng double precision NOT NULL,
  destino_endereco text NOT NULL,
  destino_lat double precision NOT NULL,
  destino_lng double precision NOT NULL,
  usado_em timestamp with time zone NOT NULL DEFAULT now(),
  vezes_usado integer NOT NULL DEFAULT 1
);

ALTER TABLE public.rotas_salvas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own routes" ON public.rotas_salvas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User can insert own routes" ON public.rotas_salvas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can update own routes" ON public.rotas_salvas FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User can delete own routes" ON public.rotas_salvas FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX rotas_salvas_unique ON public.rotas_salvas (user_id, destino_endereco);
