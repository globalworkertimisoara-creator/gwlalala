// Database types for GlobalWorker Recruitment Tracker

export type AppRole =
  | 'admin'
  | 'recruiter'
  | 'agency'
  | 'employer'
  | 'documentation_staff'
  | 'operations_manager'
  | 'documentation_lead'
  | 'sales_manager'
  | 'sales_agent'
  | 'project_manager';

// Role configuration with labels and descriptions
export const ROLES: { value: AppRole; label: string; description: string; isInternal: boolean }[] = [
  { value: 'admin', label: 'Admin', description: 'Full system access', isInternal: true },
  { value: 'project_manager', label: 'Project Manager', description: 'Manages projects and assignments', isInternal: true },
  { value: 'sales_manager', label: 'Sales Manager', description: 'Sales and client relations', isInternal: true },
  { value: 'sales_agent', label: 'Sales Agent', description: 'Sales operations under Sales Manager', isInternal: true },
  { value: 'operations_manager', label: 'Operations Manager', description: 'Supervises recruitment operations', isInternal: true },
  { value: 'documentation_lead', label: 'Documentation Lead', description: 'Leads documentation team', isInternal: true },
  { value: 'recruiter', label: 'Recruiter', description: 'Recruitment operations', isInternal: true },
  { value: 'documentation_staff', label: 'Documentation Staff', description: 'Document processing and compliance', isInternal: true },
  { value: 'agency', label: 'Agency', description: 'External supplier portal', isInternal: false },
  { value: 'employer', label: 'Employer', description: 'Client company portal', isInternal: false },
];

export const getRoleLabel = (role: AppRole): string => {
  return ROLES.find(r => r.value === role)?.label || role;
};

export const isInternalRole = (role: AppRole): boolean => {
  return ROLES.find(r => r.value === role)?.isInternal ?? false;
};

export type RecruitmentStage = 
  | 'sourced'
  | 'contacted'
  | 'application_received'
  | 'screening'
  | 'shortlisted'
  | 'submitted_to_client'
  | 'client_feedback'
  | 'interview_completed'
  | 'offer_extended'
  | 'offer_accepted'
  | 'visa_processing'
  | 'medical_checks'
  | 'onboarding'
  | 'placed'
  | 'closed_not_placed';

export type JobStatus = 'open' | 'closed' | 'filled';

export type DocType = 'resume' | 'passport' | 'visa' | 'contract' | 'residence_permit' | 'other';

export type SubmissionStatus = 'submitted' | 'interviewing' | 'offered' | 'placed' | 'rejected';

// Stage configuration with labels and colors
export const STAGES: { value: RecruitmentStage; label: string; color: string }[] = [
  { value: 'sourced', label: 'Sourced / Identified', color: 'bg-slate-100 text-slate-700' },
  { value: 'contacted', label: 'Contacted / Initial Outreach', color: 'bg-blue-50 text-blue-700' },
  { value: 'application_received', label: 'Application Received', color: 'bg-blue-100 text-blue-800' },
  { value: 'screening', label: 'Screening / Pre-qualification', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-teal-100 text-teal-800' },
  { value: 'submitted_to_client', label: 'Submitted to Client', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'client_feedback', label: 'Client Feedback / Interview Scheduled', color: 'bg-violet-100 text-violet-800' },
  { value: 'interview_completed', label: 'Interview Completed', color: 'bg-purple-100 text-purple-800' },
  { value: 'offer_extended', label: 'Offer Extended', color: 'bg-amber-100 text-amber-800' },
  { value: 'offer_accepted', label: 'Offer Accepted / Negotiation', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'visa_processing', label: 'Visa & Documentation Processing', color: 'bg-orange-100 text-orange-800' },
  { value: 'medical_checks', label: 'Medical / Background Checks', color: 'bg-rose-100 text-rose-800' },
  { value: 'onboarding', label: 'Onboarding / Pre-Departure', color: 'bg-lime-100 text-lime-800' },
  { value: 'placed', label: 'Placed / Started Assignment', color: 'bg-green-100 text-green-800' },
  { value: 'closed_not_placed', label: 'Closed - Not Placed', color: 'bg-red-100 text-red-800' },
];

export const getStageLabel = (stage: RecruitmentStage): string => {
  return STAGES.find(s => s.value === stage)?.label || stage;
};

export const getStageColor = (stage: RecruitmentStage): string => {
  return STAGES.find(s => s.value === stage)?.color || 'bg-gray-100 text-gray-700';
};

export const getStageIndex = (stage: RecruitmentStage): number => {
  return STAGES.findIndex(s => s.value === stage);
};

// Database models
export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Job {
  id: string;
  title: string;
  client_company: string;
  country: string;
  salary_range: string | null;
  required_skills: string | null;
  description: string | null;
  status: JobStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  nationality: string | null;
  current_country: string | null;
  linkedin: string | null;
  current_stage: RecruitmentStage;
  rejection_reason: string | null;
  expected_start_date: string | null;
  added_by: string | null;
  created_at: string;
  updated_at: string;
  // Passport fields
  passport_number: string | null;
  passport_expiry: string | null;
  passport_issue_date: string | null;
  passport_issued_by: string | null;
  parents_names: string | null;
}

export interface CandidateJobLink {
  id: string;
  candidate_id: string;
  job_id: string;
  submitted_date: string;
  current_status: SubmissionStatus;
  created_at: string;
  // Joined data
  job?: Job;
  candidate?: Candidate;
}

export interface Note {
  id: string;
  candidate_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
  // Joined data
  profile?: Profile;
}

export interface Document {
  id: string;
  candidate_id: string;
  file_name: string;
  storage_path: string;
  doc_type: DocType;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface StageHistory {
  id: string;
  candidate_id: string;
  from_stage: RecruitmentStage | null;
  to_stage: RecruitmentStage;
  changed_by: string | null;
  note: string | null;
  changed_at: string;
  // Joined data
  profile?: Profile;
}

// Input types for mutations
export interface CreateCandidateInput {
  full_name: string;
  email?: string;
  phone?: string;
  nationality?: string;
  current_country?: string;
  current_city?: string;
  linkedin?: string;
  current_stage?: RecruitmentStage;
  expected_start_date?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  whatsapp?: string;
  number_of_children?: number;
  // Passport fields
  passport_number?: string;
  passport_expiry?: string;
  passport_issue_date?: string;
  passport_issued_by?: string;
  national_id_number?: string;
  parents_names?: string;
  // JSON fields
  driver_license?: any;
  salary_expectations?: any;
  availability?: any;
  job_preferences?: any;
  family_info?: any;
}

export interface UpdateCandidateInput extends Partial<CreateCandidateInput> {
  rejection_reason?: string;
}

export interface CreateJobInput {
  title: string;
  client_company: string;
  country: string;
  salary_range?: string;
  required_skills?: string;
  description?: string;
  status?: JobStatus;
  project_id?: string;
}

export interface UpdateJobInput extends Partial<CreateJobInput> {}

export interface CreateNoteInput {
  candidate_id: string;
  content: string;
}

export interface CreateDocumentInput {
  candidate_id: string;
  file_name: string;
  storage_path: string;
  doc_type: DocType;
}

export interface LinkCandidateToJobInput {
  candidate_id: string;
  job_id: string;
}
