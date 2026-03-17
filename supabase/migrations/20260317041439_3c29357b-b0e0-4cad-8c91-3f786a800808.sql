
ALTER TABLE public.rides 
  ADD COLUMN IF NOT EXISTS taxa_noshow numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS km_real numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duracao_real_min numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_final numeric;
