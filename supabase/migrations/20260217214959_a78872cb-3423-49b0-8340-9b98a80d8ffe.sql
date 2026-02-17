
-- ============================================================================
-- ANALYTICS SYSTEM - DATABASE VIEWS & FUNCTIONS (ADAPTED)
-- ============================================================================

-- ─── Pipeline Analytics ───────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_pipeline_phase_counts AS
SELECT 
  current_phase,
  workflow_type,
  COUNT(*) as candidate_count,
  (AVG(EXTRACT(EPOCH FROM (COALESCE(
    recruitment_completed_at,
    documentation_completed_at,
    visa_completed_at,
    arrival_completed_at,
    residence_permit_completed_at,
    NOW()
  ) - created_at)) / 86400))::INTEGER as avg_days_in_pipeline
FROM candidate_workflow
GROUP BY current_phase, workflow_type;

CREATE OR REPLACE VIEW v_document_statistics AS
SELECT 
  phase,
  status,
  COUNT(*) as document_count,
  (AVG(EXTRACT(EPOCH FROM (reviewed_at - uploaded_at)) / 3600))::INTEGER as avg_review_hours
FROM workflow_documents
WHERE uploaded_at IS NOT NULL
GROUP BY phase, status;

CREATE OR REPLACE VIEW v_workflow_completion AS
SELECT
  workflow_type,
  COUNT(*) as total_workflows,
  COUNT(*) FILTER (WHERE residence_permit_completed_at IS NOT NULL) as completed_count,
  COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '30 days' 
    AND residence_permit_completed_at IS NULL) as stalled_count,
  (AVG(EXTRACT(EPOCH FROM (residence_permit_completed_at - created_at)) / 86400) 
    FILTER (WHERE residence_permit_completed_at IS NOT NULL))::INTEGER as avg_completion_days
FROM candidate_workflow
GROUP BY workflow_type;

CREATE OR REPLACE FUNCTION get_pipeline_funnel(
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  phase TEXT,
  count BIGINT,
  percentage NUMERIC
) AS $$
DECLARE
  total_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM candidate_workflow
  WHERE created_at >= COALESCE(p_start_date, '2000-01-01'::TIMESTAMPTZ)
    AND created_at <= p_end_date;

  RETURN QUERY
  SELECT 
    cw.current_phase::TEXT,
    COUNT(*)::BIGINT,
    ROUND((COUNT(*)::NUMERIC / NULLIF(total_count, 0) * 100), 2)
  FROM candidate_workflow cw
  WHERE cw.created_at >= COALESCE(p_start_date, '2000-01-01'::TIMESTAMPTZ)
    AND cw.created_at <= p_end_date
  GROUP BY cw.current_phase
  ORDER BY 
    CASE cw.current_phase
      WHEN 'recruitment' THEN 1
      WHEN 'documentation' THEN 2
      WHEN 'visa' THEN 3
      WHEN 'arrival' THEN 4
      WHEN 'residence_permit' THEN 5
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── Project Analytics ────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_project_statistics AS
SELECT 
  p.id,
  p.name,
  p.status::TEXT as status,
  p.location as country,
  p.contract_signed_at as start_date,
  c.company_name as employer_name,
  COUNT(DISTINCT cw.candidate_id) as total_candidates,
  COUNT(DISTINCT cw.candidate_id) FILTER (
    WHERE cw.residence_permit_completed_at IS NOT NULL
  ) as completed_candidates,
  CASE WHEN COUNT(DISTINCT cw.candidate_id) > 0 
    THEN ROUND(COUNT(DISTINCT cw.candidate_id) FILTER (WHERE cw.residence_permit_completed_at IS NOT NULL)::NUMERIC / COUNT(DISTINCT cw.candidate_id) * 100, 1)
    ELSE 0 
  END as fill_percentage,
  COUNT(DISTINCT aw.agency_id) as agencies_involved,
  (AVG(EXTRACT(EPOCH FROM (cw.residence_permit_completed_at - cw.created_at)) / 86400)
    FILTER (WHERE cw.residence_permit_completed_at IS NOT NULL))::INTEGER as avg_days_to_completion
FROM projects p
LEFT JOIN companies c ON c.id = p.company_id
LEFT JOIN candidate_workflow cw ON cw.project_id = p.id
LEFT JOIN candidates ca ON ca.id = cw.candidate_id
LEFT JOIN agency_workers aw ON aw.email = ca.email
GROUP BY p.id, p.name, p.status, p.location, p.contract_signed_at, c.company_name;

CREATE OR REPLACE VIEW v_projects_by_status AS
SELECT 
  status::TEXT as status,
  COUNT(*) as project_count
FROM projects
GROUP BY status;

