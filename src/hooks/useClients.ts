import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { escapePostgRESTFilter } from '@/lib/searchUtils';
import type { ClientStatus, ClientType, ClientWithMetrics } from '@/types/client';
import { getClientDisplayName, isValidStatusTransition } from '@/types/client';

interface ClientFilters {
  status?: ClientStatus;
  client_type?: ClientType;
  search?: string;
}

export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('*, companies(company_name)')
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.client_type) query = query.eq('client_type', filters.client_type);
      if (filters?.search) {
        const escaped = escapePostgRESTFilter(filters.search);
        query = query.or(`first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%,email.ilike.%${escaped}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch metrics separately
      const clientIds = (data || []).map(c => c.id);
      if (clientIds.length === 0) return [] as ClientWithMetrics[];

      const [projectsRes, invoicesRes] = await Promise.all([
        supabase.from('client_projects').select('client_id, project_id').in('client_id', clientIds),
        supabase.from('client_invoices').select('client_id, total_amount, paid_amount').in('client_id', clientIds),
      ]);

      const projectCounts = new Map<string, number>();
      for (const p of projectsRes.data || []) {
        projectCounts.set(p.client_id, (projectCounts.get(p.client_id) || 0) + 1);
      }

      const invoiceMetrics = new Map<string, { total: number; paid: number }>();
      for (const inv of invoicesRes.data || []) {
        const existing = invoiceMetrics.get(inv.client_id) || { total: 0, paid: 0 };
        existing.total += Number(inv.total_amount) || 0;
        existing.paid += Number(inv.paid_amount) || 0;
        invoiceMetrics.set(inv.client_id, existing);
      }

      return (data || []).map((c): ClientWithMetrics => {
        const companyName = (c as any).companies?.company_name;
        const metrics = invoiceMetrics.get(c.id) || { total: 0, paid: 0 };
        return {
          ...c,
          companies: undefined,
          display_name: getClientDisplayName(c as any, companyName),
          company_name: companyName,
          project_count: projectCounts.get(c.id) || 0,
          contract_count: 0,
          total_invoiced: metrics.total,
          total_paid: metrics.paid,
          outstanding_amount: metrics.total - metrics.paid,
        } as ClientWithMetrics;
      });
    },
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*, companies(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, any>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const insertData = { ...input, created_by: user.id } as any;
      const { data, error } = await supabase
        .from('clients')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;

      // Log activity
      await supabase.from('client_activity_log').insert({
        client_id: data.id,
        action: 'created',
        details: { client_type: input.client_type },
        performed_by: user.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Client created successfully' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, any>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('clients').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client'] });
      toast({ title: 'Client updated successfully' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Client deleted successfully' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

export function useUpdateClientStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ClientStatus }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: oldClient } = await supabase.from('clients').select('status').eq('id', id).single();
      const { error } = await supabase.from('clients').update({ status }).eq('id', id);
      if (error) throw error;

      await supabase.from('client_activity_log').insert({
        client_id: id,
        action: 'status_changed',
        details: { old_status: oldClient?.status, new_status: status },
        performed_by: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client'] });
      toast({ title: 'Client status updated' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}
