/**
 * src/hooks/useWorkflow.ts
 *
 * React hooks for managing candidate workflow data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type WorkflowPhase = 
  | 'recruitment' 
  | 'documentation' 
  | 'visa' 
  | 'arrival' 
  | 'residence_permit';

type WorkflowType = 'full_immigration' | 'no_visa';
type DocumentStatus = 'pending' | 'uploaded' | 'under_review' | 'approved' | 'rejected';

// ─── Fetch Workflow ───────────────────────────────────────────────────────────

export function useWorkflow(candidateId: string, projectId: string) {
  return useQuery({
    queryKey: ['workflow', candidateId, projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidate_workflow')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('project_id', projectId)
        .single();

      if (error) throw error;
      return data;
    },
  });
}

// ─── Create Workflow ──────────────────────────────────────────────────────────

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      candidateId,
      projectId,
      workflowType,
    }: {
      candidateId: string;
      projectId: string;
      workflowType: WorkflowType;
    }) => {
      const { data, error } = await supabase
        .from('candidate_workflow')
        .insert({
          candidate_id: candidateId,
          project_id: projectId,
          workflow_type: workflowType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workflow', variables.candidateId, variables.projectId],
      });
      toast({ title: 'Workflow created successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create workflow',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ─── Fetch Document Templates ─────────────────────────────────────────────────

export function useDocumentTemplates(phase: WorkflowPhase) {
  return useQuery({
    queryKey: ['document-templates', phase],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('phase', phase)
        .order('sort_order');

      if (error) throw error;
      return data;
    },
  });
}

// ─── Fetch Workflow Documents ─────────────────────────────────────────────────

export function useWorkflowDocuments(workflowId: string, phase?: WorkflowPhase) {
  return useQuery({
    queryKey: ['workflow-documents', workflowId, phase],
    queryFn: async () => {
      let query = supabase
        .from('workflow_documents')
        .select('*')
        .eq('workflow_id', workflowId);

      if (phase) {
        query = query.eq('phase', phase);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

// ─── Upload Document ──────────────────────────────────────────────────────────

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      workflowId,
      templateId,
      documentName,
      phase,
      fileUrl,
      fileSize,
      mimeType,
    }: {
      workflowId: string;
      templateId: string;
      documentName: string;
      phase: WorkflowPhase;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
    }) => {
      const { data, error } = await supabase
        .from('workflow_documents')
        .insert({
          workflow_id: workflowId,
          template_id: templateId,
          document_name: documentName,
          phase,
          file_url: fileUrl,
          file_size: fileSize,
          mime_type: mimeType,
          status: 'uploaded',
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-documents', variables.workflowId] });
      toast({ title: 'Document uploaded successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ─── Review Document ──────────────────────────────────────────────────────────

export function useReviewDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      documentId,
      status,
      notes,
    }: {
      documentId: string;
      status: 'approved' | 'rejected';
      notes: string;
    }) => {
      const { data, error } = await supabase
        .from('workflow_documents')
        .update({
          status,
          review_notes: notes,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflow-documents'] });
      queryClient.invalidateQueries({ queryKey: ['workflow'] });
      toast({
        title: `Document ${data.status}`,
        description: data.status === 'approved' ? 'Document approved successfully' : 'Document rejected',
      });
    },
    onError: (error) => {
      toast({
        title: 'Review failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ─── Manual Phase Advance ─────────────────────────────────────────────────────

export function useAdvancePhase() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      workflowId,
      newPhase,
    }: {
      workflowId: string;
      newPhase: WorkflowPhase;
    }) => {
      const { data, error } = await supabase
        .from('candidate_workflow')
        .update({ current_phase: newPhase })
        .eq('id', workflowId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow'] });
      toast({ title: 'Phase advanced successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to advance phase',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
