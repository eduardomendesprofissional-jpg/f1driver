
-- Allow anon users to read cities too
DROP POLICY "Cidades são visíveis para todos autenticados" ON public.cidades_brasil;

CREATE POLICY "Cidades são visíveis para todos"
  ON public.cidades_brasil FOR SELECT TO anon, authenticated USING (true);
