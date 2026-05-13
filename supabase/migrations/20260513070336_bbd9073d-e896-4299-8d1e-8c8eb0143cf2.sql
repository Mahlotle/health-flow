-- 1) Prevent duplicate slots and enable atomic claim
CREATE UNIQUE INDEX IF NOT EXISTS doctor_availability_unique_slot
  ON public.doctor_availability (clinic, department, available_date, time_slot);

-- 2) Update queue stats to exclude past appointments (past time slots today are no longer "in queue")
CREATE OR REPLACE FUNCTION public.get_queue_stats(_clinic text)
 RETURNS TABLE(department text, in_queue bigint, in_progress bigint, completed bigint, avg_wait numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    department,
    COUNT(*) FILTER (
      WHERE status IN ('approved','confirmed','checked_in','pending')
        AND (appointment_date::timestamp + COALESCE(NULLIF(time_slot,'')::time, '00:00'::time)) >= (now() - interval '30 minutes')
    )::bigint AS in_queue,
    COUNT(*) FILTER (WHERE status = 'in_progress')::bigint AS in_progress,
    COUNT(*) FILTER (WHERE status = 'completed' AND appointment_date = CURRENT_DATE)::bigint AS completed,
    COALESCE(AVG(estimated_wait_min) FILTER (
      WHERE status IN ('approved','confirmed','checked_in','pending')
        AND (appointment_date::timestamp + COALESCE(NULLIF(time_slot,'')::time, '00:00'::time)) >= (now() - interval '30 minutes')
    ), 0) AS avg_wait
  FROM public.appointments
  WHERE clinic = _clinic
    AND appointment_date >= CURRENT_DATE
  GROUP BY department;
$function$;

-- 3) Atomic slot claim function: only succeeds if the slot is currently free.
CREATE OR REPLACE FUNCTION public.claim_appointment_slot(
  _clinic text,
  _department text,
  _appointment_date date,
  _time_slot text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_appt_id uuid;
  v_updated int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Atomically claim the slot
  UPDATE public.doctor_availability
     SET is_booked = true, updated_at = now()
   WHERE clinic = _clinic
     AND department = _department
     AND available_date = _appointment_date
     AND time_slot = _time_slot
     AND is_booked = false;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RAISE EXCEPTION 'This time slot is no longer available. Please pick another time.';
  END IF;

  INSERT INTO public.appointments (
    patient_id, clinic, department, appointment_date, time_slot, status
  ) VALUES (
    auth.uid(), _clinic, _department, _appointment_date, _time_slot, 'pending_approval'
  ) RETURNING id INTO v_appt_id;

  RETURN v_appt_id;
END;
$$;