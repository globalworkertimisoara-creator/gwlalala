import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type WorkflowPhase = 
  | 'recruitment' 
  | 'documentation' 
  | 'visa' 
  | 'arrival' 
  | 'residence_permit';

export const WORKFLOW_PHASES: { id: WorkflowPhase; label: string }[] = [
  { id: 'recruitment', label: 'Recruitment' },
  { id: 'documentation', label: 'Documentation' },
  { id: 'visa', label: 'Visa' },
  { id: 'arrival', label: 'Arrival' },
  { id: 'residence_permit', label: 'Residence Permit' },
];

export interface ProjectWorkflowSummary {
  total: number;
  completed: number;
  completedPercentage: number;
  byPhase: Record<WorkflowPhase, { count: number; percentage: number }>;
}

export function useProjectWorkflows(projectId: string) {
  return useQuery({
    queryKey: ['project-workflows', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidate_workflow')
        .select(`
          id,
          candidate_id,
          current_phase,
          workflow_type,
          recruitment_completed_at,
          documentation_completed_at,
          visa_completed_at,
          arrival_completed_at,
          residence_permit_completed_at
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}

export function useProjectWorkflowSummary(projectId: string) {
  const { data: workflows, ...rest } = useProjectWorkflows(projectId);

  const summary: ProjectWorkflowSummary = (() => {
    const total = workflows?.length || 0;
    if (total === 0) {
      const emptyPhases = Object.fromEntries(
        WORKFLOW_PHASES.map(p => [p.id, { count: 0, percentage: 0 }])
      ) as Record<WorkflowPhase, { count: number; percentage: number }>;
      return { total: 0, completed: 0, completedPercentage: 0, byPhase: emptyPhases };
    }

    const completed = workflows!.filter(w => w.residence_permit_completed_at !== null).length;

    const byPhase = Object.fromEntries(
      WORKFLOW_PHASES.map(p => {
        const count = workflows!.filter(w => w.current_phase === p.id).length;
        return [p.id, { count, percentage: Math.round((count / total) * 100) }];
      })
    ) as Record<WorkflowPhase, { count: number; percentage: number }>;

    return {
      total,
      completed,
      completedPercentage: Math.round((completed / total) * 100),
      byPhase,
    };
  })();

  return { data: summary, workflows, ...rest };
}

export function useProjectWorkflowsByPhase(projectId: string, phase: WorkflowPhase) {
  return useQuery({
    queryKey: ['project-workflows-by-phase', projectId, phase],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidate_workflow')
        .select(`
          id,
          candidate_id,
          current_phase,
          workflow_type,
          recruitment_completed_at,
          documentation_completed_at,
          visa_completed_at,
          arrival_completed_at,
          residence_permit_completed_at,
          candidates!candidate_workflow_candidate_id_fkey (
            id,
            full_name,
            email,
            nationality,
            current_stage,
            phone,
            current_country
          )
        `)
        .eq('project_id', projectId)
        .eq('current_phase', phase);

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId && !!phase,
  });
}
