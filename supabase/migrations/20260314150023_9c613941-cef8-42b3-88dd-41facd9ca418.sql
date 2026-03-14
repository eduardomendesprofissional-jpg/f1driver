
-- 1. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  telefone TEXT,
  avatar_url TEXT,
  tipo TEXT NOT NULL DEFAULT 'passageiro' CHECK (tipo IN ('passageiro', 'motorista')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 4. Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, tipo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'tipo', 'passageiro')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Tighten RLS on cidades_cobertura (remove anon write access)
DROP POLICY IF EXISTS "Cidades cobertura inserir" ON public.cidades_cobertura;
DROP POLICY IF EXISTS "Cidades cobertura deletar" ON public.cidades_cobertura;

CREATE POLICY "Cidades cobertura inserir" ON public.cidades_cobertura
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Cidades cobertura deletar" ON public.cidades_cobertura
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Cidades cobertura atualizar" ON public.cidades_cobertura
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 6. Tighten RLS on precificacao (remove anon write access)
DROP POLICY IF EXISTS "Precificacao inserir" ON public.precificacao;
DROP POLICY IF EXISTS "Precificacao atualizar" ON public.precificacao;
DROP POLICY IF EXISTS "Precificacao deletar" ON public.precificacao;

CREATE POLICY "Precificacao inserir" ON public.precificacao
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Precificacao atualizar" ON public.precificacao
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Precificacao deletar" ON public.precificacao
  FOR DELETE TO authenticated USING (true);
