
CREATE TABLE public.driver_conquistas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  marco_key text NOT NULL,
  conquistado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (driver_id, marco_key)
);

ALTER TABLE public.driver_conquistas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver can view own achievements"
  ON public.driver_conquistas FOR SELECT
  TO authenticated
  USING (auth.uid() = driver_id);

CREATE POLICY "Driver can insert own achievements"
  ON public.driver_conquistas FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_id);
