
-- Tabela com todas as cidades do Brasil
CREATE TABLE public.cidades_brasil (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  uf VARCHAR(2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_cidades_brasil_nome ON public.cidades_brasil USING btree (nome);
CREATE INDEX idx_cidades_brasil_uf ON public.cidades_brasil USING btree (uf);

ALTER TABLE public.cidades_brasil ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cidades são visíveis para todos autenticados"
  ON public.cidades_brasil FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir insert para seed"
  ON public.cidades_brasil FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Permitir delete para gestão"
  ON public.cidades_brasil FOR DELETE TO authenticated USING (true);
