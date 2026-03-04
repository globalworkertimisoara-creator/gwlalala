
-- Add new personal/CV fields to candidates table
ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS marital_status text,
  ADD COLUMN IF NOT EXISTS number_of_children integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS current_city text,
  ADD COLUMN IF NOT EXISTS driver_license jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS salary_expectations jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS availability jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS job_preferences jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS family_info jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS internal_notes jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS national_id_number text;

-- Candidate Education table
CREATE TABLE public.candidate_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  education_level text NOT NULL,
  field_of_study text,
  institution_name text,
  graduation_year integer,
  degree_obtained text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view candidate education"
  ON public.candidate_education FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Staff can insert candidate education"
  ON public.candidate_education FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Staff can update candidate education"
  ON public.candidate_education FOR UPDATE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Staff can delete candidate education"
  ON public.candidate_education FOR DELETE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- Candidate Work Experience table
CREATE TABLE public.candidate_work_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_title text NOT NULL,
  company_name text,
  country text,
  start_date date,
  end_date date,
  job_description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_work_experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view candidate work experience"
  ON public.candidate_work_experience FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Staff can insert candidate work experience"
  ON public.candidate_work_experience FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Staff can update candidate work experience"
  ON public.candidate_work_experience FOR UPDATE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Staff can delete candidate work experience"
  ON public.candidate_work_experience FOR DELETE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- Candidate Languages table
CREATE TABLE public.candidate_languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  language_name text NOT NULL,
  proficiency_level text NOT NULL DEFAULT 'basic',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view candidate languages"
  ON public.candidate_languages FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Staff can insert candidate languages"
  ON public.candidate_languages FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Staff can update candidate languages"
  ON public.candidate_languages FOR UPDATE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Staff can delete candidate languages"
  ON public.candidate_languages FOR DELETE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- Candidate Skills table
CREATE TABLE public.candidate_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  years_experience integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view candidate skills"
  ON public.candidate_skills FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Staff can insert candidate skills"
  ON public.candidate_skills FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Staff can update candidate skills"
  ON public.candidate_skills FOR UPDATE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Staff can delete candidate skills"
  ON public.candidate_skills FOR DELETE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- Candidate References table
CREATE TABLE public.candidate_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  reference_name text NOT NULL,
  position_title text,
  phone text,
  email text,
  relationship text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.candidate_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view candidate references"
  ON public.candidate_references FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Staff can insert candidate references"
  ON public.candidate_references FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Staff can update candidate references"
  ON public.candidate_references FOR UPDATE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Staff can delete candidate references"
  ON public.candidate_references FOR DELETE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- Indexes
CREATE INDEX idx_candidate_education_candidate ON public.candidate_education(candidate_id);
CREATE INDEX idx_candidate_work_exp_candidate ON public.candidate_work_experience(candidate_id);
CREATE INDEX idx_candidate_languages_candidate ON public.candidate_languages(candidate_id);
CREATE INDEX idx_candidate_skills_candidate ON public.candidate_skills(candidate_id);
CREATE INDEX idx_candidate_references_candidate ON public.candidate_references(candidate_id);
