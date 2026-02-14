
-- Create employer audit log for tracking candidate profile operations
CREATE TABLE public.employer_candidate_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'profile_view', 'document_download', 'note_added', 'note_deleted'
  details JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employer_candidate_audit_log ENABLE ROW LEVEL SECURITY;

-- Employer admins can view their company's audit log
CREATE POLICY "Employer admins can view company audit log"
ON public.employer_candidate_audit_log FOR SELECT
USING (
  is_employer(auth.uid()) 
  AND is_employer_admin(auth.uid())
  AND company_id = get_employer_company_id(auth.uid())
);

-- All employers can insert audit log entries for their company
CREATE POLICY "Employers can create audit log entries"
ON public.employer_candidate_audit_log FOR INSERT
WITH CHECK (
  is_employer(auth.uid())
  AND company_id = get_employer_company_id(auth.uid())
  AND user_id = auth.uid()
);

-- Internal staff can view all employer audit logs
CREATE POLICY "Staff can view all employer audit logs"
ON public.employer_candidate_audit_log FOR SELECT
USING (
  is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid())
);
