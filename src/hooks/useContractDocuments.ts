import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ContractDocument {
  id: string;
  contract_id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export function useContractDocuments(contractId: string) {
  return useQuery({
    queryKey: ['contract-documents', contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contract_documents')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ContractDocument[];
    },
    enabled: !!contractId,
  });
}

export function useUploadContractDocument() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      contractId,
      file,
      fileType = 'other',
    }: {
      contractId: string;
      file: File;
      fileType?: string;
    }) => {
      const path = `${contractId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('contract-documents')
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('contract_documents')
        .insert({
          contract_id: contractId,
          file_name: file.name,
          file_type: fileType,
          storage_path: path,
          file_size: file.size,
          uploaded_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ContractDocument;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['contract-documents', vars.contractId] });
    },
  });
}

export function useDeleteContractDocument() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, storagePath, contractId }: { id: string; storagePath: string; contractId: string }) => {
      await supabase.storage.from('contract-documents').remove([storagePath]);
      const { error } = await supabase.from('contract_documents').delete().eq('id', id);
      if (error) throw error;
      return contractId;
    },
    onSuccess: (contractId) => {
      qc.invalidateQueries({ queryKey: ['contract-documents', contractId] });
    },
  });
}
