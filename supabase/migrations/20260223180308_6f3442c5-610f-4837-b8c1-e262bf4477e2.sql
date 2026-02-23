
-- ============================================================
-- 1. v_agency_own_overview – one row per agency with summary stats
-- ============================================================
CREATE OR REPLACE VIEW public.v_agency_own_overview AS
SELECT
  ap.id AS agency_id,
  COALESCE(w.total, 0)                          AS total_candidates,
  COALESCE(w.last30, 0)                         AS candidates_last_30_days,
  COALESCE(proj.cnt, 0)                         AS active_projects,
  COALESCE(placed.cnt, 0)                       AS completed_placements,
  COALESCE(docs.pending, 0)                     AS pending_documents,
  COALESCE(stalled.cnt, 0)                      AS stalled_workflows
FROM public.agency_profiles ap
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::BIGINT AS total,
    COUNT(*) FILTER (WHERE aw.submitted_at >= NOW() - INTERVAL '30 days')::BIGINT AS last30
  FROM public.agency_workers aw WHERE aw.agency_id = ap.id
) w ON true
LEFT JOIN LATERAL (
  SELECT COUNT(DISTINCT j.project_id)::BIGINT AS cnt
  FROM public.agency_workers aw
  JOIN public.jobs j ON j.id = aw.job_id
  WHERE aw.agency_id = ap.id AND j.project_id IS NOT NULL
) proj ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::BIGINT AS cnt
  FROM public.agency_workers aw
  WHERE aw.agency_id = ap.id AND aw.current_stage = 'placed'
) placed ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::BIGINT AS pending
  FROM public.agency_workers aw
  JOIN public.candidates c ON c.email = aw.email
  JOIN public.candidate_workflow cw ON cw.candidate_id = c.id
  JOIN public.workflow_documents wd ON wd.workflow_id = cw.id
  WHERE aw.agency_id = ap.id AND wd.status = 'pending'
) docs ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::BIGINT AS cnt
  FROM public.agency_workers aw
  JOIN public.candidates c ON c.email = aw.email
  JOIN public.candidate_workflow cw ON cw.candidate_id = c.id
  WHERE aw.agency_id = ap.id
    AND cw.residence_permit_completed_at IS NULL
    AND cw.created_at < NOW() - INTERVAL '90 days'
) stalled ON true;

-- ============================================================
-- 2. v_agency_own_projects – project-level stats for an agency
-- ============================================================
CREATE OR REPLACE VIEW public.v_agency_own_projects AS
SELECT
  aw.agency_id,
  p.id AS project_id,
  p.name AS project_name,
  p.location AS country,
  p.status,
  COUNT(*)::BIGINT AS candidates_submitted,
  COUNT(*) FILTER (WHERE aw.current_stage = 'placed')::BIGINT AS candidates_placed,
  CASE WHEN COUNT(*) > 0
    THEN ROUND((COUNT(*) FILTER (WHERE aw.current_stage = 'placed')::NUMERIC / COUNT(*)) * 100, 1)
    ELSE 0
  END AS placement_rate,
  AVG(
    CASE WHEN aw.current_stage = 'placed'
      THEN EXTRACT(EPOCH FROM (aw.updated_at - aw.submitted_at)) / 86400
    END
  )::INTEGER AS avg_days_to_placement
FROM public.agency_workers aw
JOIN public.jobs j ON j.id = aw.job_id
JOIN public.projects p ON p.id = j.project_id
GROUP BY aw.agency_id, p.id, p.name, p.location, p.status;

-- ============================================================
-- 3. v_agency_own_candidates_by_country – nationality breakdown
-- ============================================================
CREATE OR REPLACE VIEW public.v_agency_own_candidates_by_country AS
SELECT
  aw.agency_id,
  aw.nationality AS country,
  COUNT(*)::BIGINT AS candidate_count,
  COUNT(*) FILTER (WHERE aw.current_stage = 'placed')::BIGINT AS placed_count
FROM public.agency_workers aw
GROUP BY aw.agency_id, aw.nationality;

-- ============================================================
-- 4. get_agency_pipeline_funnel RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_agency_pipeline_funnel(
  p_agency_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(phase TEXT, count BIGINT, percentage NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  total_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM agency_workers aw
  JOIN candidates c ON c.email = aw.email
  JOIN candidate_workflow cw ON cw.candidate_id = c.id
  WHERE aw.agency_id = p_agency_id
    AND cw.created_at >= COALESCE(p_start_date, '2000-01-01'::TIMESTAMPTZ)
    AND cw.created_at <= p_end_date;

  RETURN QUERY
  SELECT
    cw.current_phase::TEXT,
    COUNT(*)::BIGINT,
    ROUND((COUNT(*)::NUMERIC / NULLIF(total_count, 0) * 100), 2)
  FROM agency_workers aw
  JOIN candidates c ON c.email = aw.email
  JOIN candidate_workflow cw ON cw.candidate_id = c.id
  WHERE aw.agency_id = p_agency_id
    AND cw.created_at >= COALESCE(p_start_date, '2000-01-01'::TIMESTAMPTZ)
    AND cw.created_at <= p_end_date
  GROUP BY cw.current_phase
  ORDER BY
    CASE cw.current_phase
      WHEN 'recruitment'      THEN 1
      WHEN 'documentation'    THEN 2
      WHEN 'visa'             THEN 3
      WHEN 'arrival'          THEN 4
      WHEN 'residence_permit' THEN 5
    END;
END;
$$;

-- ============================================================
-- 5. get_agency_own_metrics RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_agency_own_metrics(p_agency_id UUID)
RETURNS TABLE(metric_name TEXT, metric_value NUMERIC, metric_unit TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 'Total Workers'::TEXT, COUNT(*)::NUMERIC, 'count'::TEXT
  FROM agency_workers WHERE agency_id = p_agency_id

  UNION ALL

  SELECT 'Placed'::TEXT, COUNT(*)::NUMERIC, 'count'::TEXT
  FROM agency_workers WHERE agency_id = p_agency_id AND current_stage = 'placed'

  UNION ALL

  SELECT 'Avg Processing Days'::TEXT,
    AVG(EXTRACT(EPOCH FROM (updated_at - submitted_at)) / 86400)::NUMERIC,
    'days'::TEXT
  FROM agency_workers WHERE agency_id = p_agency_id AND current_stage = 'placed';
END;
$$;

-- ============================================================
-- 6. get_agency_candidates_timeline RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_agency_candidates_timeline(
  p_agency_id  UUID,
  p_interval   TEXT DEFAULT 'week',
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '6 months',
  p_end_date   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(period TIMESTAMPTZ, candidate_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc(p_interval, aw.submitted_at) AS period,
    COUNT(*)::BIGINT
  FROM agency_workers aw
  WHERE aw.agency_id = p_agency_id
    AND aw.submitted_at >= p_start_date
    AND aw.submitted_at <= p_end_date
  GROUP BY date_trunc(p_interval, aw.submitted_at)
  ORDER BY period;
END;
$$;
