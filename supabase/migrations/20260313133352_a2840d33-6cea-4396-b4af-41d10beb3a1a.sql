
-- Coverage cities table
CREATE TABLE public.cidades_cobertura (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  uf varchar NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(nome, uf)
);

ALTER TABLE public.cidades_cobertura ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cidades cobertura visíveis para todos" ON public.cidades_cobertura
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Cidades cobertura inserir" ON public.cidades_cobertura
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Cidades cobertura deletar" ON public.cidades_cobertura
  FOR DELETE TO anon, authenticated USING (true);

-- Pricing table
CREATE TABLE public.precificacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade_id uuid REFERENCES public.cidades_cobertura(id) ON DELETE CASCADE NOT NULL,
  categoria text NOT NULL DEFAULT 'Comum',
  preco_base numeric(10,2) NOT NULL DEFAULT 5.00,
  preco_km numeric(10,2) NOT NULL DEFAULT 2.00,
  preco_minuto numeric(10,2) NOT NULL DEFAULT 0.50,
  taxa_minima numeric(10,2) NOT NULL DEFAULT 8.00,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(cidade_id, categoria)
);

ALTER TABLE public.precificacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Precificacao visível para todos" ON public.precificacao
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Precificacao inserir" ON public.precificacao
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Precificacao atualizar" ON public.precificacao
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Precificacao deletar" ON public.precificacao
  FOR DELETE TO anon, authenticated USING (true);
