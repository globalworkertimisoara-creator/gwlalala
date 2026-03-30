
-- Fix 1: agency_worker_documents - restrict SELECT to internal staff only
DROP POLICY IF EXISTS "Admins and recruiters can view all worker documents" ON public.agency_worker_documents;

CREATE POLICY "Internal staff can view all worker documents"
ON public.agency_worker_documents
FOR SELECT
TO authenticated
USING (
  is_authenticated()
  AND NOT is_agency(auth.uid())
  AND NOT is_employer(auth.uid())
);

-- Ensure agency users can still see their own agency's documents
CREATE POLICY "Agency users can view own agency worker documents"
ON public.agency_worker_documents
FOR SELECT
TO authenticated
USING (
  is_agency(auth.uid())
  AND worker_id IN (
    SELECT aw.id FROM public.agency_workers aw
    WHERE aw.agency_id = public.get_agency_profile_id(auth.uid())
  )
);

-- Fix 2: jobs table - fix broad SELECT that overrides agency invitation control
DROP POLICY IF EXISTS "Authenticated users can view all jobs" ON public.jobs;

CREATE POLICY "Non-agency authenticated users can view all jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (
  is_authenticated()
  AND NOT is_agency(auth.uid())
);
