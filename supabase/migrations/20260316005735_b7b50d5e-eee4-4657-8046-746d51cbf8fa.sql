
-- Allow drivers assigned to envios to view and update them
CREATE POLICY "Driver can view assigned envios"
ON public.envios FOR SELECT
TO authenticated
USING (auth.uid() = motorista_id);

CREATE POLICY "Driver can update assigned envios"
ON public.envios FOR UPDATE
TO authenticated
USING (auth.uid() = motorista_id);

-- Allow drivers to view pending envios (unassigned)
CREATE POLICY "Driver can view pending envios"
ON public.envios FOR SELECT
TO authenticated
USING (status = 'pendente' AND motorista_id IS NULL);
