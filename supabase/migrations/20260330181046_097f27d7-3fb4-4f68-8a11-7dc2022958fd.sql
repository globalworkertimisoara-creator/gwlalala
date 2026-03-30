
-- Fix: Restrict INSERT on jobs to internal staff only
DROP POLICY IF EXISTS "Authenticated users can create jobs" ON public.jobs;
CREATE POLICY "Internal staff can create jobs"
ON public.jobs FOR INSERT
TO authenticated
WITH CHECK (
  is_authenticated()
  AND NOT is_agency(auth.uid())
  AND NOT is_employer(auth.uid())
);

-- Fix: Restrict INSERT on projects to internal staff only
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
CREATE POLICY "Internal staff can create projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (
  is_authenticated()
  AND NOT is_agency(auth.uid())
  AND NOT is_employer(auth.uid())
);

-- Fix: Restrict INSERT on contract_number_audit_log to internal staff only
DROP POLICY IF EXISTS "Authenticated users can create audit entries" ON public.contract_number_audit_log;
CREATE POLICY "Internal staff can create audit entries"
ON public.contract_number_audit_log FOR INSERT
TO authenticated
WITH CHECK (
  is_authenticated()
  AND NOT is_agency(auth.uid())
  AND NOT is_employer(auth.uid())
);
