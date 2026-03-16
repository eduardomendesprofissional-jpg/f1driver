ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS cnh text,
  ADD COLUMN IF NOT EXISTS veiculo_placa text,
  ADD COLUMN IF NOT EXISTS veiculo_modelo text,
  ADD COLUMN IF NOT EXISTS veiculo_cor text;