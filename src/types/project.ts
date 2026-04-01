// Project types for GlobalWorker Recruitment Tracker

export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type WorkflowType = 'full_immigration' | 'no_visa';

export const WORKFLOW_TYPE_CONFIG: Record<WorkflowType, { label: string; description: string }> = {
  full_immigration: { label: 'Full Immigration', description: '5 phases including visa processing' },
  no_visa: { label: 'No Visa Required', description: '4 phases without visa processing' },
};

export interface Project {
  id: string;
  name: string;
  employer_name: string;
  location: string;
  countries_in_contract: string[];
  sales_person_id: string | null;
  sales_person_name: string | null;
  status: ProjectStatus;
  default_workflow_type: WorkflowType;
  company_id: string | null;
  contract_signed_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithMetrics extends Project {
  total_positions: number;
  filled_positions: number;
  fill_percentage: number;
  jobs: ProjectJob[];
  days_since_contract: number | null;
}

export interface ProjectJob {
  id: string;
  title: string;
  status: string;
  total_candidates: number;
  placed_candidates: number;
}

export interface AgencyJobInvitation {
  id: string;
  agency_id: string;
  job_id: string;
  invited_by: string | null;
  invited_at: string;
}

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  on_hold: { label: 'On Hold', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
};

export const getProjectStatusLabel = (status: ProjectStatus): string => {
  return PROJECT_STATUS_CONFIG[status]?.label || status;
};

export const getProjectStatusColor = (status: ProjectStatus): string => {
  return PROJECT_STATUS_CONFIG[status]?.color || 'bg-gray-100 text-gray-700';
};
