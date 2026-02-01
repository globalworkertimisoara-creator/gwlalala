-- Create agency document types enum
CREATE TYPE public.agency_doc_type AS ENUM (
  'cv',
  'passport',
  'photo',
  'working_video',
  'presentation_video',
  'trade_certificate',
  'medical_clearance',
  'training_doc',
  'plane_ticket',
  'visa_document',
  'other'
);

-- Create agency_profiles table for agency company details
CREATE TABLE public.agency_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  country TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  recruitment_license TEXT,
  certifications TEXT,
  years_in_business INTEGER,
  worker_capacity INTEGER,
  specializations TEXT,
  countries_recruiting_from TEXT,
  industries_focus TEXT,
  has_testing_facilities BOOLEAN DEFAULT false,
  testing_facilities_locations TEXT,
  office_locations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agency_workers table for worker submissions
CREATE TABLE public.agency_workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agency_profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  nationality TEXT NOT NULL,
  current_country TEXT,
  date_of_birth DATE,
  skills TEXT,
  experience_years INTEGER,
  current_stage public.recruitment_stage NOT NULL DEFAULT 'sourced',
  rejection_reason TEXT,
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agency_worker_documents table for file uploads
CREATE TABLE public.agency_worker_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES public.agency_workers(id) ON DELETE CASCADE,
  doc_type public.agency_doc_type NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.agency_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_worker_documents ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is an agency
CREATE OR REPLACE FUNCTION public.is_agency(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'agency'
  )
$$;

-- Create helper function to get agency profile id for a user
CREATE OR REPLACE FUNCTION public.get_agency_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.agency_profiles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for agency_profiles
CREATE POLICY "Agencies can view their own profile"
ON public.agency_profiles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Agencies can update their own profile"
ON public.agency_profiles
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Agencies can insert their own profile"
ON public.agency_profiles
FOR INSERT
WITH CHECK (user_id = auth.uid() AND is_agency(auth.uid()));

CREATE POLICY "Admins and recruiters can view all agency profiles"
ON public.agency_profiles
FOR SELECT
USING (is_authenticated());

-- RLS Policies for agency_workers
CREATE POLICY "Agencies can view their own workers"
ON public.agency_workers
FOR SELECT
USING (agency_id = get_agency_profile_id(auth.uid()));

CREATE POLICY "Agencies can insert workers"
ON public.agency_workers
FOR INSERT
WITH CHECK (agency_id = get_agency_profile_id(auth.uid()));

CREATE POLICY "Agencies can update their own workers"
ON public.agency_workers
FOR UPDATE
USING (agency_id = get_agency_profile_id(auth.uid()))
WITH CHECK (agency_id = get_agency_profile_id(auth.uid()));

CREATE POLICY "Admins and recruiters can view all agency workers"
ON public.agency_workers
FOR SELECT
USING (is_authenticated());

CREATE POLICY "Admins and recruiters can update agency workers"
ON public.agency_workers
FOR UPDATE
USING (is_authenticated() AND NOT is_agency(auth.uid()))
WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()));

-- RLS Policies for agency_worker_documents
CREATE POLICY "Agencies can view their worker documents"
ON public.agency_worker_documents
FOR SELECT
USING (
  worker_id IN (
    SELECT id FROM public.agency_workers 
    WHERE agency_id = get_agency_profile_id(auth.uid())
  )
);

CREATE POLICY "Agencies can upload worker documents"
ON public.agency_worker_documents
FOR INSERT
WITH CHECK (
  worker_id IN (
    SELECT id FROM public.agency_workers 
    WHERE agency_id = get_agency_profile_id(auth.uid())
  )
);

CREATE POLICY "Agencies can delete their worker documents"
ON public.agency_worker_documents
FOR DELETE
USING (
  worker_id IN (
    SELECT id FROM public.agency_workers 
    WHERE agency_id = get_agency_profile_id(auth.uid())
  )
);

CREATE POLICY "Admins and recruiters can view all worker documents"
ON public.agency_worker_documents
FOR SELECT
USING (is_authenticated());

-- Triggers for updated_at
CREATE TRIGGER update_agency_profiles_updated_at
BEFORE UPDATE ON public.agency_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agency_workers_updated_at
BEFORE UPDATE ON public.agency_workers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();