import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useClientDocuments(clientId: string) {
  return useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
}

export function useUploadClientDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, file, docType }: { clientId: string; file: File; docType: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'];
      const MAX_FILE_SIZE = 10 * 1024 * 1024;

      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_MIME_TYPES.includes(file.type) || !ALLOWED_EXTENSIONS.includes(fileExt)) {
        throw new Error('FILE_TYPE_NOT_ALLOWED');
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('FILE_TOO_LARGE');
      }

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${user.id}/${clientId}/${Date.now()}_${sanitizedName}`;
      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error } = await supabase.from('client_documents').insert({
        client_id: clientId,
        name: sanitizedName,
        doc_type: docType,
        storage_path: filePath,
        file_size: file.size,
        uploaded_by: user.id,
      });
      if (error) throw error;

      await supabase.from('client_activity_log').insert({
        client_id: clientId,
        action: 'document_uploaded',
        details: { file_name: sanitizedName, doc_type: docType },
        performed_by: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
      queryClient.invalidateQueries({ queryKey: ['client-activity'] });
      toast({ title: 'Document uploaded successfully' });
    },
    onError: (error: Error) => {
      if (error.message === 'FILE_TYPE_NOT_ALLOWED') {
        toast({ title: 'File type not allowed', description: 'Please upload PDF, image, or Word documents only.', variant: 'destructive' });
      } else if (error.message === 'FILE_TOO_LARGE') {
        toast({ title: 'File too large', description: 'Maximum file size is 10MB.', variant: 'destructive' });
      } else {
        toast({ title: 'Upload failed', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
      }
    },
  });
}

export function useDeleteClientDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('client_documents').delete().eq('id', id).eq('uploaded_by', user.id);
      if (error) throw error;
      await supabase.storage.from('client-documents').remove([storagePath]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-documents'] });
      toast({ title: 'Document deleted' });
    },
    onError: () => {
      toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    },
  });
}
