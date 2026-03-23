CREATE OR REPLACE FUNCTION public.find_nearest_driver(p_lat double precision, p_lng double precision, p_exclude uuid[] DEFAULT '{}'::uuid[])
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT dl.driver_id
  FROM public.driver_locations dl
  INNER JOIN public.profiles p ON p.id = dl.driver_id
  WHERE dl.online = true
    AND dl.driver_id != ALL(p_exclude)
    AND p.is_blocked = false
    AND p.driver_balance >= -40
    AND ((dl.lat - p_lat) * (dl.lat - p_lat) + (dl.lng - p_lng) * (dl.lng - p_lng)) < 0.002025
  ORDER BY 
    (dl.lat - p_lat) * (dl.lat - p_lat) + (dl.lng - p_lng) * (dl.lng - p_lng)
  LIMIT 1;
$$;