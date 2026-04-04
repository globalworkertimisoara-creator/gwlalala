import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { sanitizeTextInput } from '@/types/client';

// ─── Client Contacts ──────────────────────────────────────

export function useClientContacts(clientId: string) {
  return useQuery({
    queryKey: ['client-contacts', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_id', clientId)
        .order('is_primary', { ascending: false })
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
}

export function useCreateClientContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, any>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const sanitized: Record<string, any> = { created_by: user.id };
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = typeof value === 'string' ? sanitizeTextInput(value) : value;
      }
      const { data, error } = await supabase.from('client_contacts').insert(sanitized as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts', variables.client_id] });
      toast({ title: 'Contact added successfully' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

export function useUpdateClientContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, client_id, ...updates }: { id: string; client_id: string } & Record<string, any>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(updates)) {
        sanitized[key] = typeof value === 'string' ? sanitizeTextInput(value) : value;
      }
      const { error } = await supabase.from('client_contacts').update(sanitized).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts', variables.client_id] });
      toast({ title: 'Contact updated successfully' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

export function useDeleteClientContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, client_id }: { id: string; client_id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('client_contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts', variables.client_id] });
      toast({ title: 'Contact removed' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

// ─── Client Meetings ──────────────────────────────────────

export function useClientMeetings(clientId: string) {
  return useQuery({
    queryKey: ['client-meetings', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_meetings')
        .select('*')
        .eq('client_id', clientId)
        .order('meeting_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
}

export function useCreateClientMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, any>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const sanitized: Record<string, any> = { created_by: user.id };
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = typeof value === 'string' ? sanitizeTextInput(value) : value;
      }
      const { data, error } = await supabase.from('client_meetings').insert(sanitized).select().single();
      if (error) throw error;

      await supabase.from('client_activity_log').insert({
        client_id: input.client_id,
        action: 'meeting_scheduled',
        details: { title: input.title, date: input.meeting_date },
        performed_by: user.id,
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-meetings', variables.client_id] });
      toast({ title: 'Meeting scheduled successfully' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

export function useUpdateClientMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, client_id, ...updates }: { id: string; client_id: string } & Record<string, any>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(updates)) {
        sanitized[key] = typeof value === 'string' ? sanitizeTextInput(value) : value;
      }
      const { error } = await supabase.from('client_meetings').update(sanitized).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-meetings', variables.client_id] });
      toast({ title: 'Meeting updated' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

// ─── Client Relationships ─────────────────────────────────

export function useClientRelationships(clientId: string) {
  return useQuery({
    queryKey: ['client-relationships', clientId],
    queryFn: async () => {
      const { data: outgoing, error: err1 } = await supabase
        .from('client_relationships')
        .select('*')
        .eq('client_id', clientId);
      if (err1) throw err1;

      const { data: incoming, error: err2 } = await supabase
        .from('client_relationships')
        .select('*')
        .eq('related_client_id', clientId);
      if (err2) throw err2;

      return { outgoing: outgoing || [], incoming: incoming || [] };
    },
    enabled: !!clientId,
  });
}

export function useCreateClientRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { client_id: string; related_client_id: string; relationship_type: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('client_relationships').insert({
        ...input,
        notes: input.notes ? sanitizeTextInput(input.notes) : null,
        created_by: user.id,
      }).select().single();
      if (error) throw error;

      await supabase.from('client_activity_log').insert({
        client_id: input.client_id,
        action: 'relationship_added',
        details: { related_client_id: input.related_client_id, type: input.relationship_type },
        performed_by: user.id,
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-relationships', variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ['client-relationships', variables.related_client_id] });
      toast({ title: 'Relationship added' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

export function useDeleteClientRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, client_id, related_client_id }: { id: string; client_id: string; related_client_id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('client_relationships').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-relationships', variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ['client-relationships', variables.related_client_id] });
      toast({ title: 'Relationship removed' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

// ─── Client Custom Fields ─────────────────────────────────

export function useClientCustomFields(clientId: string) {
  return useQuery({
    queryKey: ['client-custom-fields', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_custom_fields')
        .select('*')
        .eq('client_id', clientId)
        .order('field_name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
}

export function useUpsertClientCustomField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { client_id: string; field_name: string; field_value: string; field_type?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('client_custom_fields').upsert({
        client_id: input.client_id,
        field_name: sanitizeTextInput(input.field_name),
        field_value: sanitizeTextInput(input.field_value),
        field_type: input.field_type || 'text',
        created_by: user.id,
      }, { onConflict: 'client_id,field_name' }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-custom-fields', variables.client_id] });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}

export function useDeleteClientCustomField() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, client_id }: { id: string; client_id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('client_custom_fields').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-custom-fields', variables.client_id] });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}
