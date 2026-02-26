
-- Notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL, -- 'document_expiry', 'task_deadline', 'stage_change', 'contract_renewal', 'workflow_stall'
  in_app BOOLEAN NOT NULL DEFAULT true,
  email BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Scheduled reports table
CREATE TABLE public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL, -- 'candidate_pipeline', 'agency_performance', 'project_status', 'compliance', 'billing_summary'
  frequency TEXT NOT NULL DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  filters JSONB DEFAULT '{}'::jsonb,
  format TEXT NOT NULL DEFAULT 'csv', -- 'csv', 'pdf'
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scheduled reports"
  ON public.scheduled_reports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin can view all scheduled reports
CREATE POLICY "Admin views all scheduled reports"
  ON public.scheduled_reports FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_notification_preferences_user ON public.notification_preferences(user_id);
CREATE INDEX idx_scheduled_reports_user ON public.scheduled_reports(user_id);
CREATE INDEX idx_scheduled_reports_next_run ON public.scheduled_reports(next_run_at) WHERE is_active = true;

-- Triggers for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at
  BEFORE UPDATE ON public.scheduled_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
