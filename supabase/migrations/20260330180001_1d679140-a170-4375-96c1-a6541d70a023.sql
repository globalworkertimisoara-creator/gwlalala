
-- Helper: check if user owns a contract document file via the contracts table
CREATE OR REPLACE FUNCTION public.owns_contract_file(_user_id uuid, _object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contract_documents cd
    JOIN public.contracts c ON c.id = cd.contract_id
    WHERE cd.storage_path = _object_name
    AND (
      (c.party_type = 'agency' AND c.party_id = public.get_agency_profile_id(_user_id))
      OR
      (c.party_type = 'employer' AND c.party_id = public.get_employer_company_id(_user_id))
    )
  )
$$;

-- Fix 1: Replace broad contract-documents storage SELECT policy
DROP POLICY IF EXISTS "Parties can read contract files" ON storage.objects;

CREATE POLICY "Parties can read own contract files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contract-documents'
  AND public.owns_contract_file(auth.uid(), name)
);

-- Fix 2: Replace broad projects SELECT policy with scoped access
DROP POLICY IF EXISTS "Authenticated users can view all projects" ON public.projects;

-- Internal staff can view all projects
CREATE POLICY "Internal staff can view all projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  is_authenticated()
  AND NOT is_agency(auth.uid())
  AND NOT is_employer(auth.uid())
);

-- Agencies can only see projects linked to jobs they are invited to
CREATE POLICY "Agencies can view invited projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  is_agency(auth.uid())
  AND id IN (
    SELECT j.project_id FROM public.jobs j
    JOIN public.agency_job_invitations aji ON aji.job_id = j.id
    WHERE aji.agency_id = public.get_agency_profile_id(auth.uid())
    AND j.project_id IS NOT NULL
  )
);

-- Employers can only see projects belonging to their company
CREATE POLICY "Employers can view own company projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  is_employer(auth.uid())
  AND (
    company_id = public.get_employer_company_id(auth.uid())
    OR public.has_employer_project_access(auth.uid(), id)
  )
);
