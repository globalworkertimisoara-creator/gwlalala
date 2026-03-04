import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmployerNote {
  id: string;
  candidate_id: string;
  company_id: string;
  content: string;
  created_by: string;
  created_at: string;
  author_name?: string | null;
}

export function useEmployerNotes(candidateId: string | undefined) {
  return useQuery({
    queryKey: ['employer-notes', candidateId],
    queryFn: async (): Promise<EmployerNote[]> => {
      if (!candidateId) return [];
      const { data, error } = await supabase
        .from('employer_notes')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map(n => n.created_by).filter(Boolean))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p.full_name || '']));
      }

      return data.map(n => ({
        ...n,
        author_name: n.created_by ? profileMap[n.created_by] || null : null,
      })) as EmployerNote[];
    },
    enabled: !!candidateId,
  });
}

export function useCreateEmployerNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { candidate_id: string; content: string; company_id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('employer_notes')
        .insert({
          candidate_id: input.candidate_id,
          company_id: input.company_id,
          content: input.content,
          created_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data as EmployerNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employer-notes', data.candidate_id] });
      toast({ title: 'Note added' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Failed to add note', description: error.message });
    },
  });
}

export function useDeleteEmployerNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, candidateId }: { id: string; candidateId: string }) => {
      const { error } = await supabase.from('employer_notes').delete().eq('id', id);
      if (error) throw error;
      return candidateId;
    },
    onSuccess: (candidateId) => {
      queryClient.invalidateQueries({ queryKey: ['employer-notes', candidateId] });
      toast({ title: 'Note deleted' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Failed to delete note', description: error.message });
    },
  });
}
