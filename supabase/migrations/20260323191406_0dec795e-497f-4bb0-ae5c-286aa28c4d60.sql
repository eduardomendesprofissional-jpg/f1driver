
-- Function to re-dispatch rides with expanded radius (10km) after 30 seconds
CREATE OR REPLACE FUNCTION public.redispatch_expanded_radius(p_ride_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ride RECORD;
  v_driver_id uuid;
BEGIN
  SELECT * INTO v_ride FROM public.rides
  WHERE id = p_ride_id AND status = 'solicitada' AND motorista_id IS NULL;
  
  IF NOT FOUND THEN
    RETURN 'not_found_or_already_assigned';
  END IF;

  -- Only re-dispatch if dispatched_at was more than 30 seconds ago
  IF v_ride.dispatched_at IS NULL OR v_ride.dispatched_at > (now() - interval '30 seconds') THEN
    RETURN 'waiting';
  END IF;

  -- Find driver within ~10km radius (0.0081 degrees² ≈ 10km²)
  SELECT driver_id INTO v_driver_id
  FROM public.driver_locations
  WHERE online = true
    AND driver_id != ALL(COALESCE(v_ride.motorista_tentativas, '{}'))
    AND ((lat - v_ride.origem_lat) * (lat - v_ride.origem_lat) + (lng - v_ride.origem_lng) * (lng - v_ride.origem_lng)) < 0.0081
  ORDER BY (lat - v_ride.origem_lat) * (lat - v_ride.origem_lat) + (lng - v_ride.origem_lng) * (lng - v_ride.origem_lng)
  LIMIT 1;

  IF v_driver_id IS NULL THEN
    RETURN 'no_drivers_10km';
  END IF;

  UPDATE public.rides
  SET motorista_id = v_driver_id,
      motorista_tentativas = array_append(COALESCE(motorista_tentativas, '{}'), v_driver_id),
      dispatched_at = now()
  WHERE id = p_ride_id;

  RETURN 'redispatched_10km';
END;
$$;

-- Update the main trigger to also handle re-dispatch on subsequent updates
CREATE OR REPLACE FUNCTION public.on_ride_payment_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_id uuid;
BEGIN
  -- Fire when payment_status transitions to 'paid' on a waiting_payment ride
  IF OLD.payment_status IS DISTINCT FROM 'paid'
     AND NEW.payment_status = 'paid'
     AND OLD.status = 'waiting_payment'
  THEN
    NEW.status := 'solicitada';
    NEW.broadcast_search := true;
    NEW.dispatched_at := now();

    -- Find nearest driver within 5km
    v_driver_id := public.find_nearest_driver(
      NEW.origem_lat,
      NEW.origem_lng,
      COALESCE(NEW.motorista_tentativas, '{}')
    );

    IF v_driver_id IS NOT NULL THEN
      NEW.motorista_id := v_driver_id;
      NEW.motorista_tentativas := array_append(COALESCE(NEW.motorista_tentativas, '{}'), v_driver_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
