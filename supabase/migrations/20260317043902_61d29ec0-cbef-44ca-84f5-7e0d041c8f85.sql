
-- Chat messages table for in-ride communication
CREATE TABLE public.ride_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ride_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ride participants can view messages"
  ON public.ride_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_messages.ride_id
        AND (rides.passageiro_id = auth.uid() OR rides.motorista_id = auth.uid())
    )
  );

CREATE POLICY "Ride participants can send messages"
  ON public.ride_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_messages.ride_id
        AND (rides.passageiro_id = auth.uid() OR rides.motorista_id = auth.uid())
    )
  );

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_messages;

-- Multiple stops table
CREATE TABLE public.ride_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  endereco TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  chegou_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ride_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ride participants can view stops"
  ON public.ride_stops FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_stops.ride_id
        AND (rides.passageiro_id = auth.uid() OR rides.motorista_id = auth.uid())
    )
  );

CREATE POLICY "Passenger can add stops"
  ON public.ride_stops FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rides
      WHERE rides.id = ride_stops.ride_id
        AND rides.passageiro_id = auth.uid()
    )
  );

-- Add gorjeta and agendada_para columns to rides
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS gorjeta NUMERIC DEFAULT 0;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS agendada_para TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS compartilhar_token TEXT;
