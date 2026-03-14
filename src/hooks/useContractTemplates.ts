import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface ContractTemplate {
  id: string;
  name: string;
  template_type: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractTemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  file_name: string;
  file_size: number | null;
  storage_path: string;
  uploaded_by: string | null;
  notes: string | null;
  created_at: string;
}

export const TEMPLATE_TYPES = [
  { value: 'recruitment', label: 'Recruitment Contract' },
  { value: 'visa', label: 'Visa Contract' },
  { value: 'work_permit', label: 'Work Permit Contract' },
  { value: 'employment', label: 'Employment Agreement' },
  { value: 'agency_client', label: 'Agency-Client Agreement' },
  { value: 'other', label: 'Other' },
] as const;

export function useContractTemplates() {
  return useQuery({
    queryKey: ['contract-templates'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('contract_templates')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as ContractTemplate[];
    },
  });
}

export function useContractTemplateVersions(templateId: string | null) {
  return useQuery({
    queryKey: ['contract-template-versions', templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('contract_template_versions')
        .select('*')
        .eq('template_id', templateId)
        .order('version_number', { ascending: false });
      if (error) throw error;
      return data as ContractTemplateVersion[];
    },
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { name: string; template_type: string; description?: string }) => {
      const { data, error } = await (supabase as any)
        .from('contract_templates')
        .insert({ ...input, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as ContractTemplate;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({ title: 'Template created' });
    },
    onError: (e: Error) => toast({ title: 'Failed to create template', description: e.message, variant: 'destructive' }),
  });
}

export function useUploadTemplateVersion() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { templateId: string; file: File; notes?: string; nextVersion: number }) => {
      const path = `templates/${input.templateId}/v${input.nextVersion}_${input.file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('contract-documents')
        .upload(path, input.file, { upsert: false });
      if (uploadErr) throw uploadErr;

      const { error } = await (supabase as any)
        .from('contract_template_versions')
        .insert({
          template_id: input.templateId,
          version_number: input.nextVersion,
          file_name: input.file.name,
          file_size: input.file.size,
          storage_path: path,
          uploaded_by: user?.id,
          notes: input.notes || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract-template-versions'] });
      qc.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({ title: 'Version uploaded' });
    },
    onError: (e: Error) => toast({ title: 'Upload failed', description: e.message, variant: 'destructive' }),
  });
}

export function useToggleTemplateActive() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from('contract_templates')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({ title: 'Template updated' });
    },
    onError: (e: Error) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('contract_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract-templates'] });
      toast({ title: 'Template deleted' });
    },
    onError: (e: Error) => toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }),
  });
}
