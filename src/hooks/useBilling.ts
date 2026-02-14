import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BillingRecord {
  id: string;
  candidate_id: string;
  agency_id: string;
  job_id: string | null;
  total_amount: number;
  currency: string;
  description: string | null;
  status: string;
  agreed_at: string | null;
  agreed_by_admin: string | null;
  agreed_by_agency: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  candidate?: { id: string; full_name: string; email: string } | null;
  agency?: { id: string; company_name: string } | null;
  job?: { id: string; title: string } | null;
}

export interface BillingPayment {
  id: string;
  billing_record_id: string;
  amount: number;
  percentage: number;
  payment_date: string | null;
  payment_method: string | null;
  reference_number: string | null;
  notes: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
}

export interface BillingChangeLog {
  id: string;
  billing_record_id: string;
  billing_payment_id: string | null;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_by_name: string | null;
  changed_by_role: string | null;
  note: string | null;
  created_at: string;
}

export interface BillingNote {
  id: string;
  billing_record_id: string;
  content: string;
  created_by: string;
  created_by_name: string | null;
  created_by_role: string | null;
  created_at: string;
}

export function useBillingRecords() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['billing-records'],
    queryFn: async (): Promise<BillingRecord[]> => {
      const { data, error } = await supabase
        .from('billing_records')
        .select(`
          *,
          candidate:candidates(id, full_name, email),
          agency:agency_profiles(id, company_name),
          job:jobs(id, title)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BillingRecord[];
    },
    enabled: !!user,
  });
}

export function useBillingPayments(billingRecordId: string | null) {
  return useQuery({
    queryKey: ['billing-payments', billingRecordId],
    queryFn: async (): Promise<BillingPayment[]> => {
      const { data, error } = await supabase
        .from('billing_payments')
        .select('*')
        .eq('billing_record_id', billingRecordId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BillingPayment[];
    },
    enabled: !!billingRecordId,
  });
}

export function useBillingChangeLog(billingRecordId: string | null) {
  return useQuery({
    queryKey: ['billing-change-log', billingRecordId],
    queryFn: async (): Promise<BillingChangeLog[]> => {
      const { data, error } = await supabase
        .from('billing_change_log')
        .select('*')
        .eq('billing_record_id', billingRecordId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BillingChangeLog[];
    },
    enabled: !!billingRecordId,
  });
}

export function useBillingNotes(billingRecordId: string | null) {
  return useQuery({
    queryKey: ['billing-notes', billingRecordId],
    queryFn: async (): Promise<BillingNote[]> => {
      const { data, error } = await supabase
        .from('billing_notes')
        .select('*')
        .eq('billing_record_id', billingRecordId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BillingNote[];
    },
    enabled: !!billingRecordId,
  });
}

export function useCreateBillingRecord() {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      candidate_id: string;
      agency_id: string;
      job_id?: string;
      total_amount: number;
      currency?: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('billing_records')
        .insert({
          ...input,
          created_by: user?.id,
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Log creation
      await supabase.from('billing_change_log').insert({
        billing_record_id: (data as any).id,
        action: 'created',
        new_value: String(input.total_amount),
        changed_by: user?.id,
        changed_by_name: user?.user_metadata?.full_name || user?.email,
        changed_by_role: role || 'unknown',
        note: `Billing record created for ${input.total_amount} ${input.currency || 'EUR'}`,
      } as any);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-records'] });
    },
  });
}

export function useUpdateBillingRecord() {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
      oldRecord,
    }: {
      id: string;
      updates: Record<string, any>;
      oldRecord: BillingRecord;
    }) => {
      const { data, error } = await supabase
        .from('billing_records')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Log each changed field
      for (const key of Object.keys(updates)) {
        const oldVal = (oldRecord as any)[key];
        const newVal = updates[key];
        if (String(oldVal) !== String(newVal)) {
          await supabase.from('billing_change_log').insert({
            billing_record_id: id,
            action: 'updated',
            field_changed: key,
            old_value: String(oldVal ?? ''),
            new_value: String(newVal ?? ''),
            changed_by: user?.id,
            changed_by_name: user?.user_metadata?.full_name || user?.email,
            changed_by_role: role || 'unknown',
            note: `${key} changed from "${oldVal}" to "${newVal}"`,
          } as any);

          // If total_amount changed on an agreed record, send notification
          if (key === 'total_amount' && oldRecord.status === 'agreed') {
            await sendBillingNotification(
              id,
              oldRecord,
              user,
              `Payment amount changed from ${oldVal} to ${newVal} ${oldRecord.currency}`
            );
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-records'] });
      queryClient.invalidateQueries({ queryKey: ['billing-change-log'] });
    },
  });
}

export function useCreateBillingPayment() {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: async (input: {
      billing_record_id: string;
      amount: number;
      percentage: number;
      payment_date?: string;
      payment_method?: string;
      reference_number?: string;
      notes?: string;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from('billing_payments')
        .insert({
          ...input,
          created_by: user?.id,
        } as any)
        .select()
        .single();
      if (error) throw error;

      await supabase.from('billing_change_log').insert({
        billing_record_id: input.billing_record_id,
        billing_payment_id: (data as any).id,
        action: 'payment_added',
        new_value: String(input.amount),
        changed_by: user?.id,
        changed_by_name: user?.user_metadata?.full_name || user?.email,
        changed_by_role: role || 'unknown',
        note: `Payment of ${input.amount} (${input.percentage}%) added`,
      } as any);

      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['billing-payments', vars.billing_record_id] });
      queryClient.invalidateQueries({ queryKey: ['billing-change-log', vars.billing_record_id] });
    },
  });
}

export function useAddBillingNote() {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: async (input: { billing_record_id: string; content: string }) => {
      const { data, error } = await supabase
        .from('billing_notes')
        .insert({
          ...input,
          created_by: user?.id,
          created_by_name: user?.user_metadata?.full_name || user?.email,
          created_by_role: role || 'unknown',
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['billing-notes', vars.billing_record_id] });
    },
  });
}

async function sendBillingNotification(
  billingRecordId: string,
  record: BillingRecord,
  currentUser: any,
  message: string
) {
  // Notify the agency owner
  if (record.agency_id) {
    const { data: agencyProfile } = await supabase
      .from('agency_profiles')
      .select('user_id, company_name')
      .eq('id', record.agency_id)
      .single();

    if (agencyProfile && agencyProfile.user_id !== currentUser?.id) {
      await supabase.from('notifications').insert({
        user_id: agencyProfile.user_id,
        title: 'Billing Amount Modified',
        message,
        type: 'billing_change',
        related_entity_type: 'billing_record',
        related_entity_id: billingRecordId,
      });
    }
  }

  // Notify admins (if change was made by agency)
  const { data: adminRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');

  if (adminRoles) {
    for (const admin of adminRoles) {
      if (admin.user_id !== currentUser?.id) {
        await supabase.from('notifications').insert({
          user_id: admin.user_id,
          title: 'Billing Amount Modified',
          message,
          type: 'billing_change',
          related_entity_type: 'billing_record',
          related_entity_id: billingRecordId,
        });
      }
    }
  }
}
