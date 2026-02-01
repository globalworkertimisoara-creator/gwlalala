-- Fix: Restrict agency_profiles so agencies only see their own, staff see all
DROP POLICY IF EXISTS "Admins and recruiters can view all agency profiles" ON public.agency_profiles;

CREATE POLICY "Staff can view all agency profiles"
ON public.agency_profiles FOR SELECT
USING (public.is_authenticated() AND NOT public.is_agency(auth.uid()));