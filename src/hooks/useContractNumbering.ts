/**
 * src/hooks/useContractNumbering.ts
 * 
 * Hook for automatic contract numbering operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  ContractPrefix, 
  NextContractNumber, 
  ContractNumberAuditLog,
  UpdateContractNumberInput 
} from '@/types/contract';

// Get next available contract number
export function useNextContractNumber(prefix: ContractPrefix, contractDate?: string) {
  return useQuery({
    queryKey: ['next-contract-number', prefix, contractDate],
    queryFn: async () => {
      const date = contractDate || new Date().toISOString().split('T')[0];
      
      const { data, error } = await (supabase as any)
        .rpc('get_next_contract_number', {
          p_contract_prefix: prefix,
          p_contract_date: date,
        });

      if (error) throw error;
      return data[0] as NextContractNumber;
    },
    enabled: !!prefix,
  });
}

// Get contract number audit log
export function useContractNumberAuditLog(contractId: string) {
  return useQuery({
    queryKey: ['contract-number-audit-log', contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_number_audit_log' as any)
        .select('*')
        .eq('contract_id', contractId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as ContractNumberAuditLog[];
    },
    enabled: !!contractId,
  });
}

// Update contract number manually
export function useUpdateContractNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateContractNumberInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('contracts' as any)
        .update({
          sequence_number: input.sequence_number,
          contract_date: input.contract_date,
          number_modified_by: user.id,
          number_modified_at: new Date().toISOString(),
          number_modification_reason: input.reason || null,
        })
        .eq('id', input.contract_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract-number-audit-log'] });
      toast.success('Contract number updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update contract number');
    },
  });
}

// Check if contract number is available
export function useCheckContractNumberAvailable() {
  return useMutation({
    mutationFn: async (params: { prefix: ContractPrefix; sequenceNumber: number; year: number }) => {
      const { data, error } = await supabase
        .from('contracts' as any)
        .select('id')
        .eq('contract_prefix', params.prefix)
        .eq('sequence_number', params.sequenceNumber)
        .filter('contract_date', 'gte', `${params.year}-01-01`)
        .filter('contract_date', 'lte', `${params.year}-12-31`)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      return {
        available: !data,
        existingContractId: (data as any)?.id || null,
      };
    },
  });
}

// Get contracts expiring soon (for dashboard alerts)
export function useContractsExpiringSoon(days: number = 30) {
  return useQuery({
    queryKey: ['contracts-expiring-soon', days],
    queryFn: async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const { data, error } = await supabase
        .from('v_contracts_with_details' as any)
        .select('*')
        .eq('status', 'active')
        .lte('end_date', futureDate.toISOString().split('T')[0])
        .order('end_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

// Get contract statistics by year
export function useContractStatsByYear(year?: number) {
  const currentYear = year || new Date().getFullYear();
  
  return useQuery({
    queryKey: ['contract-stats-by-year', currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts' as any)
        .select('contract_prefix, status')
        .gte('contract_date', `${currentYear}-01-01`)
        .lte('contract_date', `${currentYear}-12-31`);

      if (error) throw error;

      const stats = {
        REC: { total: 0, draft: 0, signed: 0, active: 0 },
        PAR: { total: 0, draft: 0, signed: 0, active: 0 },
        CON: { total: 0, draft: 0, signed: 0, active: 0 },
        SRV: { total: 0, draft: 0, signed: 0, active: 0 },
      };

      (data as any[])?.forEach((contract: any) => {
        const prefix = contract.contract_prefix as ContractPrefix;
        if (prefix && stats[prefix]) {
          stats[prefix].total++;
          if (contract.status === 'draft') stats[prefix].draft++;
          if (contract.status === 'signed') stats[prefix].signed++;
          if (contract.status === 'active') stats[prefix].active++;
        }
      });

      return stats;
    },
  });
}
