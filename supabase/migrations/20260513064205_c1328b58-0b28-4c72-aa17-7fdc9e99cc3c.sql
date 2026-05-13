
-- RPC to cancel an appointment safely: patient owns it; frees availability; notifies
CREATE OR REPLACE FUNCTION public.cancel_appointment(_appt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appt public.appointments%ROWTYPE;
BEGIN
  SELECT * INTO appt FROM public.appointments WHERE id = _appt_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;
  IF appt.patient_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF appt.status NOT IN ('pending','pending_approval','confirmed') THEN
    RAISE EXCEPTION 'Cannot cancel appointment in status %', appt.status;
  END IF;

  UPDATE public.appointments SET status = 'cancelled', updated_at = now() WHERE id = _appt_id;

  UPDATE public.doctor_availability
    SET is_booked = false, updated_at = now()
    WHERE clinic = appt.clinic
      AND department = appt.department
      AND available_date = appt.appointment_date
      AND time_slot = appt.time_slot;

  IF appt.doctor_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_appointment_id)
    VALUES (
      appt.doctor_id,
      'Appointment Cancelled',
      'Patient cancelled appointment at ' || appt.clinic || ' (' || appt.department || ') on ' || appt.appointment_date || ' at ' || appt.time_slot || '.',
      'cancellation',
      _appt_id
    );
  END IF;
END;
$$;

-- Allow patients to cancel confirmed appointments via direct UPDATE as fallback
DROP POLICY IF EXISTS "Patients can cancel their own appointments" ON public.appointments;
CREATE POLICY "Patients can cancel their own appointments"
ON public.appointments FOR UPDATE
USING (auth.uid() = patient_id AND status IN ('pending','pending_approval','confirmed'));
