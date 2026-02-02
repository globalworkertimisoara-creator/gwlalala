-- Create a function to check if a user can view a candidate
CREATE OR REPLACE FUNCTION public.can_view_candidate(_user_id uuid, _candidate_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admins can see all
    public.has_role(_user_id, 'admin')
    OR
    -- User added the candidate
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = _candidate_id AND c.added_by = _user_id
    )
    OR
    -- User is assigned to a job the candidate is linked to
    EXISTS (
      SELECT 1 FROM public.candidate_job_links cjl
      WHERE cjl.candidate_id = _candidate_id
      AND public.is_assigned_to_job(_user_id, cjl.job_id)
    )
$$;

-- Drop the old permissive SELECT policy
DROP POLICY IF EXISTS "Staff can view all candidates" ON public.candidates;

-- Create new restricted SELECT policy
CREATE POLICY "Staff can view relevant candidates"
ON public.candidates
FOR SELECT
USING (
  is_authenticated() 
  AND NOT is_agency(auth.uid())
  AND can_view_candidate(auth.uid(), id)
);