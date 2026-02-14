
-- Create employer-specific notes table (separate from internal staff notes)
CREATE TABLE public.employer_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employer_notes ENABLE ROW LEVEL SECURITY;

-- Employers can view notes from their own company
CREATE POLICY "Employers can view their company notes"
ON public.employer_notes FOR SELECT
USING (
  is_employer(auth.uid()) 
  AND company_id = get_employer_company_id(auth.uid())
);

-- Employers can create notes for their company
CREATE POLICY "Employers can create notes"
ON public.employer_notes FOR INSERT
WITH CHECK (
  is_employer(auth.uid()) 
  AND company_id = get_employer_company_id(auth.uid())
  AND created_by = auth.uid()
);

-- Employers can delete their own notes
CREATE POLICY "Employers can delete their own notes"
ON public.employer_notes FOR DELETE
USING (
  is_employer(auth.uid()) 
  AND created_by = auth.uid()
);

-- Internal staff can view all employer notes
CREATE POLICY "Staff can view all employer notes"
ON public.employer_notes FOR SELECT
USING (
  is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid())
);

-- Add employer access to documents table (read-only for candidates in their projects)
CREATE POLICY "Employers can view candidate documents in their projects"
ON public.documents FOR SELECT
USING (
  is_employer(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM public.candidate_workflow cw
    WHERE cw.candidate_id = documents.candidate_id
    AND has_employer_project_access(auth.uid(), cw.project_id)
  )
);

-- Add employer access to candidate_workflow for timeline
CREATE POLICY "Employers can view candidate workflows in their projects"
ON public.candidate_workflow FOR SELECT
USING (
  is_employer(auth.uid()) 
  AND has_employer_project_access(auth.uid(), project_id)
);
