import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useClientInvoices(clientId?: string) {
  return useQuery({
    queryKey: ['client-invoices', clientId],
    queryFn: async () => {
      let query = supabase.from('client_invoices').select('*').order('created_at', { ascending: false });
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: clientId ? !!clientId : true,
  });
}

export function useClientInvoice(id: string) {
  return useQuery({
    queryKey: ['client-invoice', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('client_invoices').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateClientInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, any>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const insertData = { ...input, created_by: user.id } as any;
      const { data, error } = await supabase
        .from('client_invoices')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;

      await supabase.from('client_activity_log').insert({
        client_id: input.client_id,
        action: 'invoice_created',
        details: { invoice_number: data.invoice_number, amount: data.total_amount },
        performed_by: user.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['client-activity'] });
      toast({ title: 'Invoice created successfully' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

export function useUpdateClientInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, any>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('client_invoices').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-invoices'] });
      toast({ title: 'Invoice updated successfully' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

export function useDeleteClientInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('client_invoices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-invoices'] });
      toast({ title: 'Invoice deleted' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}
