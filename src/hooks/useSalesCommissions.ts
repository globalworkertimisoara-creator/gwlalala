import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SalesCommission {
  id: string;
  contract_id: string;
  project_id: string | null;
  sales_person_id: string;
  commission_amount: number;
  original_amount: number | null;
  currency: string;
  status: string;
  adjustment_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesCommissionSummary {
  id: string;
  contract_id: string;
  project_id: string | null;
  sales_person_id: string;
  commission_amount: number;
  original_amount: number | null;
  currency: string;
  commission_status: string;
  adjustment_reason: string | null;
  created_at: string;
  updated_at: string;
  contract_title: string | null;
  contract_type: string | null;
  contract_status: string | null;
  contract_value: number | null;
  party_type: string | null;
  party_id: string | null;
  project_name: string | null;
  project_status: string | null;
  employer_name: string | null;
  sales_person_name: string | null;
}

export function useSalesCommissionsSummary() {
  return useQuery({
    queryKey: ['sales-commissions-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_sales_commission_summary' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SalesCommissionSummary[];
    },
  });
}

export function useSalesCommissions(contractId?: string) {
  return useQuery({
    queryKey: ['sales-commissions', contractId],
    queryFn: async () => {
      let query = supabase
        .from('sales_commissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (contractId) query = query.eq('contract_id', contractId);
      const { data, error } = await query;
      if (error) throw error;
      return data as SalesCommission[];
    },
  });
}

export function useCreateCommission() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      contract_id: string;
      project_id?: string;
      sales_person_id: string;
      commission_amount: number;
      currency?: string;
    }) => {
      const { data, error } = await supabase
        .from('sales_commissions')
        .insert({
          ...input,
          original_amount: input.commission_amount,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data as SalesCommission;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-commissions'] });
      qc.invalidateQueries({ queryKey: ['sales-commissions-summary'] });
    },
  });
}

export function useUpdateCommission() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SalesCommission> & { id: string }) => {
      const { data, error } = await supabase
        .from('sales_commissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as SalesCommission;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales-commissions'] });
      qc.invalidateQueries({ queryKey: ['sales-commissions-summary'] });
    },
  });
}

/** Fetch staff with sales_manager role for dropdowns */
export function useSalesStaff() {
  return useQuery({
    queryKey: ['sales-staff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'sales_manager' as any);
      if (error) throw error;
      const userIds = (data ?? []).map((r: any) => r.user_id);
      if (userIds.length === 0) return [];
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      if (pErr) throw pErr;
      return (profiles ?? []) as { user_id: string; full_name: string | null }[];
    },
  });
}
