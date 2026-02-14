
-- ─── Companies Table ──────────────────────────────────────────────────────
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  legal_name TEXT,
  registration_number TEXT,
  industry TEXT,
  company_size TEXT,
  founded_year INTEGER,
  primary_contact_name TEXT NOT NULL,
  primary_contact_email TEXT NOT NULL,
  primary_contact_phone TEXT,
  primary_contact_position TEXT,
  headquarters_country TEXT NOT NULL,
  headquarters_city TEXT,
  headquarters_address TEXT,
  postal_code TEXT,
  billing_contact_name TEXT,
  billing_contact_email TEXT,
  hr_contact_name TEXT,
  hr_contact_email TEXT,
  website TEXT,
  linkedin_url TEXT,
  description TEXT,
  allow_multi_agency BOOLEAN DEFAULT true,
  require_background_checks BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Validation trigger for company status
CREATE OR REPLACE FUNCTION public.validate_company_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('active', 'inactive', 'suspended') THEN
    RAISE EXCEPTION 'Invalid company status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_company_status_trigger
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.validate_company_status();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── Update existing tables ───────────────────────────────────────────────
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS employer_team_role public.employer_team_role;

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_company ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);

-- ─── Employer Project Access ──────────────────────────────────────────────
CREATE TABLE public.employer_project_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  can_view_candidates BOOLEAN DEFAULT true,
  can_approve_candidates BOOLEAN DEFAULT false,
  can_schedule_interviews BOOLEAN DEFAULT false,
  can_make_offers BOOLEAN DEFAULT false,
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- ─── Candidate Interviews ─────────────────────────────────────────────────
CREATE TABLE public.candidate_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  video_link TEXT,
  interviewer_name TEXT,
  interviewer_email TEXT,
  status TEXT DEFAULT 'scheduled',
  interview_outcome TEXT,
  feedback TEXT,
  scheduled_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.validate_interview_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('scheduled', 'completed', 'cancelled', 'rescheduled') THEN
    RAISE EXCEPTION 'Invalid interview status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_interview_status_trigger
  BEFORE INSERT OR UPDATE ON public.candidate_interviews
  FOR EACH ROW EXECUTE FUNCTION public.validate_interview_status();

CREATE TRIGGER update_candidate_interviews_updated_at
  BEFORE UPDATE ON public.candidate_interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── Candidate Offers ─────────────────────────────────────────────────────
CREATE TABLE public.candidate_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  position_title TEXT NOT NULL,
  salary_amount DECIMAL(12, 2),
  salary_currency TEXT DEFAULT 'EUR',
  salary_period TEXT,
  contract_type TEXT,
  start_date DATE,
  benefits TEXT[],
  benefits_description TEXT,
  status TEXT DEFAULT 'pending',
  offer_expires_at TIMESTAMPTZ,
  candidate_response TEXT,
  candidate_response_at TIMESTAMPTZ,
  offer_letter_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.validate_offer_status()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'accepted', 'rejected', 'withdrawn') THEN
    RAISE EXCEPTION 'Invalid offer status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_offer_status_trigger
  BEFORE INSERT OR UPDATE ON public.candidate_offers
  FOR EACH ROW EXECUTE FUNCTION public.validate_offer_status();

CREATE TRIGGER update_candidate_offers_updated_at
  BEFORE UPDATE ON public.candidate_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── Employer Activity Log ────────────────────────────────────────────────
CREATE TABLE public.employer_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX idx_companies_status ON public.companies(status);
CREATE INDEX idx_employer_project_access_user ON public.employer_project_access(user_id);
CREATE INDEX idx_employer_project_access_project ON public.employer_project_access(project_id);
CREATE INDEX idx_candidate_interviews_candidate ON public.candidate_interviews(candidate_id);
CREATE INDEX idx_candidate_interviews_project ON public.candidate_interviews(project_id);
CREATE INDEX idx_candidate_offers_candidate ON public.candidate_offers(candidate_id);
CREATE INDEX idx_candidate_offers_project ON public.candidate_offers(project_id);
CREATE INDEX idx_employer_activity_log_company ON public.employer_activity_log(company_id);

