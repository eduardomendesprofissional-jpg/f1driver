
-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('comprovantes', 'comprovantes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for comprovantes bucket
CREATE POLICY "Users can upload own receipts" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'comprovantes' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view receipts" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'comprovantes');

-- Create extrato_creditos table
CREATE TABLE public.extrato_creditos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  valor numeric NOT NULL,
  url_comprovante text,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.extrato_creditos ENABLE ROW LEVEL SECURITY;

-- Driver can insert own records
CREATE POLICY "Driver can insert own credits" ON public.extrato_creditos
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = perfil_id);

-- Driver can view own records
CREATE POLICY "Driver can view own credits" ON public.extrato_creditos
FOR SELECT TO authenticated
USING (auth.uid() = perfil_id);

-- Admins can view all
CREATE POLICY "Admins can view all credits" ON public.extrato_creditos
FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can update status
CREATE POLICY "Admins can update credits" ON public.extrato_creditos
FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Function to recalculate driver balance from approved credits
CREATE OR REPLACE FUNCTION public.recalc_driver_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET driver_balance = COALESCE((
    SELECT SUM(valor) FROM public.extrato_creditos
    WHERE perfil_id = NEW.perfil_id AND status = 'aprovado'
  ), 0)
  WHERE id = NEW.perfil_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recalc_driver_balance
AFTER UPDATE OF status ON public.extrato_creditos
FOR EACH ROW
WHEN (NEW.status = 'aprovado')
EXECUTE FUNCTION public.recalc_driver_balance();
