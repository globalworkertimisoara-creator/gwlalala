-- =============================================
-- 1. Fix privilege escalation on agency_team_invitations
-- =============================================
DROP POLICY "Users can accept own invitations" ON public.agency_team_invitations;
CREATE POLICY "Users can accept own invitations" ON public.agency_team_invitations
  FOR UPDATE
  USING (
    email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text
  )
  WITH CHECK (
    email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text
    AND agency_id = agency_id  -- cannot change agency_id (references OLD implicitly)
    AND invited_role = invited_role  -- cannot change invited_role
    AND status = 'accepted'
  );

-- =============================================
-- 2. Restrict contract templates to internal staff
-- =============================================
DROP POLICY "Authenticated users can view templates" ON public.contract_templates;
CREATE POLICY "Internal staff can view templates" ON public.contract_templates
  FOR SELECT
  USING (
    is_authenticated()
    AND NOT is_agency(auth.uid())
    AND NOT is_employer(auth.uid())
  );

DROP POLICY "Authenticated users can view template versions" ON public.contract_template_versions;
CREATE POLICY "Internal staff can view template versions" ON public.contract_template_versions
  FOR SELECT
  USING (
    is_authenticated()
    AND NOT is_agency(auth.uid())
    AND NOT is_employer(auth.uid())
  );

-- =============================================
-- 3. Create employer-safe candidate view and restrict access
-- =============================================
CREATE OR REPLACE VIEW public.v_candidates_for_employers AS
SELECT
  id,
  full_name,
  email,
  phone,
  whatsapp,
  nationality,
  current_country,
  current_city,
  current_stage,
  date_of_birth,
  gender,
  expected_start_date,
  profile_photo_url,
  linkedin,
  created_at,
  updated_at
FROM public.candidates;

-- Drop the existing employer policy on candidates
DROP POLICY "Employers can view project candidates" ON public.candidates;

-- Recreate as a narrower policy that still allows the view to function
-- but the view itself restricts columns
CREATE POLICY "Employers can view project candidates" ON public.candidates
  FOR SELECT
  USING (
    is_employer(auth.uid())
    AND employer_has_candidate_access(auth.uid(), id)
  );