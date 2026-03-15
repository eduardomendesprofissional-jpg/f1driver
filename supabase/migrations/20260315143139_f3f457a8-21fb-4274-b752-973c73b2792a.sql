
-- Add cpf and verificacao_facial columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS cpf text,
  ADD COLUMN IF NOT EXISTS verificacao_facial boolean NOT NULL DEFAULT false;

-- Create payment methods table
CREATE TABLE public.metodos_pagamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'pix',
  label text NOT NULL,
  dados jsonb NOT NULL DEFAULT '{}',
  padrao boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.metodos_pagamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own payment methods" ON public.metodos_pagamento
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "User can insert own payment methods" ON public.metodos_pagamento
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update own payment methods" ON public.metodos_pagamento
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "User can delete own payment methods" ON public.metodos_pagamento
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
