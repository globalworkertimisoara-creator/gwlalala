import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { escapePostgRESTFilter } from '@/lib/searchUtils';
import type { ClientStatus, ClientType, ClientWithMetrics } from '@/types/client';
import { getClientDisplayName, isValidStatusTransition, sanitizeTextInput } from '@/types/client';

export interface ClientFilters {
  status?: ClientStatus;
  client_type?: ClientType;
  search?: string;
  priority?: string;
  riskRange?: string; // 'low' | 'medium' | 'high'
  assignedTo?: string;
  sortBy?: string; // 'name' | 'created_at' | 'risk_score' | 'outstanding_amount'
  sortDirection?: 'asc' | 'desc';
}

export function useClients(filters?: ClientFilters) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('*, companies(company_name)');

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.client_type) query = query.eq('client_type', filters.client_type);
      if (filters?.priority) query = query.eq('priority_level', filters.priority);
      if (filters?.assignedTo) query = query.eq('assigned_to', filters.assignedTo);

      if (filters?.riskRange === 'low') query = query.gte('risk_score', 1).lte('risk_score', 3);
      else if (filters?.riskRange === 'medium') query = query.gte('risk_score', 4).lte('risk_score', 6);
      else if (filters?.riskRange === 'high') query = query.gte('risk_score', 7).lte('risk_score', 10);

      if (filters?.search) {
        const escaped = escapePostgRESTFilter(filters.search);
        query = query.or(`first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%,email.ilike.%${escaped}%`);
      }

      // Sort
      const sortBy = filters?.sortBy || 'created_at';
      const sortDir = filters?.sortDirection || 'desc';
      if (sortBy === 'name') {
        query = query.order('first_name', { ascending: sortDir === 'asc' });
      } else if (sortBy === 'risk_score') {
        query = query.order('risk_score', { ascending: sortDir === 'asc', nullsFirst: false });
      } else {
        query = query.order('created_at', { ascending: sortDir === 'asc' });
      }

      const { data, error } = await query;
      if (error) throw error;

      const clientIds = (data || []).map(c => c.id);
      if (clientIds.length === 0) return [] as ClientWithMetrics[];

      const [projectsRes, invoicesRes, contactsRes, activityRes] = await Promise.all([
        supabase.from('client_projects').select('client_id, project_id').in('client_id', clientIds),
        supabase.from('client_invoices').select('client_id, total_amount, paid_amount').in('client_id', clientIds),
        supabase.from('client_contacts').select('client_id').in('client_id', clientIds),
        supabase.from('client_activity_log').select('client_id, created_at').in('client_id', clientIds).order('created_at', { ascending: false }),
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

      const contactCounts = new Map<string, number>();
      for (const c of contactsRes.data || []) {
        contactCounts.set(c.client_id, (contactCounts.get(c.client_id) || 0) + 1);
      }

      const lastActivity = new Map<string, string>();
      for (const a of activityRes.data || []) {
        if (!lastActivity.has(a.client_id)) {
          lastActivity.set(a.client_id, a.created_at);
        }
      }

      let result = (data || []).map((c): ClientWithMetrics => {
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
          contact_count: contactCounts.get(c.id) || 0,
          last_activity: lastActivity.get(c.id) || null,
        } as ClientWithMetrics;
      });

      // Client-side sort for outstanding_amount (computed field)
      if (filters?.sortBy === 'outstanding_amount') {
        result.sort((a, b) => {
          const diff = a.outstanding_amount - b.outstanding_amount;
          return filters.sortDirection === 'asc' ? diff : -diff;
        });
      }

      return result;
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

      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(updates)) {
        sanitized[key] = typeof value === 'string' ? sanitizeTextInput(value) : value;
      }

      const { error } = await supabase.from('clients').update(sanitized).eq('id', id);
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

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientId, ...updates }: { id: string; clientId: string } & Record<string, any>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(updates)) {
        sanitized[key] = typeof value === 'string' ? sanitizeTextInput(value) : value;
      }

      const { error } = await supabase.from('companies').update(sanitized).eq('id', id);
      if (error) throw error;

      await supabase.from('client_activity_log').insert({
        client_id: clientId,
        action: 'company_updated',
        details: { fields_updated: Object.keys(updates) },
        performed_by: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client'] });
      toast({ title: 'Company details updated' });
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
      const { error } = await supabase.from('clients').delete().eq('id', id).eq('created_by', user.id);
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

      const { data: currentClient } = await supabase.from('clients').select('status').eq('id', id).single();
      if (!currentClient || !isValidStatusTransition(currentClient.status as ClientStatus, status)) {
        throw new Error('INVALID_STATUS_TRANSITION');
      }

      const { error } = await supabase.from('clients').update({ status }).eq('id', id);
      if (error) throw error;

      await supabase.from('client_activity_log').insert({
        client_id: id,
        action: 'status_changed',
        details: { old_status: currentClient?.status, new_status: status },
        performed_by: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client'] });
      toast({ title: 'Client status updated' });
    },
    onError: (error: Error) => {
      if (error.message === 'INVALID_STATUS_TRANSITION') {
        toast({ title: 'Invalid status change', description: 'This status transition is not allowed.', variant: 'destructive' });
      } else {
        toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
      }
    },
  });
}

export function useStaffProfiles() {
  return useQuery({
    queryKey: ['staff-profiles-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });
}
