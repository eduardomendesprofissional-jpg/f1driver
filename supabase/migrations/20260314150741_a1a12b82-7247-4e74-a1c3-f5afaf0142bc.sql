ALTER TABLE public.profiles DROP CONSTRAINT profiles_tipo_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tipo_check CHECK (tipo IN ('passageiro', 'motorista', 'admin'));