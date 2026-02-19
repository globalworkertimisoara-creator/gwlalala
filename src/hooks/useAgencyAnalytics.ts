/**
 * src/hooks/useAgencyAnalytics.ts
 *
 * React hooks for agency-specific analytics (agencies see ONLY their own data)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Helper to get current user's agency profile ID
async function getAgencyId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('agency_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (error || !data?.id) throw new Error('No agency associated');
  return data.id;
}

// ─── Agency Own Overview ──────────────────────────────────────────────────────

export function useAgencyOwnOverview() {
  return useQuery({
    queryKey: ['agency-analytics', 'overview'],
    queryFn: async () => {
      const agencyId = await getAgencyId();

      const { data, error } = await supabase
        .from('v_agency_own_overview' as any)
        .select('*')
        .eq('agency_id', agencyId)
        .single();

      if (error) throw error;
      return data as any;
    },
    refetchInterval: 60000,
  });
}

// ─── Agency Own Pipeline Funnel ───────────────────────────────────────────────

export function useAgencyPipelineFunnel(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['agency-analytics', 'pipeline-funnel', startDate, endDate],
    queryFn: async () => {
      const agencyId = await getAgencyId();

      const { data, error } = await (supabase.rpc as any)('get_agency_pipeline_funnel', {
        p_agency_id: agencyId,
        p_start_date: startDate || null,
        p_end_date: endDate || new Date().toISOString(),
      });

      if (error) throw error;
      return data;
    },
  });
}

// ─── Agency Own Performance Metrics ───────────────────────────────────────────

export function useAgencyOwnMetrics() {
  return useQuery({
    queryKey: ['agency-analytics', 'metrics'],
    queryFn: async () => {
      const agencyId = await getAgencyId();

      const { data, error } = await (supabase.rpc as any)('get_agency_own_metrics', {
        p_agency_id: agencyId,
      });

      if (error) throw error;
      return data;
    },
  });
}

// ─── Agency Own Projects ──────────────────────────────────────────────────────

export function useAgencyOwnProjects() {
  return useQuery({
    queryKey: ['agency-analytics', 'projects'],
    queryFn: async () => {
      const agencyId = await getAgencyId();

      const { data, error } = await supabase
        .from('v_agency_own_projects' as any)
        .select('*')
        .eq('agency_id', agencyId)
        .order('candidates_submitted', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// ─── Agency Own Candidates by Country ─────────────────────────────────────────

export function useAgencyOwnCandidatesByCountry() {
  return useQuery({
    queryKey: ['agency-analytics', 'candidates-by-country'],
    queryFn: async () => {
      const agencyId = await getAgencyId();

      const { data, error } = await supabase
        .from('v_agency_own_candidates_by_country' as any)
        .select('*')
        .eq('agency_id', agencyId)
        .order('candidate_count', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// ─── Agency Own Timeline ──────────────────────────────────────────────────────

export function useAgencyCandidatesTimeline(
  interval: 'day' | 'week' | 'month' = 'week',
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['agency-analytics', 'timeline', interval, startDate, endDate],
    queryFn: async () => {
      const agencyId = await getAgencyId();

      const { data, error } = await (supabase.rpc as any)('get_agency_candidates_timeline', {
        p_agency_id: agencyId,
        p_interval: interval,
        p_start_date: startDate || new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: endDate || new Date().toISOString(),
      });

      if (error) throw error;
      return data;
    },
  });
}

// ─── Agency Own Workflow Health ───────────────────────────────────────────────

export function useAgencyOwnWorkflowHealth() {
  return useQuery({
    queryKey: ['agency-analytics', 'workflow-health'],
    queryFn: async () => {
      const agencyId = await getAgencyId();

      const { data, error } = await supabase
        .from('v_agency_own_workflow_health' as any)
        .select('*')
        .eq('agency_id', agencyId);

      if (error) throw error;
      return data;
    },
  });
}
