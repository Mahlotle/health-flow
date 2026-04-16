
-- Create doctor_availability table
CREATE TABLE public.doctor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  clinic TEXT NOT NULL,
  department TEXT NOT NULL,
  available_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (clinic, department, available_date, time_slot)
);

-- Enable RLS
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

-- Doctors can manage their own availability
CREATE POLICY "Doctors can insert their availability"
ON public.doctor_availability FOR INSERT
WITH CHECK (has_role(auth.uid(), 'doctor'::app_role) AND auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their availability"
ON public.doctor_availability FOR UPDATE
USING (has_role(auth.uid(), 'doctor'::app_role) AND auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their availability"
ON public.doctor_availability FOR DELETE
USING (has_role(auth.uid(), 'doctor'::app_role) AND auth.uid() = doctor_id);

CREATE POLICY "Doctors can view all availability"
ON public.doctor_availability FOR SELECT
USING (has_role(auth.uid(), 'doctor'::app_role));

-- Patients can view unbooked availability to pick slots
CREATE POLICY "Patients can view available slots"
ON public.doctor_availability FOR SELECT
USING (has_role(auth.uid(), 'patient'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_doctor_availability_updated_at
BEFORE UPDATE ON public.doctor_availability
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for doctor_availability
ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_availability;
