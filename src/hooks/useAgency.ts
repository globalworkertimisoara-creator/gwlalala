import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  AgencyProfile, 
  AgencyWorker, 
  AgencyWorkerDocument,
  CreateAgencyProfileInput,
  UpdateAgencyProfileInput,
  CreateAgencyWorkerInput,
  UpdateAgencyWorkerInput,
  AgencyDocType
} from '@/types/agency';

// Hook to get agency profile for current user
export function useAgencyProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['agency-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('agency_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as AgencyProfile | null;
    },
    enabled: !!user,
  });
}

// Hook to create agency profile
export function useCreateAgencyProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (input: CreateAgencyProfileInput) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('agency_profiles')
        .insert({
          user_id: user.id,
          ...input,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as AgencyProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-profile'] });
      toast({
        title: 'Profile created',
        description: 'Your agency profile has been set up successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to create profile',
        description: error.message,
      });
    },
  });
}

// Hook to update agency profile
export function useUpdateAgencyProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateAgencyProfileInput & { id: string }) => {
      const { data, error } = await supabase
        .from('agency_profiles')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as AgencyProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-profile'] });
      toast({
        title: 'Profile updated',
        description: 'Your agency profile has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update profile',
        description: error.message,
      });
    },
  });
}

// Hook to get open jobs for agencies to apply to
export function useOpenJobs() {
  return useQuery({
    queryKey: ['open-jobs-for-agency'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, client_company, country, salary_range, required_skills, description, status')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Hook to get workers submitted by agency
export function useAgencyWorkers(agencyId: string | undefined) {
  return useQuery({
    queryKey: ['agency-workers', agencyId],
    queryFn: async () => {
      if (!agencyId) return [];
      
      const { data, error } = await supabase
        .from('agency_workers')
        .select(`
          *,
          job:jobs(id, title, client_company, country, status)
        `)
        .eq('agency_id', agencyId)
        .order('submitted_at', { ascending: false });
      
      if (error) throw error;
      return data as AgencyWorker[];
    },
    enabled: !!agencyId,
  });
}

// Hook to get single worker with documents
export function useAgencyWorker(workerId: string | undefined) {
  return useQuery({
    queryKey: ['agency-worker', workerId],
    queryFn: async () => {
      if (!workerId) return null;
      
      const { data: worker, error: workerError } = await supabase
        .from('agency_workers')
        .select(`
          *,
          job:jobs(id, title, client_company, country, status)
        `)
        .eq('id', workerId)
        .single();
      
      if (workerError) throw workerError;
      
      const { data: documents, error: docsError } = await supabase
        .from('agency_worker_documents')
        .select('*')
        .eq('worker_id', workerId)
        .order('uploaded_at', { ascending: false });
      
      if (docsError) throw docsError;
      
      return { ...worker, documents } as AgencyWorker;
    },
    enabled: !!workerId,
  });
}

// Hook to create worker submission
export function useCreateAgencyWorker() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ agencyId, ...input }: CreateAgencyWorkerInput & { agencyId: string }) => {
      const { data, error } = await supabase
        .from('agency_workers')
        .insert({
          agency_id: agencyId,
          ...input,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as AgencyWorker;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agency-workers'] });
      toast({
        title: 'Worker submitted',
        description: 'The worker has been submitted successfully. Please upload required documents.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to submit worker',
        description: error.message,
      });
    },
  });
}

// Hook to update worker (for internal staff)
export function useUpdateAgencyWorker() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateAgencyWorkerInput & { id: string }) => {
      const { data, error } = await supabase
        .from('agency_workers')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as AgencyWorker;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-workers'] });
      queryClient.invalidateQueries({ queryKey: ['agency-worker'] });
      toast({
        title: 'Worker updated',
        description: 'The worker information has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update worker',
        description: error.message,
      });
    },
  });
}

// Hook to upload worker document
export function useUploadWorkerDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      workerId, 
      file, 
      docType 
    }: { 
      workerId: string; 
      file: File; 
      docType: AgencyDocType;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${workerId}/${docType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('agency-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('agency_worker_documents')
        .insert({
          worker_id: workerId,
          doc_type: docType,
          file_name: file.name,
          storage_path: fileName,
          file_size: file.size,
        })
        .select()
        .single();

      if (error) throw error;
      return data as AgencyWorkerDocument;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agency-worker', data.worker_id] });
      queryClient.invalidateQueries({ queryKey: ['worker-documents', data.worker_id] });
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

// Hook to get worker documents
export function useWorkerDocuments(workerId: string | undefined) {
  return useQuery({
    queryKey: ['worker-documents', workerId],
    queryFn: async () => {
      if (!workerId) return [];
      
      const { data, error } = await supabase
        .from('agency_worker_documents')
        .select('*')
        .eq('worker_id', workerId)
        .order('uploaded_at', { ascending: false });
      
      if (error) throw error;
      return data as AgencyWorkerDocument[];
    },
    enabled: !!workerId,
  });
}

// Hook to delete worker document
export function useDeleteWorkerDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, storagePath, workerId }: { 
      id: string; 
      storagePath: string;
      workerId: string;
    }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('agency-documents')
        .remove([storagePath]);

      if (storageError) throw storageError;

      // Delete document record
      const { error } = await supabase
        .from('agency_worker_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return workerId;
    },
    onSuccess: (workerId) => {
      queryClient.invalidateQueries({ queryKey: ['agency-worker', workerId] });
      queryClient.invalidateQueries({ queryKey: ['worker-documents', workerId] });
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

// Hook to get signed URL for document
export function useWorkerDocumentUrl(storagePath: string | undefined) {
  return useQuery({
    queryKey: ['worker-document-url', storagePath],
    queryFn: async () => {
      if (!storagePath) return null;

      const { data } = await supabase.storage
        .from('agency-documents')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      return data?.signedUrl;
    },
    enabled: !!storagePath,
  });
}

// Hook for staff to get all agency workers (for review)
export function useAllAgencyWorkers(filters?: { stage?: string; jobId?: string }) {
  const { role } = useAuth();
  
  return useQuery({
    queryKey: ['all-agency-workers', filters],
    queryFn: async () => {
      let query = supabase
        .from('agency_workers')
        .select(`
          *,
          job:jobs(id, title, client_company, country, status),
          agency:agency_profiles(id, company_name, country)
        `)
        .order('submitted_at', { ascending: false });
      
      if (filters?.stage && filters.stage !== 'all') {
        query = query.eq('current_stage', filters.stage as any);
      }
      
      if (filters?.jobId && filters.jobId !== 'all') {
        query = query.eq('job_id', filters.jobId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: role === 'admin' || role === 'recruiter',
  });
}
