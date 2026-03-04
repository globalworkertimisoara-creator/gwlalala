import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectWithMetrics, ProjectStatus, WorkflowType } from '@/types/project';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays } from 'date-fns';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<ProjectWithMetrics[]> => {
      // Fetch projects
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch jobs with their candidate counts
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          status,
          project_id,
          candidate_job_links(
            id,
            current_status
          )
        `);

      if (jobsError) throw jobsError;

      // Calculate metrics for each project
      return (projects as Project[]).map(project => {
        const projectJobs = jobs?.filter(j => j.project_id === project.id) || [];
        
        let totalPositions = 0;
        let filledPositions = 0;
        
        const jobsWithMetrics = projectJobs.map(job => {
          const candidates = job.candidate_job_links || [];
          const placedCount = candidates.filter((c: any) => c.current_status === 'placed').length;
          totalPositions += candidates.length;
          filledPositions += placedCount;
          
          return {
            id: job.id,
            title: job.title,
            status: job.status,
            total_candidates: candidates.length,
            placed_candidates: placedCount,
          };
        });

        const daysSinceContract = project.contract_signed_at
          ? differenceInDays(new Date(), new Date(project.contract_signed_at))
          : null;

        return {
          ...project,
          total_positions: totalPositions,
          filled_positions: filledPositions,
          fill_percentage: totalPositions > 0 ? Math.round((filledPositions / totalPositions) * 100) : 0,
          jobs: jobsWithMetrics,
          days_since_contract: daysSinceContract,
        };
      });
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async (): Promise<ProjectWithMetrics | null> => {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!project) return null;

      // Fetch jobs for this project
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          status,
          candidate_job_links(
            id,
            current_status
          )
        `)
        .eq('project_id', id);

      if (jobsError) throw jobsError;

      let totalPositions = 0;
      let filledPositions = 0;

      const jobsWithMetrics = (jobs || []).map(job => {
        const candidates = job.candidate_job_links || [];
        const placedCount = candidates.filter((c: any) => c.current_status === 'placed').length;
        totalPositions += candidates.length;
        filledPositions += placedCount;

        return {
          id: job.id,
          title: job.title,
          status: job.status,
          total_candidates: candidates.length,
          placed_candidates: placedCount,
        };
      });

      const daysSinceContract = project.contract_signed_at
        ? differenceInDays(new Date(), new Date(project.contract_signed_at))
        : null;

      return {
        ...(project as Project),
        total_positions: totalPositions,
        filled_positions: filledPositions,
        fill_percentage: totalPositions > 0 ? Math.round((filledPositions / totalPositions) * 100) : 0,
        jobs: jobsWithMetrics,
        days_since_contract: daysSinceContract,
      };
    },
    enabled: !!id,
  });
}

export interface CreateProjectInput {
  name: string;
  employer_name: string;
  location: string;
  countries_in_contract: string[];
  sales_person_name?: string;
  status?: ProjectStatus;
  default_workflow_type?: WorkflowType;
  contract_signed_at?: string;
  notes?: string;
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Project created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating project', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] });
      toast({ title: 'Project updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating project', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Project deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting project', description: error.message, variant: 'destructive' });
    },
  });
}

// Hook to link a job to a project
export function useLinkJobToProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ jobId, projectId }: { jobId: string; projectId: string | null }) => {
      const { error } = await supabase
        .from('jobs')
        .update({ project_id: projectId })
        .eq('id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({ title: 'Job linked to project' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error linking job', description: error.message, variant: 'destructive' });
    },
  });
}
