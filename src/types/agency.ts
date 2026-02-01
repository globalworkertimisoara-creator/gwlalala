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
  // Joined data
  job?: {
    id: string;
    title: string;
    client_company: string;
    country: string;
    status: string;
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
}
