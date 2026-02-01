// Agency types for GlobalWorker Recruitment Tracker

import { RecruitmentStage } from './database';

export type AgencyDocType = 
  | 'cv'
  | 'passport'
  | 'photo'
  | 'working_video'
  | 'presentation_video'
  | 'trade_certificate'
  | 'medical_clearance'
  | 'training_doc'
  | 'plane_ticket'
  | 'visa_document'
  | 'other';

export type ApprovalStatus = 'pending_review' | 'approved' | 'rejected' | 'needs_documents';

export const APPROVAL_STATUS_CONFIG: { 
  value: ApprovalStatus; 
  label: string; 
  color: string; 
  description: string;
}[] = [
  { value: 'pending_review', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', description: 'Awaiting staff review' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800', description: 'Worker approved to proceed' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800', description: 'Worker rejected' },
  { value: 'needs_documents', label: 'Needs Documents', color: 'bg-orange-100 text-orange-800', description: 'Missing required documents' },
];

export const getApprovalStatusLabel = (status: ApprovalStatus): string => {
  return APPROVAL_STATUS_CONFIG.find(s => s.value === status)?.label || status;
};

export const getApprovalStatusColor = (status: ApprovalStatus): string => {
  return APPROVAL_STATUS_CONFIG.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-700';
};

// Document type configuration with labels and stage requirements
export const AGENCY_DOC_TYPES: { 
  value: AgencyDocType; 
  label: string; 
  requiredAtStages?: RecruitmentStage[];
  accept?: string;
}[] = [
  { value: 'cv', label: 'CV / Resume', requiredAtStages: ['sourced'], accept: '.pdf,.doc,.docx' },
  { value: 'passport', label: 'Passport', requiredAtStages: ['sourced'], accept: '.pdf,.jpg,.jpeg,.png' },
  { value: 'photo', label: 'Photo', requiredAtStages: ['sourced'], accept: '.jpg,.jpeg,.png' },
  { value: 'working_video', label: 'Working/Skills Video', requiredAtStages: ['sourced'], accept: 'video/*' },
  { value: 'presentation_video', label: 'Presentation/Interview Video', requiredAtStages: ['sourced'], accept: 'video/*' },
  { value: 'trade_certificate', label: 'Trade Certificate', requiredAtStages: ['screening'], accept: '.pdf,.jpg,.jpeg,.png' },
  { value: 'medical_clearance', label: 'Medical Clearance', requiredAtStages: ['medical_checks'], accept: '.pdf,.jpg,.jpeg,.png' },
  { value: 'training_doc', label: 'Training Document', requiredAtStages: ['screening'], accept: '.pdf,.jpg,.jpeg,.png' },
  { value: 'plane_ticket', label: 'Plane Ticket', requiredAtStages: ['onboarding'], accept: '.pdf,.jpg,.jpeg,.png' },
  { value: 'visa_document', label: 'Visa Document', requiredAtStages: ['visa_processing'], accept: '.pdf,.jpg,.jpeg,.png' },
  { value: 'other', label: 'Other Document', accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png,video/*' },
];

export const getDocTypeLabel = (docType: AgencyDocType): string => {
  return AGENCY_DOC_TYPES.find(d => d.value === docType)?.label || docType;
};

export const getRequiredDocsForStage = (stage: RecruitmentStage): AgencyDocType[] => {
  return AGENCY_DOC_TYPES
    .filter(d => d.requiredAtStages?.includes(stage))
    .map(d => d.value);
};

// Initial required documents for submission
export const INITIAL_REQUIRED_DOCS: AgencyDocType[] = ['cv', 'passport', 'photo', 'working_video', 'presentation_video'];

export interface AgencyProfile {
  id: string;
  user_id: string;
  company_name: string;
  country: string;
  contact_person: string;
  email: string;
  phone: string | null;
  address: string | null;
  recruitment_license: string | null;
  certifications: string | null;
  years_in_business: number | null;
  worker_capacity: number | null;
  specializations: string | null;
  countries_recruiting_from: string | null;
  industries_focus: string | null;
  has_testing_facilities: boolean;
  testing_facilities_locations: string | null;
  office_locations: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgencyWorker {
  id: string;
  agency_id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  nationality: string;
  current_country: string | null;
  date_of_birth: string | null;
  skills: string | null;
  experience_years: number | null;
  current_stage: RecruitmentStage;
  rejection_reason: string | null;
  notes: string | null;
  submitted_at: string;
  updated_at: string;
  // Approval workflow
  approval_status: ApprovalStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  // Joined data
  job?: {
    id: string;
    title: string;
    client_company: string;
    country: string;
    status: string;
  };
  agency?: {
    id: string;
    company_name: string;
    country: string;
  };
  documents?: AgencyWorkerDocument[];
}

export interface AgencyWorkerDocument {
  id: string;
  worker_id: string;
  doc_type: AgencyDocType;
  file_name: string;
  storage_path: string;
  file_size: number | null;
  uploaded_at: string;
}

export interface CreateAgencyProfileInput {
  company_name: string;
  country: string;
  contact_person: string;
  email: string;
  phone?: string;
  address?: string;
  recruitment_license?: string;
  certifications?: string;
  years_in_business?: number;
  worker_capacity?: number;
  specializations?: string;
  countries_recruiting_from?: string;
  industries_focus?: string;
  has_testing_facilities?: boolean;
  testing_facilities_locations?: string;
  office_locations?: string;
}

export interface UpdateAgencyProfileInput extends Partial<CreateAgencyProfileInput> {}

export interface CreateAgencyWorkerInput {
  job_id: string;
  full_name: string;
  email: string;
  phone?: string;
  nationality: string;
  current_country?: string;
  date_of_birth?: string;
  skills?: string;
  experience_years?: number;
}

export interface UpdateAgencyWorkerInput extends Partial<Omit<CreateAgencyWorkerInput, 'job_id'>> {
  current_stage?: RecruitmentStage;
  rejection_reason?: string;
  notes?: string;
  approval_status?: ApprovalStatus;
  review_notes?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  created_at: string;
}
