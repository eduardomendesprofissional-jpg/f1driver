
ALTER TABLE public.rides 
  ADD COLUMN IF NOT EXISTS motivo_cancelamento text,
  ADD COLUMN IF NOT EXISTS cancelado_por text;
