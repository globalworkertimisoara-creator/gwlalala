import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Note, CreateNoteInput } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export type NoteWithAuthor = Note & { author_name: string | null };

export function useNotes(candidateId: string | undefined) {
  return useQuery({
    queryKey: ['notes', candidateId],
    queryFn: async (): Promise<NoteWithAuthor[]> => {
      if (!candidateId) return [];

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Batch fetch author names
      const userIds = [...new Set(data.map(n => n.created_by).filter(Boolean))] as string[];
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
      })) as NoteWithAuthor[];
    },
    enabled: !!candidateId,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateNoteInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('notes')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Note;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes', data.candidate_id] });
      toast({
        title: 'Note added',
        description: 'Your note has been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to add note',
        description: error.message,
      });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, candidateId }: { id: string; candidateId: string }) => {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return candidateId;
    },
    onSuccess: (candidateId) => {
      queryClient.invalidateQueries({ queryKey: ['notes', candidateId] });
      toast({
        title: 'Note deleted',
        description: 'The note has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete note',
        description: error.message,
      });
    },
  });
}
