
-- Fix: Agency Own Workflow Health view with corrected FILTER syntax

CREATE OR REPLACE VIEW v_agency_own_workflow_health WITH (security_invoker = true) AS
SELECT
  aw.agency_id,
  cw.workflow_type,
  COUNT(*) as total_workflows,
  COUNT(*) FILTER (WHERE cw.residence_permit_completed_at IS NOT NULL) as completed_count,
  COUNT(*) FILTER (
    WHERE cw.updated_at < NOW() - INTERVAL '30 days' 
    AND cw.residence_permit_completed_at IS NULL
  ) as stalled_count,
  (AVG(
    EXTRACT(EPOCH FROM (cw.residence_permit_completed_at - cw.created_at)) / 86400
  ) FILTER (WHERE cw.residence_permit_completed_at IS NOT NULL))::INTEGER as avg_completion_days
FROM candidate_workflow cw
JOIN candidates c ON c.id = cw.candidate_id
JOIN agency_workers aw ON aw.email = c.email
GROUP BY aw.agency_id, cw.workflow_type;

GRANT SELECT ON v_agency_own_workflow_health TO authenticated;
