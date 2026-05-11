-- Allow drivers to operate with negative balance up to -30
CREATE OR REPLACE FUNCTION public.check_driver_balance_block()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.driver_balance <= -30 THEN
    NEW.is_blocked := true;
  ELSE
    NEW.is_blocked := false;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.find_nearest_driver(p_lat double precision, p_lng double precision, p_exclude uuid[] DEFAULT '{}'::uuid[])
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT dl.driver_id
  FROM public.driver_locations dl
  INNER JOIN public.profiles p ON p.id = dl.driver_id
  WHERE dl.online = true
    AND dl.driver_id != ALL(p_exclude)
    AND p.is_blocked = false
    AND p.driver_balance > -30
    AND ((dl.lat - p_lat) * (dl.lat - p_lat) + (dl.lng - p_lng) * (dl.lng - p_lng)) < 0.002025
  ORDER BY 
    (dl.lat - p_lat) * (dl.lat - p_lat) + (dl.lng - p_lng) * (dl.lng - p_lng)
  LIMIT 1;
$function$;

-- Recalculate is_blocked for all existing drivers
UPDATE public.profiles
SET driver_balance = driver_balance
WHERE tipo = 'motorista';