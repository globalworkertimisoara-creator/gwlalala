import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { escapePostgRESTFilter } from '@/lib/searchUtils';
import { 
  Candidate, 
  CreateCandidateInput, 
  UpdateCandidateInput,
  RecruitmentStage 
} from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function useCandidates(filters?: {
  stage?: RecruitmentStage;
  search?: string;
}) {
  return useQuery({
    queryKey: ['candidates', filters],
    queryFn: async () => {
      let query = supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.stage) {
        query = query.eq('current_stage', filters.stage);
      }

      if (filters?.search) {
        const escapedSearch = escapePostgRESTFilter(filters.search);
        query = query.or(
          `full_name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%,nationality.ilike.%${escapedSearch}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Candidate[];
    },
  });
}

export function useCandidate(id: string | undefined) {
  return useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Candidate;
    },
    enabled: !!id,
  });
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateCandidateInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('candidates')
        .insert({
          ...input,
          added_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Candidate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast({
        title: 'Candidate created',
        description: 'The candidate has been added successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create candidate',
        description: error.message,
      });
    },
  });
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateCandidateInput & { id: string }) => {
      const { data, error } = await supabase
        .from('candidates')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Candidate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate', data.id] });
      toast({
        title: 'Candidate updated',
        description: 'The candidate has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update candidate',
        description: error.message,
      });
    },
  });
}

export function useUpdateCandidateStage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      stage, 
      note,
      rejection_reason 
    }: { 
      id: string; 
      stage: RecruitmentStage;
      note?: string;
      rejection_reason?: string;
    }) => {
      const updateData: Partial<Candidate> = { current_stage: stage };
      
      if (stage === 'closed_not_placed' && rejection_reason) {
        updateData.rejection_reason = rejection_reason;
      }

      const { data, error } = await supabase
        .from('candidates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Add note if provided
      if (note) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('notes').insert({
          candidate_id: id,
          content: note,
          created_by: user?.id,
        });
      }

      return data as Candidate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidate', data.id] });
      queryClient.invalidateQueries({ queryKey: ['stage-history', data.id] });
      toast({
        title: 'Stage updated',
        description: `Candidate moved to ${data.current_stage.replace(/_/g, ' ')}.`,
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

export function useDeleteCandidate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast({
        title: 'Candidate deleted',
        description: 'The candidate has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete candidate',
        description: error.message,
      });
    },
  });
}