CREATE OR REPLACE VIEW v_projects_by_country AS
SELECT 
  location as country,
  COUNT(*) as project_count,
  COUNT(*) FILTER (WHERE status = 'active') as active_projects
FROM projects
GROUP BY location
ORDER BY project_count DESC;

-- ─── Job Analytics ────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_job_statistics AS
SELECT 
  j.id,
  j.title,
  j.status::TEXT as status,
  j.country,
  j.client_company,
  COUNT(DISTINCT cjl.candidate_id) as total_applications,
  COUNT(DISTINCT cjl.candidate_id) FILTER (
    WHERE cjl.current_status = 'placed'
  ) as placed_count,
  COUNT(DISTINCT cjl.candidate_id) FILTER (
    WHERE cjl.current_status = 'interviewing'
  ) as interviewing_count,
  EXTRACT(EPOCH FROM (NOW() - j.created_at)) / 86400 as days_open
FROM jobs j
LEFT JOIN candidate_job_links cjl ON cjl.job_id = j.id
GROUP BY j.id, j.title, j.status, j.country, j.client_company, j.created_at;

CREATE OR REPLACE VIEW v_jobs_by_status AS
SELECT 
  status::TEXT as status,
  COUNT(*) as job_count
FROM jobs
GROUP BY status;

CREATE OR REPLACE VIEW v_jobs_by_country AS
SELECT 
  country,
  COUNT(*) as job_count,
  COUNT(*) FILTER (WHERE status = 'open') as open_jobs,
  (AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400) 
    FILTER (WHERE status = 'open'))::INTEGER as avg_days_open
FROM jobs
GROUP BY country
ORDER BY job_count DESC;

CREATE OR REPLACE VIEW v_top_positions AS
SELECT 
  j.title,
  COUNT(DISTINCT j.id) as job_postings,
  COUNT(DISTINCT cjl.candidate_id) as total_applications,
  COUNT(DISTINCT cjl.candidate_id)::NUMERIC / NULLIF(COUNT(DISTINCT j.id), 0) 
    as avg_applications_per_posting
FROM jobs j
LEFT JOIN candidate_job_links cjl ON cjl.job_id = j.id
GROUP BY j.title
ORDER BY job_postings DESC
LIMIT 10;

-- ─── Agency Analytics ─────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_agency_performance AS
SELECT 
  a.id,
  a.company_name as agency_name,
  COUNT(DISTINCT aw.id) as total_candidates_submitted,
  COUNT(DISTINCT aw.id) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM candidates c
      JOIN candidate_workflow cw ON cw.candidate_id = c.id
      WHERE c.email = aw.email
        AND cw.residence_permit_completed_at IS NOT NULL
    )
  ) as successful_placements,
  CASE WHEN COUNT(DISTINCT aw.id) > 0 THEN
    ROUND(COUNT(DISTINCT aw.id) FILTER (
      WHERE EXISTS (
        SELECT 1 FROM candidates c
        JOIN candidate_workflow cw ON cw.candidate_id = c.id
        WHERE c.email = aw.email
          AND cw.residence_permit_completed_at IS NOT NULL
      )
    )::NUMERIC / COUNT(DISTINCT aw.id) * 100, 2)
  ELSE 0 END as success_rate,
  COUNT(DISTINCT cw2.project_id) as projects_involved
FROM agency_profiles a
LEFT JOIN agency_workers aw ON aw.agency_id = a.id
LEFT JOIN candidates c2 ON c2.email = aw.email
LEFT JOIN candidate_workflow cw2 ON cw2.candidate_id = c2.id
GROUP BY a.id, a.company_name;

CREATE OR REPLACE VIEW v_top_agencies AS
SELECT 
  agency_name,
  successful_placements,
  success_rate
FROM v_agency_performance
WHERE total_candidates_submitted >= 1
ORDER BY success_rate DESC, successful_placements DESC
LIMIT 10;

