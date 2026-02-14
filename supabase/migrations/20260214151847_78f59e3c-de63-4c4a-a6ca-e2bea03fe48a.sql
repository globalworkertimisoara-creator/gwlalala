
-- ============================================================================
-- AGENCY TEAM MANAGEMENT
-- Allows agencies to have multiple users with different roles
-- ============================================================================

-- ─── Agency Team Role Enum ────────────────────────────────────────────────
CREATE TYPE public.agency_team_role AS ENUM (
  'agency_owner',
  'agency_recruiter',
  'agency_document_staff',
  'agency_viewer'
);

-- ─── Update Profiles Table ────────────────────────────────────────────────
ALTER TABLE public.profiles 
ADD COLUMN agency_team_role public.agency_team_role;

-- Set existing agency users as owners
UPDATE public.profiles 
SET agency_team_role = 'agency_owner' 
WHERE user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'agency')
AND agency_team_role IS NULL;

-- ─── Agency Team Invitations ──────────────────────────────────────────────
CREATE TABLE public.agency_team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agency_profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_role public.agency_team_role NOT NULL,
  invited_by UUID NOT NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Agency Activity Log ──────────────────────────────────────────────────
CREATE TABLE public.agency_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agency_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT,
  user_role public.agency_team_role,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX idx_agency_team_invitations_agency ON public.agency_team_invitations(agency_id);
CREATE INDEX idx_agency_team_invitations_email ON public.agency_team_invitations(email);
CREATE INDEX idx_agency_team_invitations_token ON public.agency_team_invitations(token);
CREATE INDEX idx_agency_team_invitations_status ON public.agency_team_invitations(status);

CREATE INDEX idx_agency_activity_log_agency ON public.agency_activity_log(agency_id);
CREATE INDEX idx_agency_activity_log_user ON public.agency_activity_log(user_id);
CREATE INDEX idx_agency_activity_log_created ON public.agency_activity_log(created_at DESC);

-- ─── RLS Policies ─────────────────────────────────────────────────────────

-- Agency Team Invitations
ALTER TABLE public.agency_team_invitations ENABLE ROW LEVEL SECURITY;

-- Agency owners can view invitations for their agency
CREATE POLICY "Agency owners can view team invitations"
  ON public.agency_team_invitations FOR SELECT
  USING (
    is_agency(auth.uid())
    AND agency_id = get_agency_profile_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.agency_team_role = 'agency_owner'
    )
  );

-- Anyone can view their own invitation by email (for acceptance)
CREATE POLICY "Users can view own invitations by email"
  ON public.agency_team_invitations FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Agency owners can create invitations
CREATE POLICY "Agency owners can create team invitations"
  ON public.agency_team_invitations FOR INSERT
  WITH CHECK (
    is_agency(auth.uid())
    AND agency_id = get_agency_profile_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.agency_team_role = 'agency_owner'
    )
  );

-- Agency owners can update invitations (cancel)
CREATE POLICY "Agency owners can update team invitations"
  ON public.agency_team_invitations FOR UPDATE
  USING (
    is_agency(auth.uid())
    AND agency_id = get_agency_profile_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.agency_team_role = 'agency_owner'
    )
  );

-- Authenticated users can update their own invitation (accept)
CREATE POLICY "Users can accept own invitations"
  ON public.agency_team_invitations FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Staff can view all invitations
CREATE POLICY "Staff can view all team invitations"
  ON public.agency_team_invitations FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()));

-- Agency Activity Log
ALTER TABLE public.agency_activity_log ENABLE ROW LEVEL SECURITY;

-- Agency team members can view their agency's activity log
CREATE POLICY "Agency team can view activity log"
  ON public.agency_activity_log FOR SELECT
  USING (
    is_agency(auth.uid())
    AND agency_id = get_agency_profile_id(auth.uid())
  );

-- Agency team can insert activity logs
CREATE POLICY "Agency team can create activity logs"
  ON public.agency_activity_log FOR INSERT
  WITH CHECK (
    is_agency(auth.uid())
    AND agency_id = get_agency_profile_id(auth.uid())
  );

-- Staff can view all activity logs
CREATE POLICY "Staff can view all agency activity"
  ON public.agency_activity_log FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()));

-- ─── Helper Functions ─────────────────────────────────────────────────────

-- Check if user is an agency owner
CREATE OR REPLACE FUNCTION public.is_agency_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = _user_id
    AND ur.role = 'agency'
    AND p.agency_team_role = 'agency_owner'
  )
$$;

-- Get agency team role for a user
CREATE OR REPLACE FUNCTION public.get_agency_team_role(_user_id uuid)
RETURNS public.agency_team_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_team_role FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;
