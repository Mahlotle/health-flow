-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function: expire past unfinished appointments
CREATE OR REPLACE FUNCTION public.expire_past_appointments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  expired RECORD;
BEGIN
  FOR expired IN
    SELECT id, clinic, department, appointment_date, time_slot, patient_id
    FROM public.appointments
    WHERE status IN ('pending_approval','pending','approved','confirmed','checked_in')
      AND (appointment_date::timestamp + COALESCE(NULLIF(time_slot,'')::time, '00:00'::time))
          < (now() - interval '1 hour')
  LOOP
    UPDATE public.appointments
       SET status = 'no_show', updated_at = now()
     WHERE id = expired.id;

    UPDATE public.doctor_availability
       SET is_booked = false, updated_at = now()
     WHERE clinic = expired.clinic
       AND department = expired.department
       AND available_date = expired.appointment_date
       AND time_slot = expired.time_slot;
  END LOOP;
END;
$$;

-- Unschedule prior job if it exists, then schedule fresh
DO $$
BEGIN
  PERFORM cron.unschedule('expire-past-appointments');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'expire-past-appointments',
  '*/15 * * * *',
  $$ SELECT public.expire_past_appointments(); $$
);