import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RecruitmentStage } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export interface PipelineCandidate {
  workflow_id: string;
  candidate_id: string;
  project_id: string;
  pipeline_stage: RecruitmentStage;
  current_phase: string;
  workflow_updated_at: string;
  // Joined candidate data
  full_name: string;
  email: string;
  phone: string | null;
  nationality: string | null;
  current_country: string | null;
  candidate_updated_at: string;
}

export function usePipelineCandidates(projectId: string | undefined) {
  return useQuery({
    queryKey: ['pipeline-candidates', projectId],
    queryFn: async (): Promise<PipelineCandidate[]> => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('candidate_workflow')
        .select(`
          id,
          candidate_id,
          project_id,
          pipeline_stage,
          current_phase,
          updated_at,
          candidate:candidates!candidate_workflow_candidate_id_fkey(
            full_name,
            email,
            phone,
            nationality,
            current_country,
            updated_at
          )
        `)
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        workflow_id: row.id,
        candidate_id: row.candidate_id,
        project_id: row.project_id,
        pipeline_stage: row.pipeline_stage as RecruitmentStage,
        current_phase: row.current_phase,
        workflow_updated_at: row.updated_at,
        full_name: row.candidate?.full_name || 'Unknown',
        email: row.candidate?.email || '',
        phone: row.candidate?.phone || null,
        nationality: row.candidate?.nationality || null,
        current_country: row.candidate?.current_country || null,
        candidate_updated_at: row.candidate?.updated_at || row.updated_at,
      }));
    },
    enabled: !!projectId,
  });
}

export function useUpdatePipelineStage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      workflowId,
      candidateId,
      fromStage,
      stage,
    }: {
      workflowId: string;
      candidateId: string;
      fromStage: RecruitmentStage;
      stage: RecruitmentStage;
    }) => {
      // 1. Update the pipeline stage and updated_at
      const { error } = await supabase
        .from('candidate_workflow')
        .update({ pipeline_stage: stage, updated_at: new Date().toISOString() })
        .eq('id', workflowId);
      if (error) throw error;

      // 1b. Sync candidate's global current_stage
      const { error: syncErr } = await supabase
        .from('candidates')
        .update({ current_stage: stage, updated_at: new Date().toISOString() })
        .eq('id', candidateId);
      if (syncErr) console.error('candidate sync error:', syncErr);

      // 2. Get current user for attribution
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 3. Log in stage_history
      const { error: histErr } = await supabase
        .from('stage_history')
        .insert({
          candidate_id: candidateId,
          from_stage: fromStage,
          to_stage: stage,
          changed_by: user.id,
          note: `Pipeline stage moved from ${fromStage.replace(/_/g, ' ')} to ${stage.replace(/_/g, ' ')}`,
        });
      if (histErr) console.error('stage_history insert error:', histErr);

      // 4. Log in candidate_activity_log
      const { error: actErr } = await supabase
        .from('candidate_activity_log')
        .insert({
          candidate_id: candidateId,
          actor_id: user.id,
          actor_type: 'staff',
          event_type: 'stage_change',
          is_shared_event: true,
          summary: `Pipeline stage changed from ${fromStage.replace(/_/g, ' ')} to ${stage.replace(/_/g, ' ')}`,
          details: { from_stage: fromStage, to_stage: stage, workflow_id: workflowId },
        } as any);
      if (actErr) console.error('activity_log insert error:', actErr);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['stage-history'] });
      queryClient.invalidateQueries({ queryKey: ['candidate-activity-log'] });
      queryClient.invalidateQueries({ queryKey: ['candidate'] });
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast({
        title: 'Pipeline stage updated',
        description: 'The candidate has been moved to the new stage.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update stage',
        description: error.message,
      });
    },
  });
}

export function useAddCandidateToPipeline() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      candidateId,
      projectId,
      stage = 'sourced' as RecruitmentStage,
    }: {
      candidateId: string;
      projectId: string;
      stage?: RecruitmentStage;
    }) => {
      // Check if candidate already in this project's pipeline
      const { data: existing } = await supabase
        .from('candidate_workflow')
        .select('id')
        .eq('candidate_id', candidateId)
        .eq('project_id', projectId)
        .limit(1);

      if (existing && existing.length > 0) {
        throw new Error('Candidate is already in this project pipeline');
      }

      const { error } = await supabase
        .from('candidate_workflow')
        .insert({
          candidate_id: candidateId,
          project_id: projectId,
          pipeline_stage: stage,
          current_phase: 'recruitment',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-candidates'] });
      toast({
        title: 'Candidate added to pipeline',
        description: 'The candidate has been added to the project pipeline.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to add candidate',
        description: error.message,
      });
    },
  });
}
