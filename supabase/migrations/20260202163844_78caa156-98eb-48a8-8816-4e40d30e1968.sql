-- Create a function to check if a user can view an escalation
CREATE OR REPLACE FUNCTION public.can_view_escalation(_user_id uuid, _escalation_id uuid)
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
    -- User created the escalation
    EXISTS (
      SELECT 1 FROM public.escalations e
      WHERE e.id = _escalation_id AND e.escalated_by = _user_id
    )
    OR
    -- User is escalated to
    EXISTS (
      SELECT 1 FROM public.escalations e
      WHERE e.id = _escalation_id AND e.escalated_to_user_id = _user_id
    )
    OR
    -- User's role matches escalated_to_role
    EXISTS (
      SELECT 1 FROM public.escalations e
      JOIN public.user_roles ur ON ur.user_id = _user_id
      WHERE e.id = _escalation_id AND e.escalated_to_role = ur.role
    )
    OR
    -- User is assigned to the project
    EXISTS (
      SELECT 1 FROM public.escalations e
      WHERE e.id = _escalation_id 
      AND e.project_id IS NOT NULL
      AND public.is_assigned_to_project(_user_id, e.project_id)
    )
    OR
    -- User is assigned to the job
    EXISTS (
      SELECT 1 FROM public.escalations e
      WHERE e.id = _escalation_id 
      AND e.job_id IS NOT NULL
      AND public.is_assigned_to_job(_user_id, e.job_id)
    )
    OR
    -- User acknowledged or resolved the escalation
    EXISTS (
      SELECT 1 FROM public.escalations e
      WHERE e.id = _escalation_id 
      AND (e.acknowledged_by = _user_id OR e.resolved_by = _user_id)
    )
$$;

-- Drop the old permissive SELECT policy
DROP POLICY IF EXISTS "Staff can view escalations" ON public.escalations;

-- Create new restricted SELECT policy
CREATE POLICY "Staff can view relevant escalations"
ON public.escalations
FOR SELECT
USING (
  is_authenticated() 
  AND NOT is_agency(auth.uid())
  AND can_view_escalation(auth.uid(), id)
);