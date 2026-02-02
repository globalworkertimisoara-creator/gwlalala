-- Drop the restricted policy
DROP POLICY IF EXISTS "Staff can view relevant candidates" ON public.candidates;

-- Restore the original policy allowing all staff to view all candidates
CREATE POLICY "Staff can view all candidates"
ON public.candidates
FOR SELECT
USING (
  is_authenticated() 
  AND NOT is_agency(auth.uid())
);

-- Drop the function since it's no longer needed
DROP FUNCTION IF EXISTS public.can_view_candidate(uuid, uuid);