
-- Table to track online drivers' real-time positions
CREATE TABLE public.driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL UNIQUE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  online boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- Drivers can manage their own location
CREATE POLICY "Driver can upsert own location"
ON public.driver_locations FOR ALL
TO authenticated
USING (auth.uid() = driver_id)
WITH CHECK (auth.uid() = driver_id);

-- Anyone authenticated can see online drivers (needed for dispatch)
CREATE POLICY "Authenticated can view online drivers"
ON public.driver_locations FOR SELECT
TO authenticated
USING (online = true);

-- Enable realtime for driver_locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;

-- Add ride dispatch columns to rides table
ALTER TABLE public.rides 
  ADD COLUMN IF NOT EXISTS motorista_tentativas uuid[] DEFAULT '{}';

-- Policy: allow motoristas to see rides offered to them (solicitada status)
CREATE POLICY "Motorista pode ver corridas solicitadas"
ON public.rides FOR SELECT
TO authenticated
USING (
  status = 'solicitada' AND auth.uid() = ANY(motorista_tentativas)
);

-- Function to find nearest online driver excluding already-tried ones
CREATE OR REPLACE FUNCTION public.find_nearest_driver(
  p_lat double precision,
  p_lng double precision,
  p_exclude uuid[] DEFAULT '{}'
)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT driver_id
  FROM public.driver_locations
  WHERE online = true
    AND driver_id != ALL(p_exclude)
  ORDER BY 
    (lat - p_lat) * (lat - p_lat) + (lng - p_lng) * (lng - p_lng)
  LIMIT 1;
$$;

-- Function to dispatch ride to nearest driver
CREATE OR REPLACE FUNCTION public.dispatch_ride(p_ride_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ride RECORD;
  v_driver_id uuid;
BEGIN
  SELECT * INTO v_ride FROM public.rides WHERE id = p_ride_id AND status = 'solicitada';
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_driver_id := public.find_nearest_driver(
    v_ride.origem_lat, 
    v_ride.origem_lng, 
    COALESCE(v_ride.motorista_tentativas, '{}')
  );

  IF v_driver_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.rides 
  SET 
    motorista_id = v_driver_id,
    motorista_tentativas = array_append(COALESCE(motorista_tentativas, '{}'), v_driver_id)
  WHERE id = p_ride_id;

  RETURN v_driver_id;
END;
$$;
