
-- Unified candidate activity log for all actor types
CREATE TABLE public.candidate_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL, -- auth.uid() of who performed action
  actor_type TEXT NOT NULL CHECK (actor_type IN ('staff', 'agency', 'employer')),
  -- For scoping: which agency or company did this
  agency_id UUID REFERENCES public.agency_profiles(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  -- Event classification
  event_type TEXT NOT NULL, -- 'status_change', 'note_added', 'note_deleted', 'document_upload', 'document_download', 'profile_update', 'profile_view', 'interview_scheduled', 'interview_updated', 'offer_created', 'offer_updated', 'workflow_update', 'review'
  is_shared_event BOOLEAN NOT NULL DEFAULT false, -- true for interviews, status changes visible to all
  -- Payload
  summary TEXT NOT NULL, -- human-readable description
  details JSONB DEFAULT NULL, -- old/new values, file names, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_candidate_activity_log_candidate ON public.candidate_activity_log(candidate_id);
CREATE INDEX idx_candidate_activity_log_actor ON public.candidate_activity_log(actor_id);
CREATE INDEX idx_candidate_activity_log_created ON public.candidate_activity_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.candidate_activity_log ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user's agency submitted a worker matching this candidate
CREATE OR REPLACE FUNCTION public.agency_has_candidate_access(_user_id uuid, _candidate_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_workers aw
    JOIN public.candidates c ON c.email = aw.email
    WHERE aw.agency_id = public.get_agency_profile_id(_user_id)
    AND c.id = _candidate_id
  )
$$;

-- Helper function: check if employer has project access to this candidate
CREATE OR REPLACE FUNCTION public.employer_has_candidate_access(_user_id uuid, _candidate_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.candidate_workflow cw
    WHERE cw.candidate_id = _candidate_id
    AND public.has_employer_project_access(_user_id, cw.project_id)
  )
$$;

-- 1. Staff (GlobalWorker) sees ALL entries
CREATE POLICY "Staff can view all candidate activity"
ON public.candidate_activity_log
FOR SELECT
USING (
  is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid())
);

-- 2. Agency sees: their own actions + shared events (interviews, status changes) for candidates they submitted
CREATE POLICY "Agency can view scoped candidate activity"
ON public.candidate_activity_log
FOR SELECT
USING (
  is_agency(auth.uid())
  AND agency_has_candidate_access(auth.uid(), candidate_id)
  AND (
    agency_id = get_agency_profile_id(auth.uid())  -- their own actions
    OR is_shared_event = true                       -- interviews, status changes
  )
);

-- 3. Employer sees: their own actions + shared events for candidates in their projects
CREATE POLICY "Employer can view scoped candidate activity"
ON public.candidate_activity_log
FOR SELECT
USING (
  is_employer(auth.uid())
  AND employer_has_candidate_access(auth.uid(), candidate_id)
  AND (
    company_id = get_employer_company_id(auth.uid())  -- their own actions
    OR is_shared_event = true                          -- interviews, status changes
  )
);

-- INSERT policies - each actor type can insert for themselves
CREATE POLICY "Staff can insert activity log"
ON public.candidate_activity_log
FOR INSERT
WITH CHECK (
  is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid())
  AND actor_id = auth.uid() AND actor_type = 'staff'
);

CREATE POLICY "Agency can insert activity log"
ON public.candidate_activity_log
FOR INSERT
WITH CHECK (
  is_agency(auth.uid())
  AND actor_id = auth.uid() AND actor_type = 'agency'
  AND agency_id = get_agency_profile_id(auth.uid())
);

CREATE POLICY "Employer can insert activity log"
ON public.candidate_activity_log
FOR INSERT
WITH CHECK (
  is_employer(auth.uid())
  AND actor_id = auth.uid() AND actor_type = 'employer'
  AND company_id = get_employer_company_id(auth.uid())
);
