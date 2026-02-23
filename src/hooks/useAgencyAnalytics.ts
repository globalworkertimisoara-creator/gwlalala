/**
 * src/hooks/useAgencyAnalytics.ts
 *
 * React hooks for agency-specific analytics (agencies see ONLY their own data)
 * Accepts optional agencyId param for admin preview mode.
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

async function resolveAgencyId(overrideId?: string): Promise<string> {
  if (overrideId) return overrideId;
  return getAgencyId();
}

// ─── Agency Own Overview ──────────────────────────────────────────────────────

export function useAgencyOwnOverview(agencyId?: string) {
  return useQuery({
    queryKey: ['agency-analytics', 'overview', agencyId],
    queryFn: async () => {
      const id = await resolveAgencyId(agencyId);

      const { data, error } = await supabase
        .from('v_agency_own_overview' as any)
        .select('*')
        .eq('agency_id', id)
        .single();

      if (error) throw error;
      return data as any;
    },
    refetchInterval: 60000,
  });
}

// ─── Agency Own Pipeline Funnel ───────────────────────────────────────────────

export function useAgencyPipelineFunnel(agencyId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['agency-analytics', 'pipeline-funnel', agencyId, startDate, endDate],
    queryFn: async () => {
      const id = await resolveAgencyId(agencyId);

      const { data, error } = await (supabase.rpc as any)('get_agency_pipeline_funnel', {
        p_agency_id: id,
        p_start_date: startDate || null,
        p_end_date: endDate || new Date().toISOString(),
      });

      if (error) throw error;
      return data;
    },
  });
}

// ─── Agency Own Performance Metrics ───────────────────────────────────────────

export function useAgencyOwnMetrics(agencyId?: string) {
  return useQuery({
    queryKey: ['agency-analytics', 'metrics', agencyId],
    queryFn: async () => {
      const id = await resolveAgencyId(agencyId);

      const { data, error } = await (supabase.rpc as any)('get_agency_own_metrics', {
        p_agency_id: id,
      });

      if (error) throw error;
      return data;
    },
  });
}

// ─── Agency Own Projects ──────────────────────────────────────────────────────

export function useAgencyOwnProjects(agencyId?: string) {
  return useQuery({
    queryKey: ['agency-analytics', 'projects', agencyId],
    queryFn: async () => {
      const id = await resolveAgencyId(agencyId);

      const { data, error } = await supabase
        .from('v_agency_own_projects' as any)
        .select('*')
        .eq('agency_id', id)
        .order('candidates_submitted', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// ─── Agency Own Candidates by Country ─────────────────────────────────────────

export function useAgencyOwnCandidatesByCountry(agencyId?: string) {
  return useQuery({
    queryKey: ['agency-analytics', 'candidates-by-country', agencyId],
    queryFn: async () => {
      const id = await resolveAgencyId(agencyId);

      const { data, error } = await supabase
        .from('v_agency_own_candidates_by_country' as any)
        .select('*')
        .eq('agency_id', id)
        .order('candidate_count', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// ─── Agency Own Timeline ──────────────────────────────────────────────────────

export function useAgencyCandidatesTimeline(
  interval: 'day' | 'week' | 'month' = 'week',
  agencyId?: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['agency-analytics', 'timeline', interval, agencyId, startDate, endDate],
    queryFn: async () => {
      const id = await resolveAgencyId(agencyId);

      const { data, error } = await (supabase.rpc as any)('get_agency_candidates_timeline', {
        p_agency_id: id,
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

export function useAgencyOwnWorkflowHealth(agencyId?: string) {
  return useQuery({
    queryKey: ['agency-analytics', 'workflow-health', agencyId],
    queryFn: async () => {
      const id = await resolveAgencyId(agencyId);

      const { data, error } = await supabase
        .from('v_agency_own_workflow_health' as any)
        .select('*')
        .eq('agency_id', id);

      if (error) throw error;
      return data;
    },
  });
}
