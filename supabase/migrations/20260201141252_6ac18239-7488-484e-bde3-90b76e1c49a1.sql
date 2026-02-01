-- Restrict agency_profiles viewing to administrators only
-- Agencies can still view their own profile

DROP POLICY IF EXISTS "Staff can view all agency profiles" ON public.agency_profiles;

-- Only admins can view all agency profiles
CREATE POLICY "Admins can view all agency profiles"
ON public.agency_profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));