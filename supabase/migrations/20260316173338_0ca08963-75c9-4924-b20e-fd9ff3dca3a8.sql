
-- Add time-based pricing columns
ALTER TABLE public.precificacao
  ADD COLUMN IF NOT EXISTS hora_inicio time DEFAULT '00:00',
  ADD COLUMN IF NOT EXISTS hora_fim time DEFAULT '23:59',
  ADD COLUMN IF NOT EXISTS multiplicador numeric NOT NULL DEFAULT 1.0;

-- Update "Luxo" to "Carro Black" in existing data
UPDATE public.precificacao SET categoria = 'Carro Black' WHERE categoria = 'Luxo';

-- Update default value
ALTER TABLE public.precificacao ALTER COLUMN categoria SET DEFAULT 'Carro';
