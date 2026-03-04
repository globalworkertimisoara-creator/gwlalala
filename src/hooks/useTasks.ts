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
  assignee_name?: string | null;
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

async function fetchTasksWithProfiles(filters?: {
  status?: string;
  assigned_to?: string;
  entity_type?: string;
  entity_id?: string;
}): Promise<Task[]> {
  let query = supabase
    .from('tasks' as any)
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
  if (filters?.entity_type) query = query.eq('entity_type', filters.entity_type);
  if (filters?.entity_id) query = query.eq('entity_id', filters.entity_id);

  const { data, error } = await query.limit(200);
  if (error) throw error;

  const tasks = (data ?? []) as unknown as Task[];

  // Batch-fetch assignee names
  const assigneeIds = [...new Set(tasks.map(t => t.assigned_to).filter(Boolean))] as string[];
  if (assigneeIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', assigneeIds);

    const nameMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p.full_name]));
    for (const task of tasks) {
      task.assignee_name = task.assigned_to ? nameMap.get(task.assigned_to) ?? null : null;
    }
  }

  return tasks;
}

export function useTasks(filters?: { status?: string; assigned_to?: string; entity_type?: string; entity_id?: string }) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetchTasksWithProfiles(filters),
  });
}

export function useTeamTasks() {
  return useQuery({
    queryKey: ['tasks', 'team'],
    queryFn: () => fetchTasksWithProfiles(),
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
      const payload: any = { ...input, created_by: user?.id };
      // Ensure date-only strings get a time component for timestamptz columns
      if (payload.due_date && !payload.due_date.includes('T')) {
        payload.due_date = `${payload.due_date}T23:59:59`;
      }
      const { data, error } = await supabase.from('tasks' as any).insert(payload).select().single();
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
      delete payload.assignee_name; // Don't send computed field
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
