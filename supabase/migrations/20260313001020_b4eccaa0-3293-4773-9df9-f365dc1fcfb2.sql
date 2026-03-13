
-- Remove permissive policies
DROP POLICY "Permitir insert para seed" ON public.cidades_brasil;
DROP POLICY "Permitir delete para gestão" ON public.cidades_brasil;

-- Somente via service_role (edge functions) podem inserir/deletar
-- Não precisa de policy explícita pois service_role bypassa RLS
