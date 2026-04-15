
DROP POLICY "System can create notifications" ON public.notifications;

CREATE POLICY "Authenticated users receive notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
