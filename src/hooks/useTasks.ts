import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  assigned_role: string | null;
  due_date: string | null;
  completed_at: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  task_type?: string;
  priority?: string;
  assigned_to?: string;
  assigned_role?: string;
  due_date?: string;
  entity_type?: string;
  entity_id?: string;
}

export function useTasks(filters?: { status?: string; assigned_to?: string; entity_type?: string; entity_id?: string }) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      let query = supabase.from('tasks' as any).select('*').order('due_date', { ascending: true, nullsFirst: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
      if (filters?.entity_type) query = query.eq('entity_type', filters.entity_type);
      if (filters?.entity_id) query = query.eq('entity_id', filters.entity_id);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as Task[];
    },
  });
}

export function useMyTasks() {
  const { user } = useAuth();
  return useTasks(user ? { assigned_to: user.id } : undefined);
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data, error } = await supabase.from('tasks' as any).insert({
        ...input,
        created_by: user?.id,
      }).select().single();
      if (error) throw error;
      return data as unknown as Task;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const payload: any = { ...updates };
      if (updates.status === 'done') payload.completed_at = new Date().toISOString();
      const { data, error } = await supabase.from('tasks' as any).update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data as unknown as Task;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}
