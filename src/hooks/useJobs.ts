import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Job, Candidate, CreateJobInput, UpdateJobInput, JobStatus, LinkCandidateToJobInput } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function useJobs(filters?: {
  status?: JobStatus;
  search?: string;
}) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,client_company.ilike.%${filters.search}%,country.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Job[];
    },
  });
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Job;
    },
    enabled: !!id,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateJobInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Job;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: 'Job created',
        description: 'The job has been added successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create job',
        description: error.message,
      });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateJobInput & { id: string }) => {
      const { data, error } = await supabase
        .from('jobs')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Job;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', data.id] });
      toast({
        title: 'Job updated',
        description: 'The job has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update job',
        description: error.message,
      });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: 'Job deleted',
        description: 'The job has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete job',
        description: error.message,
      });
    },
  });
}

export function useJobCandidateCount() {
  return useQuery({
    queryKey: ['job-candidate-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidate_job_links')
        .select('job_id');

      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(link => {
        counts[link.job_id] = (counts[link.job_id] || 0) + 1;
      });
      
      return counts;
    },
  });
}

// Fetch all candidate_job_links for a given job, with the full candidate row joined
export function useJobCandidates(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job-candidates', jobId],
    queryFn: async () => {
      if (!jobId) return [];

      const { data, error } = await supabase
        .from('candidate_job_links')
        .select('*, candidates(*)')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Array<{
        id: string;
        candidate_id: string;
        job_id: string;
        submitted_date: string;
        current_status: string;
        created_at: string;
        candidates: Candidate;
      }>;
    },
    enabled: !!jobId,
  });
}

// Fetch all candidate_job_links for a given candidate, with the full job row joined
export function useCandidateJobs(candidateId: string | undefined) {
  return useQuery({
    queryKey: ['candidate-jobs', candidateId],
    queryFn: async () => {
      if (!candidateId) return [];

      const { data, error } = await supabase
        .from('candidate_job_links')
        .select('*, jobs(*)')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Array<{
        id: string;
        candidate_id: string;
        job_id: string;
        submitted_date: string;
        current_status: string;
        created_at: string;
        jobs: Job;
      }>;
    },
    enabled: !!candidateId,
  });
}

export function useLinkCandidateToJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: LinkCandidateToJobInput) => {
      const { data, error } = await supabase
        .from('candidate_job_links')
        .insert({
          candidate_id: input.candidate_id,
          job_id: input.job_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-candidate-counts'] });
      toast({
        title: 'Candidate linked',
        description: 'The candidate has been linked to this job.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to link candidate',
        description: error.message,
      });
    },
  });
}

export function useUnlinkCandidateFromJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ candidateId, jobId }: { candidateId: string; jobId: string }) => {
      const { error } = await supabase
        .from('candidate_job_links')
        .delete()
        .eq('candidate_id', candidateId)
        .eq('job_id', jobId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-candidate-counts'] });
      toast({
        title: 'Candidate unlinked',
        description: 'The candidate has been removed from this job.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to unlink candidate',
        description: error.message,
      });
    },
  });
}
