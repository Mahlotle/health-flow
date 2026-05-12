CREATE OR REPLACE FUNCTION public.get_queue_stats(_clinic text)
 RETURNS TABLE(department text, in_queue bigint, in_progress bigint, completed bigint, avg_wait numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    department,
    COUNT(*) FILTER (WHERE status IN ('approved','confirmed','checked_in','pending'))::bigint AS in_queue,
    COUNT(*) FILTER (WHERE status = 'in_progress')::bigint AS in_progress,
    COUNT(*) FILTER (WHERE status = 'completed' AND appointment_date = CURRENT_DATE)::bigint AS completed,
    COALESCE(AVG(estimated_wait_min) FILTER (WHERE status IN ('approved','confirmed','checked_in','pending')), 0) AS avg_wait
  FROM public.appointments
  WHERE clinic = _clinic
    AND appointment_date >= CURRENT_DATE
  GROUP BY department;
$function$;