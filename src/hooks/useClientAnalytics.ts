import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useClientsByStatus() {
  return useQuery({
    queryKey: ['clients-by-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('status');
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data || []) {
        counts[row.status] = (counts[row.status] || 0) + 1;
      }
      return Object.entries(counts).map(([status, count]) => ({ status, count }));
    },
  });
}

export function useClientRevenueByClient() {
  return useQuery({
    queryKey: ['client-revenue-by-client'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_invoices')
        .select('client_id, total_amount');
      if (error) throw error;

      const byClient = new Map<string, number>();
      for (const row of data || []) {
        byClient.set(row.client_id, (byClient.get(row.client_id) || 0) + Number(row.total_amount));
      }

      const clientIds = [...byClient.keys()];
      if (clientIds.length === 0) return [];

      const { data: clients } = await supabase
        .from('clients')
        .select('id, client_type, first_name, last_name, company_id, companies(company_name)')
        .in('id', clientIds);

      return (clients || [])
        .map(c => ({
          id: c.id,
          name: c.client_type === 'company'
            ? (c as any).companies?.company_name || 'Unknown'
            : `${c.first_name} ${c.last_name}`,
          total: byClient.get(c.id) || 0,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    },
  });
}

export function useClientAcquisitionTrend() {
  return useQuery({
    queryKey: ['client-acquisition-trend'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('client_type, created_at')
        .order('created_at', { ascending: true });
      if (error) throw error;

      const months = new Map<string, { company: number; individual: number }>();
      for (const row of data || []) {
        const month = row.created_at.substring(0, 7);
        const existing = months.get(month) || { company: 0, individual: 0 };
        if (row.client_type === 'company') existing.company++;
        else existing.individual++;
        months.set(month, existing);
      }

      return [...months.entries()]
        .slice(-12)
        .map(([month, counts]) => ({ month, ...counts }));
    },
  });
}

export function useTopClients(limit = 20) {
  return useQuery({
    queryKey: ['top-clients', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, client_type, status, first_name, last_name, company_id, companies(company_name), created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;

      // Get invoice aggregates
      const clientIds = (data || []).map(c => c.id);
      if (clientIds.length === 0) return [];

      const { data: invoices } = await supabase
        .from('client_invoices')
        .select('client_id, total_amount, paid_amount')
        .in('client_id', clientIds);

      const metrics = new Map<string, { total: number; paid: number }>();
      for (const inv of invoices || []) {
        const m = metrics.get(inv.client_id) || { total: 0, paid: 0 };
        m.total += Number(inv.total_amount) || 0;
        m.paid += Number(inv.paid_amount) || 0;
        metrics.set(inv.client_id, m);
      }

      return (data || []).map(c => {
        const m = metrics.get(c.id) || { total: 0, paid: 0 };
        return {
          id: c.id,
          client_type: c.client_type,
          status: c.status,
          display_name: c.client_type === 'company'
            ? (c as any).companies?.company_name || 'Unknown'
            : `${c.first_name} ${c.last_name}`,
          total_invoiced: m.total,
          outstanding_amount: m.total - m.paid,
        };
      }).sort((a, b) => b.total_invoiced - a.total_invoiced);
    },
  });
}
