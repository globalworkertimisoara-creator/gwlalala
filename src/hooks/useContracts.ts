import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLogContractActivity } from '@/hooks/useContractActivityLog';
import type { Contract, CreateContractInput } from '@/types/contract';

// Re-export types for backward compatibility
export type { Contract, CreateContractInput } from '@/types/contract';

export function useContracts(filters?: { status?: string; party_type?: string; contract_type?: string; search?: string; year?: number }) {
  return useQuery({
    queryKey: ['contracts', filters],
    queryFn: async () => {
      let query = supabase.from('v_contracts_with_details' as any).select('*').order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters?.party_type && filters.party_type !== 'all') query = query.eq('party_type', filters.party_type);
      if (filters?.contract_type && filters.contract_type !== 'all') query = query.eq('contract_type', filters.contract_type);
      
      if (filters?.search) {
        const escaped = escapePostgRESTFilter(filters.search);
        if (escaped) {
          query = query.or(`contract_number.ilike.%${escaped}%,title.ilike.%${escaped}%,client_name.ilike.%${escaped}%`);
        }
      }
      
      if (filters?.year) {
        query = query.gte('contract_date', `${filters.year}-01-01`).lte('contract_date', `${filters.year}-12-31`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as Contract[];
    },
  });
}

export function useExpiringContracts(daysAhead: number = 30) {
  return useQuery({
    queryKey: ['contracts', 'expiring', daysAhead],
    queryFn: async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await supabase
        .from('contracts' as any)
        .select('*')
        .in('status', ['active', 'signed'])
        .lte('end_date', futureDate.toISOString().split('T')[0])
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('end_date', { ascending: true });

      if (error) throw error;
      return (data ?? []) as unknown as Contract[];
    },
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const logActivity = useLogContractActivity();

  return useMutation({
    mutationFn: async (input: CreateContractInput) => {
      const { data, error } = await supabase.from('contracts' as any).insert({
        ...input,
        created_by: user?.id,
      }).select().single();
      if (error) throw error;
      return data as unknown as Contract;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['next-contract-number'] });
      logActivity.mutate({
        contract_id: data.id,
        action: 'created',
        summary: `Contract "${data.title}" created${data.contract_number ? ` as ${data.contract_number}` : ''}`,
      });
    },
  });
}

export function useContractsByProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['contracts', 'by-project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts' as any)
        .select('*')
        .eq('project_id', projectId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as Contract[];
    },
    enabled: !!projectId,
  });
}

export function useLinkContractToProject() {
  const qc = useQueryClient();
  const logActivity = useLogContractActivity();

  return useMutation({
    mutationFn: async ({ contractId, projectId }: { contractId: string; projectId: string | null }) => {
      const { data, error } = await supabase
        .from('contracts' as any)
        .update({ project_id: projectId })
        .eq('id', contractId)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Contract;
    },
    onSuccess: (data, { projectId }) => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      logActivity.mutate({
        contract_id: data.id,
        action: 'field_update',
        summary: projectId
          ? `Linked to project`
          : `Unlinked from project`,
        field_changed: 'project_id',
        old_value: '—',
        new_value: projectId || '—',
      });
    },
  });
}

export function useUpdateContract() {
  const qc = useQueryClient();
  const logActivity = useLogContractActivity();

  return useMutation({
    mutationFn: async ({ id, _oldContract, ...updates }: Partial<Contract> & { id: string; _oldContract?: Contract }) => {
      const { data, error } = await supabase.from('contracts' as any).update(updates).eq('id', id).select().single();
      if (error) throw error;
      return { updated: data as unknown as Contract, oldContract: _oldContract, changedFields: updates };
    },
    onSuccess: ({ updated, oldContract, changedFields }) => {
      qc.invalidateQueries({ queryKey: ['contracts'] });

      const fieldLabels: Record<string, string> = {
        status: 'Status',
        title: 'Title',
        start_date: 'Start Date',
        end_date: 'End Date',
        total_value: 'Total Value',
        notes: 'Notes',
        sales_person_id: 'Sales Person',
        auto_renew: 'Auto Renew',
        renewal_date: 'Renewal Date',
      };

      for (const [key, newVal] of Object.entries(changedFields)) {
        if (key === 'id' || key === '_oldContract') continue;
        const label = fieldLabels[key] || key;
        const oldVal = oldContract ? String((oldContract as any)[key] ?? '—') : '—';
        const newValStr = String(newVal ?? '—');

        logActivity.mutate({
          contract_id: updated.id,
          action: key === 'status' ? 'status_change' : 'field_update',
          summary: `${label} changed from "${oldVal}" to "${newValStr}"`,
          field_changed: key,
          old_value: oldVal,
          new_value: newValStr,
        });
      }
    },
  });
}
