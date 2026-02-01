-- Fix 1: Restrict candidates table to staff only (not agencies)
DROP POLICY IF EXISTS "Authenticated users can view all candidates" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can create candidates" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can update candidates" ON public.candidates;

CREATE POLICY "Staff can view all candidates"
ON public.candidates FOR SELECT
USING (public.is_authenticated() AND NOT public.is_agency(auth.uid()));

CREATE POLICY "Staff can create candidates"
ON public.candidates FOR INSERT
WITH CHECK (public.is_authenticated() AND NOT public.is_agency(auth.uid()));

CREATE POLICY "Staff can update candidates"
ON public.candidates FOR UPDATE
USING (public.is_authenticated() AND NOT public.is_agency(auth.uid()))
WITH CHECK (public.is_authenticated() AND NOT public.is_agency(auth.uid()));

-- Fix 2: Restrict candidate_job_links to staff only
DROP POLICY IF EXISTS "Authenticated users can view all links" ON public.candidate_job_links;
DROP POLICY IF EXISTS "Authenticated users can create links" ON public.candidate_job_links;
DROP POLICY IF EXISTS "Authenticated users can update links" ON public.candidate_job_links;

CREATE POLICY "Staff can view all links"
ON public.candidate_job_links FOR SELECT
USING (public.is_authenticated() AND NOT public.is_agency(auth.uid()));

CREATE POLICY "Staff can create links"
ON public.candidate_job_links FOR INSERT
WITH CHECK (public.is_authenticated() AND NOT public.is_agency(auth.uid()));

CREATE POLICY "Staff can update links"
ON public.candidate_job_links FOR UPDATE
USING (public.is_authenticated() AND NOT public.is_agency(auth.uid()))
WITH CHECK (public.is_authenticated() AND NOT public.is_agency(auth.uid()));

-- Fix 3: Restrict documents table to staff only
DROP POLICY IF EXISTS "Authenticated users can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON public.documents;

CREATE POLICY "Staff can view all documents"
ON public.documents FOR SELECT
USING (public.is_authenticated() AND NOT public.is_agency(auth.uid()));

CREATE POLICY "Staff can upload documents"
ON public.documents FOR INSERT
WITH CHECK (public.is_authenticated() AND NOT public.is_agency(auth.uid()));

-- Fix 4: Restrict candidate-documents storage bucket to staff only
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;

CREATE POLICY "Staff can view candidate documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'candidate-documents' 
  AND public.is_authenticated() 
  AND NOT public.is_agency(auth.uid())
);

CREATE POLICY "Staff can upload candidate documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'candidate-documents' 
  AND public.is_authenticated() 
  AND NOT public.is_agency(auth.uid())
);

CREATE POLICY "Staff can delete candidate documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'candidate-documents' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);