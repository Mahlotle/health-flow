ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'pending_approval'::text, 'confirmed'::text, 'approved'::text, 'checked_in'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'rejected'::text, 'no_show'::text]));