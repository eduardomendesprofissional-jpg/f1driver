ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tem_perfil_passageiro boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tem_perfil_motorista boolean NOT NULL DEFAULT false;

UPDATE public.profiles SET tem_perfil_passageiro = true WHERE tipo = 'passageiro';
UPDATE public.profiles SET tem_perfil_motorista = true WHERE tipo = 'motorista';