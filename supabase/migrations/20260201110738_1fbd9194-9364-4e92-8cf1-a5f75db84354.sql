-- Create project status enum
CREATE TYPE public.project_status AS ENUM ('draft', 'active', 'on_hold', 'completed', 'cancelled');

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  employer_name TEXT NOT NULL,
  location TEXT NOT NULL,
  countries_in_contract TEXT[] NOT NULL DEFAULT '{}',
  sales_person_id UUID REFERENCES auth.users(id),
  sales_person_name TEXT, -- For display/external reps
  status project_status NOT NULL DEFAULT 'draft',
  contract_signed_at DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add project_id to jobs table to link jobs to projects
ALTER TABLE public.jobs ADD COLUMN project_id UUID REFERENCES public.projects(id);

-- Create agency_job_invitations table for invited jobs only access
CREATE TABLE public.agency_job_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agency_profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agency_id, job_id)
);

-- Enable RLS on new tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_job_invitations ENABLE ROW LEVEL SECURITY;

-- Projects policies - all authenticated internal users can view
CREATE POLICY "Authenticated users can view all projects"
  ON public.projects FOR SELECT
  USING (is_authenticated());

CREATE POLICY "Authenticated users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (is_authenticated());

CREATE POLICY "Authenticated users can update projects"
  ON public.projects FOR UPDATE
  USING (is_authenticated())
  WITH CHECK (is_authenticated());

CREATE POLICY "Admins can delete projects"
  ON public.projects FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Agency job invitations policies
CREATE POLICY "Staff can view all invitations"
  ON public.agency_job_invitations FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()));

CREATE POLICY "Staff can create invitations"
  ON public.agency_job_invitations FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()));

CREATE POLICY "Staff can delete invitations"
  ON public.agency_job_invitations FOR DELETE
  USING (is_authenticated() AND NOT is_agency(auth.uid()));

CREATE POLICY "Agencies can view their invitations"
  ON public.agency_job_invitations FOR SELECT
  USING (agency_id = get_agency_profile_id(auth.uid()));

-- Update jobs RLS to allow agencies to view invited jobs
CREATE POLICY "Agencies can view invited jobs"
  ON public.jobs FOR SELECT
  USING (
    is_agency(auth.uid()) AND 
    id IN (
      SELECT job_id FROM public.agency_job_invitations 
      WHERE agency_id = get_agency_profile_id(auth.uid())
    )
  );

-- Create indexes for performance
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_sales_person ON public.projects(sales_person_id);
CREATE INDEX idx_jobs_project_id ON public.jobs(project_id);
CREATE INDEX idx_agency_job_invitations_agency ON public.agency_job_invitations(agency_id);
CREATE INDEX idx_agency_job_invitations_job ON public.agency_job_invitations(job_id);

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();