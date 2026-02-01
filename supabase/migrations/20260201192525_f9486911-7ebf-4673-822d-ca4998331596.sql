-- Helper function to check if user is assigned to a project (directly or by role)
CREATE OR REPLACE FUNCTION public.is_assigned_to_project(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_assignments pa
    WHERE pa.project_id = _project_id
    AND (
      pa.assigned_user_id = _user_id
      OR pa.assigned_role IN (
        SELECT role FROM public.user_roles WHERE user_id = _user_id
      )
    )
  )
  OR public.has_role(_user_id, 'admin')
  OR EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = _project_id AND p.created_by = _user_id
  )
$$;

-- Helper function to check if user is assigned to a job (directly, by role, or via project)
CREATE OR REPLACE FUNCTION public.is_assigned_to_job(_user_id uuid, _job_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.job_assignments ja
    WHERE ja.job_id = _job_id
    AND (
      ja.assigned_user_id = _user_id
      OR ja.assigned_role IN (
        SELECT role FROM public.user_roles WHERE user_id = _user_id
      )
    )
  )
  OR public.has_role(_user_id, 'admin')
  OR EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = _job_id AND j.created_by = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = _job_id 
    AND j.project_id IS NOT NULL
    AND public.is_assigned_to_project(_user_id, j.project_id)
  )
$$;

-- Helper function to check if user can manage assignments
CREATE OR REPLACE FUNCTION public.can_manage_assignments(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'project_manager', 'sales_manager')
  )
$$;

-- RLS Policies for project_assignments
CREATE POLICY "Staff can view project assignments"
  ON public.project_assignments FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()));

CREATE POLICY "Managers can create project assignments"
  ON public.project_assignments FOR INSERT
  WITH CHECK (can_manage_assignments(auth.uid()));

CREATE POLICY "Managers can delete project assignments"
  ON public.project_assignments FOR DELETE
  USING (can_manage_assignments(auth.uid()));

-- RLS Policies for job_assignments
CREATE POLICY "Staff can view job assignments"
  ON public.job_assignments FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()));

CREATE POLICY "Managers can create job assignments"
  ON public.job_assignments FOR INSERT
  WITH CHECK (can_manage_assignments(auth.uid()));

CREATE POLICY "Managers can delete job assignments"
  ON public.job_assignments FOR DELETE
  USING (can_manage_assignments(auth.uid()));

-- RLS Policies for activity_log
CREATE POLICY "Staff can view activity log"
  ON public.activity_log FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()));

CREATE POLICY "Staff can create activity log entries"
  ON public.activity_log FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()));

-- RLS Policies for escalations
CREATE POLICY "Staff can view escalations"
  ON public.escalations FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()));

CREATE POLICY "Staff can create escalations"
  ON public.escalations FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()));

CREATE POLICY "Staff can update escalations"
  ON public.escalations FOR UPDATE
  USING (is_authenticated() AND NOT is_agency(auth.uid()))
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()));

-- RLS Policies for auto_escalation_rules
CREATE POLICY "Managers can view escalation rules"
  ON public.auto_escalation_rules FOR SELECT
  USING (can_manage_assignments(auth.uid()));

CREATE POLICY "Admins can manage escalation rules"
  ON public.auto_escalation_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Update triggers for updated_at columns
CREATE TRIGGER update_escalations_updated_at
  BEFORE UPDATE ON public.escalations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_auto_escalation_rules_updated_at
  BEFORE UPDATE ON public.auto_escalation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Now fix the jobs table UPDATE policy with ownership controls
DROP POLICY IF EXISTS "Authenticated users can update jobs" ON public.jobs;

-- Admins can update any job
CREATE POLICY "Admins can update any job"
  ON public.jobs FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Staff can update jobs they created or are assigned to
CREATE POLICY "Staff can update assigned jobs"
  ON public.jobs FOR UPDATE
  USING (
    is_authenticated() AND 
    NOT is_agency(auth.uid()) AND
    NOT has_role(auth.uid(), 'admin') AND
    (
      created_by = auth.uid() OR
      is_assigned_to_job(auth.uid(), id)
    )
  )
  WITH CHECK (
    is_authenticated() AND 
    NOT is_agency(auth.uid()) AND
    NOT has_role(auth.uid(), 'admin') AND
    (
      created_by = auth.uid() OR
      is_assigned_to_job(auth.uid(), id)
    )
  );

-- Also fix projects table UPDATE policy
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;

-- Admins can update any project
CREATE POLICY "Admins can update any project"
  ON public.projects FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Staff can update projects they created or are assigned to
CREATE POLICY "Staff can update assigned projects"
  ON public.projects FOR UPDATE
  USING (
    is_authenticated() AND 
    NOT is_agency(auth.uid()) AND
    NOT has_role(auth.uid(), 'admin') AND
    (
      created_by = auth.uid() OR
      is_assigned_to_project(auth.uid(), id)
    )
  )
  WITH CHECK (
    is_authenticated() AND 
    NOT is_agency(auth.uid()) AND
    NOT has_role(auth.uid(), 'admin') AND
    (
      created_by = auth.uid() OR
      is_assigned_to_project(auth.uid(), id)
    )
  );