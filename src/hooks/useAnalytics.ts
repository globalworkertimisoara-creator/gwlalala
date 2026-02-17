/**
 * src/hooks/useAnalytics.ts
 *
 * React hooks for fetching analytics and statistics data
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Helper to query views that aren't in generated types
async function queryView(viewName: string, options?: { orderBy?: string; ascending?: boolean }) {
  let query = supabase.from(viewName as any).select('*');
  if (options?.orderBy) {
    query = query.order(options.orderBy, { ascending: options.ascending ?? true });
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ─── System Overview ──────────────────────────────────────────────────────────

export function useSystemOverview() {
  return useQuery({
    queryKey: ['analytics', 'system-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_system_overview' as any)
        .select('*')
        .single();

      if (error) throw error;
      return data as any;
    },
    refetchInterval: 60000,
  });
}

// ─── Pipeline Analytics ───────────────────────────────────────────────────────

export function usePipelineFunnel(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['analytics', 'pipeline-funnel', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pipeline_funnel', {
        p_start_date: startDate || null,
        p_end_date: endDate || new Date().toISOString(),
      });

      if (error) throw error;
      return data;
    },
  });
}

export function usePipelinePhases() {
  return useQuery({
    queryKey: ['analytics', 'pipeline-phases'],
    queryFn: async () => queryView('v_pipeline_phase_counts'),
  });
}

export function useDocumentStatistics() {
  return useQuery({
    queryKey: ['analytics', 'document-stats'],
    queryFn: async () => queryView('v_document_statistics'),
  });
}

export function useWorkflowCompletion() {
  return useQuery({
    queryKey: ['analytics', 'workflow-completion'],
    queryFn: async () => queryView('v_workflow_completion'),
  });
}

export function useConversionRates() {
  return useQuery({
    queryKey: ['analytics', 'conversion-rates'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_conversion_rates');
      if (error) throw error;
      return data;
    },
  });
}

// ─── Project Analytics ────────────────────────────────────────────────────────

export function useProjectStatistics() {
  return useQuery({
    queryKey: ['analytics', 'project-stats'],
    queryFn: async () => queryView('v_project_statistics', { orderBy: 'total_candidates', ascending: false }),
  });
}

export function useProjectsByStatus() {
  return useQuery({
    queryKey: ['analytics', 'projects-by-status'],
    queryFn: async () => queryView('v_projects_by_status'),
  });
}

export function useProjectsByCountry() {
  return useQuery({
    queryKey: ['analytics', 'projects-by-country'],
    queryFn: async () => queryView('v_projects_by_country'),
  });
}

export function useProjectMetrics(projectId: string) {
  return useQuery({
    queryKey: ['analytics', 'project-metrics', projectId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_project_metrics', {
        p_project_id: projectId,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

// ─── Job Analytics ────────────────────────────────────────────────────────────

export function useJobStatistics() {
  return useQuery({
    queryKey: ['analytics', 'job-stats'],
    queryFn: async () => queryView('v_job_statistics', { orderBy: 'total_applications', ascending: false }),
  });
}

export function useJobsByStatus() {
  return useQuery({
    queryKey: ['analytics', 'jobs-by-status'],
    queryFn: async () => queryView('v_jobs_by_status'),
  });
}

export function useJobsByCountry() {
  return useQuery({
    queryKey: ['analytics', 'jobs-by-country'],
    queryFn: async () => queryView('v_jobs_by_country'),
  });
}

export function useTopPositions() {
  return useQuery({
    queryKey: ['analytics', 'top-positions'],
    queryFn: async () => queryView('v_top_positions'),
  });
}

// ─── Agency Analytics ─────────────────────────────────────────────────────────

export function useAgencyPerformance() {
  return useQuery({
    queryKey: ['analytics', 'agency-performance'],
    queryFn: async () => queryView('v_agency_performance', { orderBy: 'success_rate', ascending: false }),
  });
}

export function useTopAgencies() {
  return useQuery({
    queryKey: ['analytics', 'top-agencies'],
    queryFn: async () => queryView('v_top_agencies'),
  });
}

// ─── Time-Series Analytics ────────────────────────────────────────────────────

export function useCandidatesTimeline(
  interval: 'day' | 'week' | 'month' = 'week',
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['analytics', 'candidates-timeline', interval, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_candidates_timeline', {
        p_interval: interval,
        p_start_date: startDate || new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: endDate || new Date().toISOString(),
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useProjectsTimeline(
  interval: 'day' | 'week' | 'month' = 'month',
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['analytics', 'projects-timeline', interval, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_projects_timeline', {
        p_interval: interval,
        p_start_date: startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: endDate || new Date().toISOString(),
      });
      if (error) throw error;
      return data;
    },
  });
}
