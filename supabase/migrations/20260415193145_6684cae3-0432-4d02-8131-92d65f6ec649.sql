
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'reminder',
  related_appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their own notifications as read"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow service role / triggers to insert
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to generate reminders for appointments within 24 hours
CREATE OR REPLACE FUNCTION public.create_appointment_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  appt RECORD;
BEGIN
  FOR appt IN
    SELECT a.id, a.patient_id, a.clinic, a.department, a.appointment_date, a.time_slot
    FROM public.appointments a
    WHERE a.status = 'pending'
      AND a.sms_sent = false
      AND (a.appointment_date::timestamp + a.time_slot::time) 
          BETWEEN now() AND now() + interval '24 hours'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, related_appointment_id)
    VALUES (
      appt.patient_id,
      'Appointment Reminder',
      'Your appointment at ' || appt.clinic || ' (' || appt.department || ') is scheduled for ' || appt.appointment_date || ' at ' || appt.time_slot || '. Please arrive 10 minutes early.',
      'reminder',
      appt.id
    );
    -- Mark as notified
    UPDATE public.appointments SET sms_sent = true WHERE id = appt.id;
  END LOOP;
END;
$$;
