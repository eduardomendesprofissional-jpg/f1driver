
-- Add broadcast_search column
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS broadcast_search boolean NOT NULL DEFAULT false;

-- Update find_nearest_driver to filter by 5km radius (~0.045 degrees lat/lng)
CREATE OR REPLACE FUNCTION public.find_nearest_driver(p_lat double precision, p_lng double precision, p_exclude uuid[] DEFAULT '{}'::uuid[])
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT driver_id
  FROM public.driver_locations
  WHERE online = true
    AND driver_id != ALL(p_exclude)
    AND ((lat - p_lat) * (lat - p_lat) + (lng - p_lng) * (lng - p_lng)) < 0.002025  -- ~5km radius squared
  ORDER BY 
    (lat - p_lat) * (lat - p_lat) + (lng - p_lng) * (lng - p_lng)
  LIMIT 1;
$$;

-- Trigger function: when payment_status changes to 'paid' on a 'waiting_payment' ride
CREATE OR REPLACE FUNCTION public.on_ride_payment_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_driver_id uuid;
BEGIN
  -- Only fire when payment_status transitions to 'paid' on a waiting_payment ride
  IF OLD.payment_status IS DISTINCT FROM 'paid'
     AND NEW.payment_status = 'paid'
     AND OLD.status = 'waiting_payment'
  THEN
    -- Update ride to solicitada + broadcast
    NEW.status := 'solicitada';
    NEW.broadcast_search := true;
    NEW.dispatched_at := now();

    -- Find and assign nearest driver within 5km
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

-- Create trigger on rides table
DROP TRIGGER IF EXISTS trigger_ride_payment_confirmed ON public.rides;
CREATE TRIGGER trigger_ride_payment_confirmed
  BEFORE UPDATE ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION public.on_ride_payment_confirmed();
