CREATE TABLE public.administradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  foto_url text,
  funcao text NOT NULL DEFAULT 'admin',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admins"
  ON public.administradores FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can insert admins"
  ON public.administradores FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can update admins"
  ON public.administradores FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Admins can delete admins"
  ON public.administradores FOR DELETE
  TO authenticated USING (true);