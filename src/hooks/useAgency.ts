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
  AgencyDocType,
  ApprovalStatus,
  Notification,
  INITIAL_REQUIRED_DOCS
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
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateAgencyWorkerInput & { id: string }) => {
      // If approving/rejecting, add reviewer info
      const updateData: any = { ...input };
      if (input.approval_status && input.approval_status !== 'pending_review') {
        updateData.reviewed_by = user?.id;
        updateData.reviewed_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('agency_workers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as AgencyWorker;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-workers'] });
      queryClient.invalidateQueries({ queryKey: ['agency-worker'] });
      queryClient.invalidateQueries({ queryKey: ['all-agency-workers'] });
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

// Hook for staff to approve/reject workers
export function useReviewWorker() {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      workerId, 
      status, 
      notes,
      newStage
    }: { 
      workerId: string; 
      status: ApprovalStatus; 
      notes?: string;
      newStage?: string;
    }) => {
      const updateData: any = {
        approval_status: status,
        review_notes: notes || null,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      };
      
      // If approving, optionally advance stage
      if (status === 'approved' && newStage) {
        updateData.current_stage = newStage;
      }
      
      // For notifications we need user_id - this is internal system use only
      // RLS on agency_profiles ensures only admins can see full contact details
      // Non-admins will get null for restricted columns due to RLS
      const { data, error } = await supabase
        .from('agency_workers')
        .update(updateData)
        .eq('id', workerId)
        .select(`
          *,
          job:jobs(id, title, client_company, country, status),
          agency:agency_profiles(id, user_id, company_name, country)
        `)
        .single();
      
      if (error) throw error;
      
      // Create notification for agency (placeholder for future email integration)
      if (data && (data as any).agency?.user_id) {
        const agencyUserId = (data as any).agency.user_id;
        const workerName = data.full_name;
        const jobTitle = (data as any).job?.title || 'Unknown Job';
        
        let title: string;
        let message: string;
        
        switch (status) {
          case 'approved':
            title = 'Worker Approved';
            message = `${workerName} has been approved for ${jobTitle}. They will now proceed through the recruitment process.`;
            break;
          case 'rejected':
            title = 'Worker Rejected';
            message = `${workerName} has been rejected for ${jobTitle}.${notes ? ` Reason: ${notes}` : ''}`;
            break;
          case 'needs_documents':
            title = 'Documents Required';
            message = `Additional documents are required for ${workerName}'s application to ${jobTitle}.${notes ? ` Details: ${notes}` : ''}`;
            break;
          default:
            title = 'Application Status Updated';
            message = `The status of ${workerName}'s application has been updated.`;
        }
        
        await supabase.from('notifications').insert({
          user_id: agencyUserId,
          title,
          message,
          type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'warning',
          related_entity_type: 'agency_worker',
          related_entity_id: workerId,
        });
      }
      
      return data as AgencyWorker;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agency-workers'] });
      queryClient.invalidateQueries({ queryKey: ['agency-worker'] });
      queryClient.invalidateQueries({ queryKey: ['all-agency-workers'] });
      
      const statusLabels: Record<ApprovalStatus, string> = {
        approved: 'approved',
        rejected: 'rejected',
        needs_documents: 'marked as needing documents',
        pending_review: 'returned to pending review',
      };
      
      toast({
        title: 'Review completed',
        description: `Worker has been ${statusLabels[variables.status]}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to review worker',
        description: error.message,
      });
    },
  });
}

// Hook to check if worker has all required documents for their stage
export function useDocumentCompleteness(workerId: string | undefined, currentStage: string) {
  const { data: documents } = useWorkerDocuments(workerId);
  
  const uploadedDocTypes = documents?.map(d => d.doc_type) || [];
  
  // Check initial required docs
  const missingInitialDocs = INITIAL_REQUIRED_DOCS.filter(
    docType => !uploadedDocTypes.includes(docType)
  );
  
  const hasAllInitialDocs = missingInitialDocs.length === 0;
  
  return {
    hasAllInitialDocs,
    missingInitialDocs,
    uploadedDocTypes,
    documentCount: documents?.length || 0,
  };
}

// Hook to get notifications
export function useNotifications() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });
}

// Hook to mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Hook to get unread notification count
export function useUnreadNotificationCount() {
  const { data: notifications } = useNotifications();
  return notifications?.filter(n => !n.is_read).length || 0;
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
// Non-admin staff only get limited agency info (company_name, country) - no contact details
export function useAllAgencyWorkers(filters?: { stage?: string; jobId?: string }) {
  const { role, isAdmin } = useAuth();
  
  // All internal staff roles can view agency workers
  const isInternalStaff = role === 'admin' || role === 'recruiter' || role === 'operations_manager' || role === 'documentation_staff';
  
  return useQuery({
    queryKey: ['all-agency-workers', filters, isAdmin],
    queryFn: async () => {
      // For admin users, include full agency profile info
      // For other staff, only include limited agency info (id, company_name, country)
      const agencySelect = isAdmin 
        ? 'agency:agency_profiles(id, company_name, country, email, phone, contact_person, address)'
        : 'agency:agency_profiles(id, company_name, country)';
      
      let query = supabase
        .from('agency_workers')
        .select(`
          *,
          job:jobs(id, title, client_company, country, status),
          ${agencySelect}
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
    enabled: isInternalStaff,
  });
}
