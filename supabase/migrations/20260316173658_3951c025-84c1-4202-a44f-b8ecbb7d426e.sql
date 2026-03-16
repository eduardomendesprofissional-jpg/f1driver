
ALTER TABLE public.precificacao
  ADD COLUMN IF NOT EXISTS dias_semana integer[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}';
-- 0=Domingo, 1=Segunda ... 6=Sábado