-- ─── Time-Series Analytics ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_candidates_timeline(
  p_interval TEXT DEFAULT 'week',
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '6 months',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  period TIMESTAMPTZ,
  candidate_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc(p_interval, c.created_at) as period,
    COUNT(*)::BIGINT
  FROM candidates c
  WHERE c.created_at >= p_start_date 
    AND c.created_at <= p_end_date
  GROUP BY date_trunc(p_interval, c.created_at)
  ORDER BY period;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_projects_timeline(
  p_interval TEXT DEFAULT 'month',
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '1 year',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  period TIMESTAMPTZ,
  project_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc(p_interval, p.created_at) as period,
    COUNT(*)::BIGINT
  FROM projects p
  WHERE p.created_at >= p_start_date 
    AND p.created_at <= p_end_date
  GROUP BY date_trunc(p_interval, p.created_at)
  ORDER BY period;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_project_metrics(p_project_id UUID)
RETURNS TABLE (
  metric_name TEXT,
  metric_value NUMERIC,
  metric_unit TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Total Candidates'::TEXT,
    COUNT(DISTINCT cw.candidate_id)::NUMERIC,
    'count'::TEXT
  FROM candidate_workflow cw
  WHERE cw.project_id = p_project_id
  
  UNION ALL
  
  SELECT 
    'Completed'::TEXT,
    COUNT(DISTINCT cw.candidate_id)::NUMERIC,
    'count'::TEXT
  FROM candidate_workflow cw
  WHERE cw.project_id = p_project_id 
    AND cw.residence_permit_completed_at IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'Avg Days to Complete'::TEXT,
    AVG(EXTRACT(EPOCH FROM (cw.residence_permit_completed_at - cw.created_at)) / 86400)::NUMERIC,
    'days'::TEXT
  FROM candidate_workflow cw
  WHERE cw.project_id = p_project_id 
    AND cw.residence_permit_completed_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── Cross-Cutting Analytics ──────────────────────────────────────────────

CREATE OR REPLACE VIEW v_system_overview AS
SELECT 
  (SELECT COUNT(*) FROM candidates) as total_candidates,
  (SELECT COUNT(*) FROM candidates WHERE created_at > NOW() - INTERVAL '30 days') 
    as candidates_last_30_days,
  (SELECT COUNT(*) FROM projects WHERE status = 'active') as active_projects,
  (SELECT COUNT(*) FROM jobs WHERE status = 'open') as open_jobs,
  (SELECT COUNT(*) FROM agency_profiles) as active_agencies,
  (SELECT COUNT(*) FROM candidate_workflow 
    WHERE residence_permit_completed_at IS NOT NULL) as completed_workflows,
  (SELECT COUNT(*) FROM workflow_documents WHERE status = 'pending') 
    as pending_documents,
  (SELECT COUNT(*) FROM candidate_workflow 
    WHERE updated_at < NOW() - INTERVAL '30 days' 
      AND residence_permit_completed_at IS NULL) as stalled_workflows;

CREATE OR REPLACE FUNCTION get_conversion_rates()
RETURNS TABLE (
  from_phase TEXT,
  to_phase TEXT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH phase_counts AS (
    SELECT 
      cw.current_phase,
      COUNT(*) as cnt,
      COUNT(*) FILTER (WHERE cw.recruitment_completed_at IS NOT NULL) as recruitment_completed,
      COUNT(*) FILTER (WHERE cw.documentation_completed_at IS NOT NULL) as documentation_completed,
      COUNT(*) FILTER (WHERE cw.visa_completed_at IS NOT NULL) as visa_completed,
      COUNT(*) FILTER (WHERE cw.arrival_completed_at IS NOT NULL) as arrival_completed,
      COUNT(*) FILTER (WHERE cw.residence_permit_completed_at IS NOT NULL) as residence_permit_completed
    FROM candidate_workflow cw
    GROUP BY cw.current_phase
  )
  SELECT 
    'Recruitment'::TEXT,
    'Documentation'::TEXT,
    ROUND((SUM(pc.documentation_completed)::NUMERIC / NULLIF(SUM(pc.cnt), 0) * 100), 2)
  FROM phase_counts pc WHERE pc.current_phase IN ('recruitment', 'documentation', 'visa', 'arrival', 'residence_permit')
  
  UNION ALL
  
  SELECT 
    'Documentation'::TEXT,
    'Visa'::TEXT,
    ROUND((SUM(pc.visa_completed)::NUMERIC / NULLIF(SUM(pc.documentation_completed), 0) * 100), 2)
  FROM phase_counts pc WHERE pc.current_phase IN ('documentation', 'visa', 'arrival', 'residence_permit')
  
  UNION ALL
  
  SELECT 
    'Visa'::TEXT,
    'Arrival'::TEXT,
    ROUND((SUM(pc.arrival_completed)::NUMERIC / NULLIF(SUM(pc.visa_completed), 0) * 100), 2)
  FROM phase_counts pc WHERE pc.current_phase IN ('visa', 'arrival', 'residence_permit')
  
  UNION ALL
  
  SELECT 
    'Arrival'::TEXT,
    'Residence Permit'::TEXT,
    ROUND((SUM(pc.residence_permit_completed)::NUMERIC / NULLIF(SUM(pc.arrival_completed), 0) * 100), 2)
  FROM phase_counts pc WHERE pc.current_phase IN ('arrival', 'residence_permit');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── Indexes for Performance ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_candidate_workflow_created ON candidate_workflow(created_at);
CREATE INDEX IF NOT EXISTS idx_candidates_created ON candidates(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_created ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_workflow_documents_phase_status ON workflow_documents(phase, status);
