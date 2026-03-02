import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Contract {
  id: string;
  contract_type: string;
  party_type: string;
  party_id: string;
  title: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  renewal_date: string | null;
  auto_renew: boolean;
  total_value: number | null;
  currency: string;
  storage_path: string | null;
  signed_by_party_at: string | null;
  signed_by_staff_at: string | null;
  notes: string | null;
  project_id: string | null;
  job_id: string | null;
  sales_person_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateContractInput {
  contract_type: string;
  party_type: string;
  party_id: string;
  title: string;
  start_date?: string;
  end_date?: string;
  renewal_date?: string;
  auto_renew?: boolean;
  total_value?: number;
  currency?: string;
  storage_path?: string;
  notes?: string;
  project_id?: string;
  job_id?: string;
  sales_person_id?: string;
}

export function useContracts(filters?: { status?: string; party_type?: string; contract_type?: string }) {
  return useQuery({
    queryKey: ['contracts', filters],
    queryFn: async () => {
      let query = supabase.from('contracts' as any).select('*').order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.party_type) query = query.eq('party_type', filters.party_type);
      if (filters?.contract_type) query = query.eq('contract_type', filters.contract_type);

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

  return useMutation({
    mutationFn: async (input: CreateContractInput) => {
      const { data, error } = await supabase.from('contracts' as any).insert({
        ...input,
        created_by: user?.id,
      }).select().single();
      if (error) throw error;
      return data as unknown as Contract;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
}

export function useUpdateContract() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contract> & { id: string }) => {
      const { data, error } = await supabase.from('contracts' as any).update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as unknown as Contract;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
}
