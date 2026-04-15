
-- The create_appointment_reminders function runs as SECURITY DEFINER (owner = postgres)
-- so RLS doesn't apply to it. But we need to also allow the function to bypass RLS.
-- Actually SECURITY DEFINER functions bypass RLS by default, so no change needed.
-- But let's make the insert policy more permissive for authenticated users to receive notifications
-- from the system by keeping the existing policy as-is since the SECURITY DEFINER function bypasses RLS.

-- No changes needed - this is a no-op confirmation.
SELECT 1;
