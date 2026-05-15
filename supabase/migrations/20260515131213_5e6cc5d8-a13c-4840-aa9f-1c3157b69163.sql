ALTER TABLE public.rotas_salvas ADD COLUMN IF NOT EXISTS favorito boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_rotas_salvas_user_favorito ON public.rotas_salvas(user_id, favorito);