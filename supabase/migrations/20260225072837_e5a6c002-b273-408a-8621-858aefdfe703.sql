
-- =====================================================
-- Phase 1: Performance Indexes
-- =====================================================

-- Candidates indexes
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_current_stage ON public.candidates(current_stage);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON public.candidates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidates_added_by ON public.candidates(added_by);

-- Agency workers indexes
CREATE INDEX IF NOT EXISTS idx_agency_workers_agency_stage ON public.agency_workers(agency_id, current_stage);
CREATE INDEX IF NOT EXISTS idx_agency_workers_email ON public.agency_workers(email);
CREATE INDEX IF NOT EXISTS idx_agency_workers_job_id ON public.agency_workers(job_id);
CREATE INDEX IF NOT EXISTS idx_agency_workers_submitted_at ON public.agency_workers(submitted_at DESC);

-- Candidate workflow indexes
CREATE INDEX IF NOT EXISTS idx_candidate_workflow_candidate ON public.candidate_workflow(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_workflow_project_phase ON public.candidate_workflow(project_id, current_phase);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON public.jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_candidate_id ON public.documents(candidate_id);

-- Stage history indexes
CREATE INDEX IF NOT EXISTS idx_stage_history_candidate_changed ON public.stage_history(candidate_id, changed_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON public.activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_project ON public.activity_log(project_id);

-- Candidate job links indexes
CREATE INDEX IF NOT EXISTS idx_candidate_job_links_candidate ON public.candidate_job_links(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_job_links_job ON public.candidate_job_links(job_id);

-- Billing indexes
CREATE INDEX IF NOT EXISTS idx_billing_records_agency ON public.billing_records(agency_id);
CREATE INDEX IF NOT EXISTS idx_billing_records_candidate ON public.billing_records(candidate_id);
CREATE INDEX IF NOT EXISTS idx_billing_payments_record ON public.billing_payments(billing_record_id);

-- Workflow documents indexes
CREATE INDEX IF NOT EXISTS idx_workflow_documents_workflow ON public.workflow_documents(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_documents_phase ON public.workflow_documents(workflow_id, phase);

-- Project assignments indexes
CREATE INDEX IF NOT EXISTS idx_project_assignments_project ON public.project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_user ON public.project_assignments(assigned_user_id);

-- Job assignments indexes
CREATE INDEX IF NOT EXISTS idx_job_assignments_job ON public.job_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_user ON public.job_assignments(assigned_user_id);

-- Escalations indexes
CREATE INDEX IF NOT EXISTS idx_escalations_status ON public.escalations(status);
CREATE INDEX IF NOT EXISTS idx_escalations_project ON public.escalations(project_id);

-- =====================================================
-- Phase 1: Storage Metadata Table (Hybrid Storage)
-- =====================================================

CREATE TABLE public.storage_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL, -- 'candidate', 'agency_worker', 'project', 'contract'
  entity_id uuid NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  storage_backend text NOT NULL DEFAULT 'supabase', -- 'supabase' or 'google_drive'
  storage_path text NOT NULL, -- bucket path or Drive file ID
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_storage_metadata_entity ON public.storage_metadata(entity_type, entity_id);
CREATE INDEX idx_storage_metadata_backend ON public.storage_metadata(storage_backend);

ALTER TABLE public.storage_metadata ENABLE ROW LEVEL SECURITY;

-- Staff can see all files
CREATE POLICY "Staff can view all storage metadata"
  ON public.storage_metadata FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- Staff can create file records
CREATE POLICY "Staff can create storage metadata"
  ON public.storage_metadata FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()));

-- Admins can delete
CREATE POLICY "Admins can delete storage metadata"
  ON public.storage_metadata FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Agencies can view their own entity files
CREATE POLICY "Agencies can view own storage metadata"
  ON public.storage_metadata FOR SELECT
  USING (
    is_agency(auth.uid()) AND entity_type = 'agency_worker' AND entity_id IN (
      SELECT id FROM public.agency_workers WHERE agency_id = get_agency_profile_id(auth.uid())
    )
  );

-- Agencies can upload files for their workers
CREATE POLICY "Agencies can create own storage metadata"
  ON public.storage_metadata FOR INSERT
  WITH CHECK (
    is_agency(auth.uid()) AND entity_type = 'agency_worker' AND entity_id IN (
      SELECT id FROM public.agency_workers WHERE agency_id = get_agency_profile_id(auth.uid())
    )
  );

-- =====================================================
-- Phase 2: Tasks Table
-- =====================================================

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  task_type text NOT NULL DEFAULT 'general', -- 'document_review', 'candidate_follow_up', 'visa_check', 'general'
  priority text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  status text NOT NULL DEFAULT 'todo', -- 'todo', 'in_progress', 'done', 'cancelled'
  assigned_to uuid, -- user_id
  assigned_role app_role, -- role-based assignment
  due_date timestamptz,
  completed_at timestamptz,
  entity_type text, -- 'candidate', 'job', 'project', 'workflow'
  entity_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_entity ON public.tasks(entity_type, entity_id);
CREATE INDEX idx_tasks_assigned_role ON public.tasks(assigned_role);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Staff can view all tasks
CREATE POLICY "Staff can view all tasks"
  ON public.tasks FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- Staff can create tasks
CREATE POLICY "Staff can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- Staff can update tasks
CREATE POLICY "Staff can update tasks"
  ON public.tasks FOR UPDATE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- Admins can delete tasks
CREATE POLICY "Admins can delete tasks"
  ON public.tasks FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Agencies can view tasks linked to their workers
CREATE POLICY "Agencies can view own tasks"
  ON public.tasks FOR SELECT
  USING (
    is_agency(auth.uid()) AND entity_type = 'agency_worker' AND entity_id IN (
      SELECT id FROM public.agency_workers WHERE agency_id = get_agency_profile_id(auth.uid())
    )
  );

-- Employers can view tasks for their projects
CREATE POLICY "Employers can view project tasks"
  ON public.tasks FOR SELECT
  USING (
    is_employer(auth.uid()) AND entity_type = 'project' AND has_employer_project_access(auth.uid(), entity_id)
  );

-- Trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for tasks (for live collaboration)
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;

-- =====================================================
-- Phase 3: Contracts Table
-- =====================================================

CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_type text NOT NULL, -- 'employer_agreement', 'agency_agreement', 'worker_contract', 'service_agreement'
  party_type text NOT NULL, -- 'employer', 'agency', 'worker'
  party_id uuid NOT NULL, -- company_id, agency_id, or candidate_id
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'signed', 'active', 'expired', 'terminated'
  start_date date,
  end_date date,
  renewal_date date,
  auto_renew boolean DEFAULT false,
  total_value numeric,
  currency text DEFAULT 'EUR',
  storage_path text, -- link to uploaded contract file
  signed_by_party_at timestamptz,
  signed_by_staff_at timestamptz,
  notes text,
  project_id uuid,
  job_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contracts_party ON public.contracts(party_type, party_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contracts_end_date ON public.contracts(end_date);
CREATE INDEX idx_contracts_project ON public.contracts(project_id);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Staff can view all contracts
CREATE POLICY "Staff can view all contracts"
  ON public.contracts FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- Staff can create contracts
CREATE POLICY "Staff can create contracts"
  ON public.contracts FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- Staff can update contracts
CREATE POLICY "Staff can update contracts"
  ON public.contracts FOR UPDATE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- Admins can delete contracts
CREATE POLICY "Admins can delete contracts"
  ON public.contracts FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Agencies can view their own contracts
CREATE POLICY "Agencies can view own contracts"
  ON public.contracts FOR SELECT
  USING (
    is_agency(auth.uid()) AND party_type = 'agency' AND party_id = get_agency_profile_id(auth.uid())
  );

-- Employers can view their own contracts
CREATE POLICY "Employers can view own contracts"
  ON public.contracts FOR SELECT
  USING (
    is_employer(auth.uid()) AND party_type = 'employer' AND party_id = get_employer_company_id(auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
