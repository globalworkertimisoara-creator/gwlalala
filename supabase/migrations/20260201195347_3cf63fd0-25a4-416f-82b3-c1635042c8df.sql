-- Fix: Restrict candidate documents access to admins and assigned staff only
-- This follows the principle of least privilege

-- First, drop existing overly permissive storage policies for candidate-documents bucket
DROP POLICY IF EXISTS "Staff can view candidate documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can upload candidate documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete candidate documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documents" ON storage.objects;

-- Create new restrictive SELECT policy
-- Admins can view all, other staff can only view documents for candidates linked to jobs they're assigned to
CREATE POLICY "Staff can view assigned candidate documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'candidate-documents' AND
    is_authenticated() AND
    NOT is_agency(auth.uid()) AND
    (
      has_role(auth.uid(), 'admin') OR
      -- Check if user is assigned to any job the candidate is linked to
      EXISTS (
        SELECT 1 FROM public.candidate_job_links cjl
        JOIN public.jobs j ON j.id = cjl.job_id
        WHERE (storage.foldername(name))[1]::uuid = cjl.candidate_id
        AND (j.created_by = auth.uid() OR public.is_assigned_to_job(auth.uid(), j.id))
      )
    )
  );

-- Create new restrictive INSERT policy
-- Same logic: admins can upload anywhere, others only for assigned candidates
CREATE POLICY "Staff can upload assigned candidate documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'candidate-documents' AND
    is_authenticated() AND
    NOT is_agency(auth.uid()) AND
    (
      has_role(auth.uid(), 'admin') OR
      EXISTS (
        SELECT 1 FROM public.candidate_job_links cjl
        JOIN public.jobs j ON j.id = cjl.job_id
        WHERE (storage.foldername(name))[1]::uuid = cjl.candidate_id
        AND (j.created_by = auth.uid() OR public.is_assigned_to_job(auth.uid(), j.id))
      )
    )
  );

-- Create new restrictive UPDATE policy
CREATE POLICY "Staff can update assigned candidate documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'candidate-documents' AND
    is_authenticated() AND
    NOT is_agency(auth.uid()) AND
    (
      has_role(auth.uid(), 'admin') OR
      EXISTS (
        SELECT 1 FROM public.candidate_job_links cjl
        JOIN public.jobs j ON j.id = cjl.job_id
        WHERE (storage.foldername(name))[1]::uuid = cjl.candidate_id
        AND (j.created_by = auth.uid() OR public.is_assigned_to_job(auth.uid(), j.id))
      )
    )
  );

-- Create new restrictive DELETE policy - admin only for safety
CREATE POLICY "Admins can delete candidate documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'candidate-documents' AND
    has_role(auth.uid(), 'admin')
  );