
-- Fix security definer views by recreating with security_invoker=on

CREATE OR REPLACE VIEW public.v_agency_own_overview
WITH (security_invoker=on) AS
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

CREATE OR REPLACE VIEW public.v_agency_own_projects
WITH (security_invoker=on) AS
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

CREATE OR REPLACE VIEW public.v_agency_own_candidates_by_country
WITH (security_invoker=on) AS
SELECT
  aw.agency_id,
  aw.nationality AS country,
  COUNT(*)::BIGINT AS candidate_count,
  COUNT(*) FILTER (WHERE aw.current_stage = 'placed')::BIGINT AS placed_count
FROM public.agency_workers aw
GROUP BY aw.agency_id, aw.nationality;
