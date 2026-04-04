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
      const { data, error } = await supabase.from('client_meetings').insert(sanitized as any).select().single();
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

const INVERSE_RELATIONSHIP: Record<string, string> = {
  parent: 'subsidiary',
  subsidiary: 'parent',
  referral: 'referral',
  partner: 'partner',
  related: 'related',
};

export function useCreateClientRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { client_id: string; related_client_id: string; relationship_type: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // IDOR prevention — verify access to both clients
      const { data: clientA } = await supabase.from('clients').select('id').eq('id', input.client_id).single();
      const { data: clientB } = await supabase.from('clients').select('id').eq('id', input.related_client_id).single();
      if (!clientA || !clientB) throw new Error('Invalid client');

      const { data, error } = await supabase.from('client_relationships').insert({
        ...input,
        notes: input.notes ? sanitizeTextInput(input.notes) : null,
        created_by: user.id,
      }).select().single();
      if (error) throw error;

      // Create inverse relationship
      const inverseType = INVERSE_RELATIONSHIP[input.relationship_type] || 'related';
      try {
        await supabase.from('client_relationships').insert({
          client_id: input.related_client_id,
          related_client_id: input.client_id,
          relationship_type: inverseType,
          notes: input.notes ? sanitizeTextInput(input.notes) : null,
          created_by: user.id,
        }).select().single();
      } catch {
        // ignore duplicate
      }

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
    mutationFn: async ({ id, client_id, related_client_id, relationship_type }: { id: string; client_id: string; related_client_id: string; relationship_type?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('client_relationships').delete().eq('id', id);
      if (error) throw error;

      // Also delete the inverse
      if (relationship_type) {
        const inverseType = INVERSE_RELATIONSHIP[relationship_type] || 'related';
        try {
          await supabase.from('client_relationships')
            .delete()
            .eq('client_id', related_client_id)
            .eq('related_client_id', client_id)
            .eq('relationship_type', inverseType);
        } catch {
          // ignore if not found
        }
      }
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

// ─── Client Documents (with folders & versioning) ─────────

export function useClientDocuments(clientId: string, folder?: string) {
  return useQuery({
    queryKey: ['client-documents', clientId, folder],
    queryFn: async () => {
      let query = supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (folder && folder !== 'all') {
        query = query.eq('folder', folder);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
}

export function useDocumentVersions(rootId: string | null) {
  return useQuery({
    queryKey: ['client-document-versions', rootId],
    queryFn: async () => {
      if (!rootId) return [];
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rootId)) return [];
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .or(`id.eq.${rootId},parent_document_id.eq.${rootId}`)
        .order('version', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!rootId,
  });
}

export function useUploadClientDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      client_id: string;
      file: File;
      name: string;
      doc_type: string;
      folder: string;
      description?: string;
      parent_document_id?: string;
      version?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (input.file.size > 10 * 1024 * 1024) throw new Error('FILE_TOO_LARGE');

      const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.png', '.jpg', '.jpeg'];
      const ext = '.' + input.file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(ext)) throw new Error('INVALID_FILE_TYPE');

      const VALID_FOLDERS = ['general', 'contracts', 'invoices', 'legal', 'proposals', 'reports', 'correspondence'];
      if (!VALID_FOLDERS.includes(input.folder)) throw new Error('INVALID_FOLDER');

      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.client_id)) {
        throw new Error('Not authenticated');
      }

      const safeFilename = input.file.name.replace(/[/\\]/g, '_').replace(/\.{2,}/g, '_');
      const storagePath = `${input.client_id}/${input.folder}/${Date.now()}_${safeFilename}`;
      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(storagePath, input.file);
      if (uploadError) throw uploadError;

      const { data, error } = await supabase.from('client_documents').insert({
        client_id: input.client_id,
        name: sanitizeTextInput(input.name),
        doc_type: input.doc_type,
        storage_path: storagePath,
        file_size: input.file.size,
        folder: input.folder,
        version: input.version || 1,
        parent_document_id: input.parent_document_id || null,
        description: input.description ? sanitizeTextInput(input.description) : null,
        uploaded_by: user.id,
      }).select().single();
      if (error) throw error;

      await supabase.from('client_activity_log').insert({
        client_id: input.client_id,
        action: 'document_uploaded',
        details: { name: input.name, folder: input.folder, version: input.version || 1 },
        performed_by: user.id,
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ['client-document-versions'] });
      toast({ title: 'Document uploaded successfully' });
    },
    onError: (error: Error) => {
      if (error.message === 'FILE_TOO_LARGE') {
        toast({ title: 'File too large', description: 'Maximum file size is 10MB.', variant: 'destructive' });
      } else if (error.message === 'INVALID_FILE_TYPE') {
        toast({ title: 'Invalid file type', description: 'Allowed types: PDF, Word, Excel, CSV, TXT, PNG, JPG.', variant: 'destructive' });
      } else if (error.message === 'INVALID_FOLDER') {
        toast({ title: 'Invalid folder', description: 'Please select a valid folder.', variant: 'destructive' });
      } else {
        toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
      }
    },
  });
}

export function useDeleteClientDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, client_id, storage_path }: { id: string; client_id: string; storage_path: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Find all versions to delete
      const rootId = id;
      const { data: versions } = await supabase
        .from('client_documents')
        .select('id, storage_path')
        .or(`id.eq.${rootId},parent_document_id.eq.${rootId}`);

      const storagePaths = versions?.map(v => v.storage_path) || [storage_path];
      const ids = versions?.map(v => v.id) || [id];

      // Delete from storage
      await supabase.storage.from('client-documents').remove(storagePaths);

      // Delete all version records
      for (const docId of ids) {
        await supabase.from('client_documents').delete().eq('id', docId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-documents', variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ['client-document-versions'] });
      toast({ title: 'Document deleted' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}
