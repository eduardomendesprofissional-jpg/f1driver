-- Add dispatched_at to track when current driver was assigned
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS dispatched_at timestamptz DEFAULT now();

-- Function to auto-redispatch if driver hasn't accepted within timeout
CREATE OR REPLACE FUNCTION public.check_and_redispatch(p_ride_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_ride RECORD;
  v_driver_id uuid;
BEGIN
  SELECT * INTO v_ride FROM public.rides WHERE id = p_ride_id AND status = 'solicitada';
  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  -- Check if current driver has had the ride for more than 15 seconds
  IF v_ride.dispatched_at IS NOT NULL AND v_ride.dispatched_at < (now() - interval '15 seconds') THEN
    -- Find next nearest driver
    v_driver_id := public.find_nearest_driver(
      v_ride.origem_lat, 
      v_ride.origem_lng, 
      COALESCE(v_ride.motorista_tentativas, '{}')
    );

    IF v_driver_id IS NULL THEN
      RETURN 'no_drivers';
    END IF;

    UPDATE public.rides 
    SET 
      motorista_id = v_driver_id,
      motorista_tentativas = array_append(COALESCE(motorista_tentativas, '{}'), v_driver_id),
      dispatched_at = now()
    WHERE id = p_ride_id AND status = 'solicitada';

    RETURN 'redispatched';
  END IF;

  RETURN 'waiting';
END;
$$;

-- Also update dispatch_ride to set dispatched_at
CREATE OR REPLACE FUNCTION public.dispatch_ride(p_ride_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    motorista_tentativas = array_append(COALESCE(motorista_tentativas, '{}'), v_driver_id),
    dispatched_at = now()
  WHERE id = p_ride_id;

  RETURN v_driver_id;
END;
$$;