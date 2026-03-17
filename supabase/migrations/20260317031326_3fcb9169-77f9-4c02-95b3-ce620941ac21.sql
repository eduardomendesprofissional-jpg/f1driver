
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS endereco text,
ADD COLUMN IF NOT EXISTS data_nascimento text,
ADD COLUMN IF NOT EXISTS onboarding_completo boolean NOT NULL DEFAULT false;
