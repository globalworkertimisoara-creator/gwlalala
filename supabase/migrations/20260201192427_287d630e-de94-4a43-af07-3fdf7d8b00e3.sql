-- Create project assignments table (for individual + role assignments)
CREATE TABLE public.project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  assigned_user_id uuid,
  assigned_role public.app_role,
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assignment_target CHECK (
    (assigned_user_id IS NOT NULL AND assigned_role IS NULL) OR
    (assigned_user_id IS NULL AND assigned_role IS NOT NULL)
  )
);

-- Create job assignments table (for individual + role assignments)
CREATE TABLE public.job_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  assigned_user_id uuid,
  assigned_role public.app_role,
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assignment_target CHECK (
    (assigned_user_id IS NOT NULL AND assigned_role IS NULL) OR
    (assigned_user_id IS NULL AND assigned_role IS NOT NULL)
  )
);

-- Create activity log table for full audit trail
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  action public.activity_action NOT NULL,
  actor_id uuid,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create escalations table
CREATE TABLE public.escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES public.candidates(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  status public.escalation_status NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  escalated_by uuid,
  escalated_to_role public.app_role,
  escalated_to_user_id uuid,
  is_auto_escalated boolean NOT NULL DEFAULT false,
  auto_escalation_reason text,
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT escalation_target CHECK (project_id IS NOT NULL OR job_id IS NOT NULL)
);

-- Create auto-escalation rules table
CREATE TABLE public.auto_escalation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  entity_type text NOT NULL CHECK (entity_type IN ('project', 'job', 'candidate')),
  condition_field text NOT NULL,
  condition_value text,
  days_threshold integer NOT NULL DEFAULT 7,
  escalate_to_role public.app_role NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_project_assignments_project ON public.project_assignments(project_id);
CREATE INDEX idx_project_assignments_user ON public.project_assignments(assigned_user_id);
CREATE INDEX idx_project_assignments_role ON public.project_assignments(assigned_role);

CREATE INDEX idx_job_assignments_job ON public.job_assignments(job_id);
CREATE INDEX idx_job_assignments_user ON public.job_assignments(assigned_user_id);
CREATE INDEX idx_job_assignments_role ON public.job_assignments(assigned_role);

CREATE INDEX idx_activity_log_entity ON public.activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_project ON public.activity_log(project_id);
CREATE INDEX idx_activity_log_job ON public.activity_log(job_id);
CREATE INDEX idx_activity_log_created ON public.activity_log(created_at DESC);
CREATE INDEX idx_activity_log_actor ON public.activity_log(actor_id);

CREATE INDEX idx_escalations_project ON public.escalations(project_id);
CREATE INDEX idx_escalations_job ON public.escalations(job_id);
CREATE INDEX idx_escalations_status ON public.escalations(status);
CREATE INDEX idx_escalations_escalated_to ON public.escalations(escalated_to_user_id);

-- Enable RLS on all new tables
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_escalation_rules ENABLE ROW LEVEL SECURITY;