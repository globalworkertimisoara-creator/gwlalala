import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Document, CreateDocumentInput, DocType } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useDocumentExtraction, ExtractedData } from '@/hooks/useDocumentExtraction';

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

// Enhanced upload hook with OCR extraction
export function useUploadDocumentWithOCR() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { extractData, isExtracting } = useDocumentExtraction();

  const mutation = useMutation({
    mutationFn: async ({ 
      candidateId, 
      file, 
      docType 
    }: { 
      candidateId: string; 
      file: File; 
      docType: DocType;
    }): Promise<{ document: Document; extractedData: ExtractedData | null }> => {
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
      
      // Check if extractable document type
      const isExtractable = file.type.includes('image') || 
                            file.type === 'application/pdf' ||
                            file.name.endsWith('.pdf');
      
      let extractedData: ExtractedData | null = null;
      if (isExtractable) {
        extractedData = await extractData(fileName, docType, 'candidate-documents');
      }

      return { document: data as Document, extractedData };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['documents', result.document.candidate_id] });
      if (result.extractedData) {
        toast({
          title: 'Document uploaded & data extracted',
          description: 'The document has been uploaded and data has been extracted.',
        });
      } else {
        toast({
          title: 'Document uploaded',
          description: 'The document has been uploaded successfully.',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to upload document',
        description: error.message,
      });
    },
  });

  return {
    ...mutation,
    isExtracting,
  };
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
      // Verify auth before any destructive operations
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('candidate-documents')
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete document record — scoped to uploader for ownership check
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('uploaded_by', currentUser.id);

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
