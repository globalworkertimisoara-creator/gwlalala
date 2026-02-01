-- Restrict stage_history access to admins, project managers, and assigned staff only
-- This prevents unassigned staff from viewing candidate progression details

-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view all stage history" ON public.stage_history;

-- Create a helper function to check if user can view candidate stage history
CREATE OR REPLACE FUNCTION public.can_view_candidate_history(_user_id uuid, _candidate_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Admins and project managers can see all
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id
      AND role IN ('admin', 'project_manager', 'operations_manager')
    )
    OR
    -- Staff assigned to jobs the candidate is linked to
    EXISTS (
      SELECT 1 FROM public.candidate_job_links cjl
      WHERE cjl.candidate_id = _candidate_id
      AND public.is_assigned_to_job(_user_id, cjl.job_id)
    )
    OR
    -- Staff who added the candidate
    EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = _candidate_id AND c.added_by = _user_id
    )
$$;

-- Create new restrictive SELECT policy for stage_history
CREATE POLICY "Staff can view stage history for accessible candidates"
  ON public.stage_history FOR SELECT
  USING (
    is_authenticated() 
    AND NOT is_agency(auth.uid())
    AND can_view_candidate_history(auth.uid(), candidate_id)
  );

-- Keep the INSERT policy unchanged (authenticated users can create stage history)
-- This is typically done via trigger, not direct insert