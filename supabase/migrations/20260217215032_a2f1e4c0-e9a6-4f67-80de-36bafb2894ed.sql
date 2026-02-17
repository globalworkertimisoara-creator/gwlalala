
-- Fix security definer views to use SECURITY INVOKER
ALTER VIEW v_pipeline_phase_counts SET (security_invoker = true);
ALTER VIEW v_document_statistics SET (security_invoker = true);
ALTER VIEW v_workflow_completion SET (security_invoker = true);
ALTER VIEW v_project_statistics SET (security_invoker = true);
ALTER VIEW v_projects_by_status SET (security_invoker = true);
ALTER VIEW v_projects_by_country SET (security_invoker = true);
ALTER VIEW v_job_statistics SET (security_invoker = true);
ALTER VIEW v_jobs_by_status SET (security_invoker = true);
ALTER VIEW v_jobs_by_country SET (security_invoker = true);
ALTER VIEW v_top_positions SET (security_invoker = true);
ALTER VIEW v_agency_performance SET (security_invoker = true);
ALTER VIEW v_top_agencies SET (security_invoker = true);
ALTER VIEW v_system_overview SET (security_invoker = true);
