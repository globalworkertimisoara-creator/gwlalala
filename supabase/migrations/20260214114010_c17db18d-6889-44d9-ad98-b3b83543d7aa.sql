
-- ============================================================================
-- CANDIDATE WORKFLOW SYSTEM
-- ============================================================================

-- ─── Workflow Phases Enum ─────────────────────────────────────────────────
CREATE TYPE public.workflow_phase AS ENUM (
  'recruitment',
  'documentation',
  'visa',
  'arrival',
  'residence_permit'
);

CREATE TYPE public.workflow_type AS ENUM (
  'full_immigration',
  'no_visa'
);

CREATE TYPE public.document_status AS ENUM (
  'pending',
  'uploaded',
  'under_review',
  'approved',
  'rejected'
);

-- ─── Candidate Workflow Tracking ──────────────────────────────────────────
CREATE TABLE public.candidate_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workflow_type public.workflow_type NOT NULL DEFAULT 'full_immigration',
  current_phase public.workflow_phase NOT NULL DEFAULT 'recruitment',
  recruitment_completed_at TIMESTAMPTZ,
  documentation_completed_at TIMESTAMPTZ,
  visa_completed_at TIMESTAMPTZ,
  arrival_completed_at TIMESTAMPTZ,
  residence_permit_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(candidate_id, project_id)
);

-- ─── Document Templates ───────────────────────────────────────────────────
CREATE TABLE public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase public.workflow_phase NOT NULL,
  document_name TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(phase, document_name)
);

-- ─── Workflow Documents ───────────────────────────────────────────────────
CREATE TABLE public.workflow_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.candidate_workflow(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL,
  document_name TEXT NOT NULL,
  phase public.workflow_phase NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  status public.document_status DEFAULT 'pending',
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX idx_candidate_workflow_candidate ON public.candidate_workflow(candidate_id);
CREATE INDEX idx_candidate_workflow_project ON public.candidate_workflow(project_id);
CREATE INDEX idx_candidate_workflow_phase ON public.candidate_workflow(current_phase);
CREATE INDEX idx_workflow_documents_workflow ON public.workflow_documents(workflow_id);
CREATE INDEX idx_workflow_documents_phase ON public.workflow_documents(phase);
CREATE INDEX idx_workflow_documents_status ON public.workflow_documents(status);
CREATE INDEX idx_document_templates_phase ON public.document_templates(phase);

-- ─── RLS Policies ─────────────────────────────────────────────────────────

-- Candidate Workflow
ALTER TABLE public.candidate_workflow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all workflows"
  ON public.candidate_workflow FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()));

CREATE POLICY "Staff can insert workflows"
  ON public.candidate_workflow FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()));

CREATE POLICY "Staff can update workflows"
  ON public.candidate_workflow FOR UPDATE
  USING (is_authenticated() AND NOT is_agency(auth.uid()))
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()));

CREATE POLICY "Staff can delete workflows"
  ON public.candidate_workflow FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Agencies can view workflows for workers they submitted
CREATE POLICY "Agencies can view their candidate workflows"
  ON public.candidate_workflow FOR SELECT
  USING (
    is_agency(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.agency_workers aw
      WHERE aw.agency_id = get_agency_profile_id(auth.uid())
      AND aw.email = (SELECT c.email FROM public.candidates c WHERE c.id = candidate_workflow.candidate_id)
    )
  );

-- Document Templates
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view templates"
  ON public.document_templates FOR SELECT
  USING (is_authenticated());

CREATE POLICY "Admins can manage templates"
  ON public.document_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Workflow Documents
ALTER TABLE public.workflow_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all workflow documents"
  ON public.workflow_documents FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()));

CREATE POLICY "Staff can insert workflow documents"
  ON public.workflow_documents FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()));

CREATE POLICY "Staff can update workflow documents"
  ON public.workflow_documents FOR UPDATE
  USING (is_authenticated() AND NOT is_agency(auth.uid()))
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()));

CREATE POLICY "Admins can delete workflow documents"
  ON public.workflow_documents FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Agencies can view/upload documents for their candidates' workflows
CREATE POLICY "Agencies can view their workflow documents"
  ON public.workflow_documents FOR SELECT
  USING (
    is_agency(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.candidate_workflow cw
      JOIN public.agency_workers aw ON aw.email = (SELECT c.email FROM public.candidates c WHERE c.id = cw.candidate_id)
      WHERE cw.id = workflow_documents.workflow_id
      AND aw.agency_id = get_agency_profile_id(auth.uid())
    )
  );

CREATE POLICY "Agencies can upload workflow documents"
  ON public.workflow_documents FOR INSERT
  WITH CHECK (
    is_agency(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.candidate_workflow cw
      JOIN public.agency_workers aw ON aw.email = (SELECT c.email FROM public.candidates c WHERE c.id = cw.candidate_id)
      WHERE cw.id = workflow_id
      AND aw.agency_id = get_agency_profile_id(auth.uid())
    )
  );

-- ─── Triggers ─────────────────────────────────────────────────────────────

