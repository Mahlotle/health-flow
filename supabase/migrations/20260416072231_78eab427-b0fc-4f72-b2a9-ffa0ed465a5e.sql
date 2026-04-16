
-- Drop old cancel policy and create updated one
DROP POLICY IF EXISTS "Patients can cancel their own appointments" ON public.appointments;

CREATE POLICY "Patients can cancel their own appointments"
ON public.appointments FOR UPDATE
USING (auth.uid() = patient_id AND status IN ('pending', 'pending_approval'));
