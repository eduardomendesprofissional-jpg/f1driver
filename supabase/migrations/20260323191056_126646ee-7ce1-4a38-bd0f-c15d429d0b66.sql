
-- Allow drivers to see rides with broadcast_search=true (for nearby ride discovery)
CREATE POLICY "Motorista pode ver corridas em broadcast"
  ON public.rides
  FOR SELECT
  TO authenticated
  USING (broadcast_search = true AND status = 'solicitada');