CREATE TRIGGER update_candidate_workflow_timestamp
  BEFORE UPDATE ON public.candidate_workflow
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_documents_timestamp
  BEFORE UPDATE ON public.workflow_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── Seed Document Templates ──────────────────────────────────────────────

INSERT INTO public.document_templates (phase, document_name, description, is_required, sort_order) VALUES
  ('recruitment', 'CV/Resume', 'Updated curriculum vitae or resume', true, 1),
  ('recruitment', 'Professional Certificates', 'Relevant industry certifications', true, 2),
  ('recruitment', 'Educational Certificates', 'Diplomas, degrees, transcripts', true, 3),
  ('recruitment', 'Reference Letters', 'Employment reference letters', false, 4),
  ('recruitment', 'Portfolio', 'Work samples or portfolio (if applicable)', false, 5),
  ('documentation', 'Passport Copy', 'Valid passport bio-data page', true, 1),
  ('documentation', 'Passport Photos', '2 recent passport-size photos', true, 2),
  ('documentation', 'Birth Certificate', 'Original or certified copy', true, 3),
  ('documentation', 'Police Clearance', 'Criminal record check from country of origin', true, 4),
  ('documentation', 'Medical Certificate', 'Health examination certificate', true, 5),
  ('documentation', 'Employment Contract', 'Signed contract with employer', true, 6),
  ('documentation', 'Diploma Apostille', 'Apostilled educational certificates', false, 7),
  ('visa', 'Visa Application Form', 'Completed visa application', true, 1),
  ('visa', 'Work Permit', 'Work authorization document', true, 2),
  ('visa', 'Invitation Letter', 'Letter from employer', true, 3),
  ('visa', 'Proof of Accommodation', 'Housing arrangement in destination country', true, 4),
  ('visa', 'Financial Proof', 'Bank statements or financial guarantee', false, 5),
  ('visa', 'Travel Insurance', 'Valid travel/health insurance', true, 6),
  ('visa', 'Visa Approval', 'Visa approval letter/stamp', false, 7),
  ('arrival', 'Flight Ticket', 'Flight booking confirmation', true, 1),
  ('arrival', 'Arrival Confirmation', 'Confirmation of arrival in destination country', true, 2),
  ('arrival', 'Airport Pickup Details', 'Pickup arrangement confirmation', false, 3),
  ('arrival', 'Accommodation Check-in', 'Housing check-in confirmation', true, 4),
  ('residence_permit', 'Residence Permit Application', 'Completed application form', true, 1),
  ('residence_permit', 'Registered Address', 'Proof of local registration', true, 2),
  ('residence_permit', 'Biometric Data', 'Fingerprints/photo submission proof', true, 3),
  ('residence_permit', 'Residence Permit Card', 'Physical permit card (once issued)', false, 4),
  ('residence_permit', 'Social Security Registration', 'Registration confirmation', false, 5);

-- ─── Auto-advance phase trigger ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_phase_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_workflow public.candidate_workflow%ROWTYPE;
  v_required_count INTEGER;
  v_approved_count INTEGER;
  v_next_phase public.workflow_phase;
BEGIN
  SELECT * INTO v_workflow FROM public.candidate_workflow WHERE id = NEW.workflow_id;
  
  SELECT COUNT(*) INTO v_required_count
  FROM public.document_templates
  WHERE phase = v_workflow.current_phase AND is_required = true;
  
  SELECT COUNT(*) INTO v_approved_count
  FROM public.workflow_documents
  WHERE workflow_id = NEW.workflow_id
  AND phase = v_workflow.current_phase
  AND status = 'approved'
  AND template_id IN (
    SELECT id FROM public.document_templates
    WHERE phase = v_workflow.current_phase AND is_required = true
  );
  
  IF v_approved_count >= v_required_count THEN
    CASE v_workflow.current_phase
      WHEN 'recruitment' THEN
        v_next_phase := 'documentation';
        UPDATE public.candidate_workflow SET recruitment_completed_at = NOW() WHERE id = v_workflow.id;
      WHEN 'documentation' THEN
        IF v_workflow.workflow_type = 'no_visa' THEN
          v_next_phase := 'arrival';
        ELSE
          v_next_phase := 'visa';
        END IF;
        UPDATE public.candidate_workflow SET documentation_completed_at = NOW() WHERE id = v_workflow.id;
      WHEN 'visa' THEN
        v_next_phase := 'arrival';
        UPDATE public.candidate_workflow SET visa_completed_at = NOW() WHERE id = v_workflow.id;
      WHEN 'arrival' THEN
        v_next_phase := 'residence_permit';
        UPDATE public.candidate_workflow SET arrival_completed_at = NOW() WHERE id = v_workflow.id;
      WHEN 'residence_permit' THEN
        UPDATE public.candidate_workflow SET residence_permit_completed_at = NOW() WHERE id = v_workflow.id;
        RETURN NEW;
    END CASE;
    
    UPDATE public.candidate_workflow SET current_phase = v_next_phase WHERE id = v_workflow.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER auto_advance_phase
  AFTER INSERT OR UPDATE OF status ON public.workflow_documents
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION public.check_phase_completion();
