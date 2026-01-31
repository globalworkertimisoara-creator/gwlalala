import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Document, CreateDocumentInput, DocType } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function useDocuments(candidateId: string | undefined) {
  return useQuery({
    queryKey: ['documents', candidateId],
    queryFn: async () => {
      if (!candidateId) return [];

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as Document[];
    },
    enabled: !!candidateId,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      candidateId, 
      file, 
      docType 
    }: { 
      candidateId: string; 
      file: File; 
      docType: DocType;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${candidateId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('candidate-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          candidate_id: candidateId,
          file_name: file.name,
          storage_path: fileName,
          doc_type: docType,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Document;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents', data.candidate_id] });
      toast({
        title: 'Document uploaded',
        description: 'The document has been uploaded successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to upload document',
        description: error.message,
      });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, storagePath, candidateId }: { 
      id: string; 
      storagePath: string;
      candidateId: string;
    }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('candidate-documents')
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return candidateId;
    },
    onSuccess: (candidateId) => {
      queryClient.invalidateQueries({ queryKey: ['documents', candidateId] });
      toast({
        title: 'Document deleted',
        description: 'The document has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to delete document',
        description: error.message,
      });
    },
  });
}

export function useDocumentUrl(storagePath: string | undefined) {
  return useQuery({
    queryKey: ['document-url', storagePath],
    queryFn: async () => {
      if (!storagePath) return null;

      const { data } = await supabase.storage
        .from('candidate-documents')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      return data?.signedUrl;
    },
    enabled: !!storagePath,
  });
}
