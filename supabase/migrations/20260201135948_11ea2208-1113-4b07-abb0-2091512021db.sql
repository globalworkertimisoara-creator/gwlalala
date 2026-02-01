-- Fix agency_workers SELECT policy to prevent agencies from seeing other agencies' workers
-- The current policy uses only is_authenticated() which allows agencies to see ALL workers

DROP POLICY IF EXISTS "Admins and recruiters can view all agency workers" ON public.agency_workers;

CREATE POLICY "Staff can view all agency workers"
ON public.agency_workers
FOR SELECT
USING (public.is_authenticated() AND NOT public.is_agency(auth.uid()));