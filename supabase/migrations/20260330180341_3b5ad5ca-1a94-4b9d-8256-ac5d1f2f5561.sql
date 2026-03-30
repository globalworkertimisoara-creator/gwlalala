
-- Fix 1: stage_history - restrict INSERT to internal staff only with impersonation prevention
DROP POLICY IF EXISTS "Authenticated users can create stage history" ON public.stage_history;

CREATE POLICY "Staff can create stage history"
ON public.stage_history
FOR INSERT
TO authenticated
WITH CHECK (
  is_authenticated()
  AND NOT is_agency(auth.uid())
  AND NOT is_employer(auth.uid())
  AND changed_by = auth.uid()
);

-- Fix 2: candidates - exclude employers from broad staff policy, add scoped employer access
DROP POLICY IF EXISTS "Staff can view all candidates" ON public.candidates;

CREATE POLICY "Internal staff can view all candidates"
ON public.candidates
FOR SELECT
TO authenticated
USING (
  is_authenticated()
  AND NOT is_agency(auth.uid())
  AND NOT is_employer(auth.uid())
);

CREATE POLICY "Employers can view project candidates"
ON public.candidates
FOR SELECT
TO authenticated
USING (
  is_employer(auth.uid())
  AND employer_has_candidate_access(auth.uid(), id)
);