-- ─── Security Definer Helper Functions ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_employer(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'employer'
  )
$$;

CREATE OR REPLACE FUNCTION public.get_employer_company_id(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_employer_team_role_fn(_user_id UUID)
RETURNS public.employer_team_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT employer_team_role FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_employer_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = _user_id
    AND ur.role = 'employer'
    AND p.employer_team_role = 'employer_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_employer_project_access(_user_id UUID, _project_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employer_project_access
    WHERE user_id = _user_id AND project_id = _project_id
  )
  OR (
    public.is_employer_admin(_user_id)
    AND EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.profiles pr ON pr.company_id = p.company_id
      WHERE p.id = _project_id AND pr.user_id = _user_id
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.get_employer_candidates(p_project_id UUID)
RETURNS TABLE (
  candidate_id UUID, full_name TEXT, email TEXT, phone TEXT,
  nationality TEXT, current_country TEXT, current_phase TEXT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.full_name, c.email, c.phone, c.nationality, c.current_country, cw.current_phase::TEXT
  FROM public.candidates c
  JOIN public.candidate_workflow cw ON cw.candidate_id = c.id
  WHERE cw.project_id = p_project_id;
END;
$$;

-- ─── RLS Policies ─────────────────────────────────────────────────────────

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal staff can view all companies"
  ON public.companies FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Admins can manage companies"
  ON public.companies FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Employers can view their company"
  ON public.companies FOR SELECT
  USING (is_employer(auth.uid()) AND id = get_employer_company_id(auth.uid()));

CREATE POLICY "Employer admins can update their company"
  ON public.companies FOR UPDATE
  USING (is_employer_admin(auth.uid()) AND id = get_employer_company_id(auth.uid()))
  WITH CHECK (is_employer_admin(auth.uid()) AND id = get_employer_company_id(auth.uid()));

ALTER TABLE public.employer_project_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage employer project access"
  ON public.employer_project_access FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Employers can view their project access"
  ON public.employer_project_access FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Staff can view all employer project access"
  ON public.employer_project_access FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

ALTER TABLE public.candidate_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage all interviews"
  ON public.candidate_interviews FOR ALL
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()))
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Employers can view project interviews"
  ON public.candidate_interviews FOR SELECT
  USING (is_employer(auth.uid()) AND has_employer_project_access(auth.uid(), project_id));

CREATE POLICY "Employers can schedule interviews"
  ON public.candidate_interviews FOR INSERT
  WITH CHECK (
    is_employer(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.employer_project_access epa
      WHERE epa.user_id = auth.uid()
      AND epa.project_id = candidate_interviews.project_id
      AND epa.can_schedule_interviews = true
    )
  );

ALTER TABLE public.candidate_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage all offers"
  ON public.candidate_offers FOR ALL
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()))
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Employers can view project offers"
  ON public.candidate_offers FOR SELECT
  USING (is_employer(auth.uid()) AND has_employer_project_access(auth.uid(), project_id));

CREATE POLICY "Employers can make offers"
  ON public.candidate_offers FOR INSERT
  WITH CHECK (
    is_employer(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.employer_project_access epa
      WHERE epa.user_id = auth.uid()
      AND epa.project_id = candidate_offers.project_id
      AND epa.can_make_offers = true
    )
  );

ALTER TABLE public.employer_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employer admins can view company activity"
  ON public.employer_activity_log FOR SELECT
  USING (is_employer(auth.uid()) AND is_employer_admin(auth.uid()) AND company_id = get_employer_company_id(auth.uid()));

CREATE POLICY "Employers can create activity logs"
  ON public.employer_activity_log FOR INSERT
  WITH CHECK (is_employer(auth.uid()) AND company_id = get_employer_company_id(auth.uid()));

CREATE POLICY "Staff can view all employer activity"
  ON public.employer_activity_log FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Admins can manage employer activity"
  ON public.employer_activity_log FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
