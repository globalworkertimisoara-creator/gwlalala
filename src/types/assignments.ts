// Assignment and activity tracking types for GlobalWorker Recruitment Tracker

import { AppRole } from './database';

export type EscalationStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';

export type EscalationPriority = 'low' | 'medium' | 'high' | 'critical';

export type ActivityAction =
  | 'created' | 'updated' | 'deleted' | 'viewed'
  | 'assigned' | 'unassigned' | 'status_changed'
  | 'escalated' | 'escalation_resolved' | 'escalation_acknowledged'
  | 'candidate_added' | 'candidate_removed' | 'stage_changed'
  | 'document_uploaded' | 'document_deleted' | 'note_added'
  | 'job_linked' | 'job_unlinked';

export interface ProjectAssignment {
  id: string;
  project_id: string;
  assigned_user_id: string | null;
  assigned_role: AppRole | null;
  assigned_by: string | null;
  created_at: string;
  // Joined data
  profile?: {
    id: string;
    full_name: string | null;
  };
}

export interface JobAssignment {
  id: string;
  job_id: string;
  assigned_user_id: string | null;
  assigned_role: AppRole | null;
  assigned_by: string | null;
  created_at: string;
  // Joined data
  profile?: {
    id: string;
    full_name: string | null;
  };
}

export interface ActivityLog {
  id: string;
  entity_type: string;
  entity_id: string;
  project_id: string | null;
  job_id: string | null;
  action: ActivityAction;
  actor_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  // Joined data
  profile?: {
    id: string;
    full_name: string | null;
  };
}

export interface Escalation {
  id: string;
  project_id: string | null;
  job_id: string | null;
  candidate_id: string | null;
  title: string;
  description: string;
  status: EscalationStatus;
  priority: EscalationPriority;
  escalated_by: string | null;
  escalated_to_role: AppRole | null;
  escalated_to_user_id: string | null;
  is_auto_escalated: boolean;
  auto_escalation_reason: string | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  escalated_by_profile?: {
    id: string;
    full_name: string | null;
  };
  escalated_to_profile?: {
    id: string;
    full_name: string | null;
  };
  project?: {
    id: string;
    name: string;
  };
  job?: {
    id: string;
    title: string;
  };
}

export interface AutoEscalationRule {
  id: string;
  name: string;
  description: string | null;
  entity_type: 'project' | 'job' | 'candidate';
  condition_field: string;
  condition_value: string | null;
  days_threshold: number;
  escalate_to_role: AppRole;
  priority: EscalationPriority;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Input types
export interface CreateEscalationInput {
  project_id?: string;
  job_id?: string;
  candidate_id?: string;
  title: string;
  description: string;
  priority?: EscalationPriority;
  escalated_to_role?: AppRole;
  escalated_to_user_id?: string;
}

export interface UpdateEscalationInput {
  status?: EscalationStatus;
  resolution_notes?: string;
}

export interface CreateAssignmentInput {
  assigned_user_id?: string;
  assigned_role?: AppRole;
}

// Activity action labels for display
export const ACTIVITY_ACTION_LABELS: Record<ActivityAction, string> = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  viewed: 'Viewed',
  assigned: 'Assigned',
  unassigned: 'Unassigned',
  status_changed: 'Status Changed',
  escalated: 'Escalated',
  escalation_resolved: 'Escalation Resolved',
  escalation_acknowledged: 'Escalation Acknowledged',
  candidate_added: 'Candidate Added',
  candidate_removed: 'Candidate Removed',
  stage_changed: 'Stage Changed',
  document_uploaded: 'Document Uploaded',
  document_deleted: 'Document Deleted',
  note_added: 'Note Added',
  job_linked: 'Job Linked',
  job_unlinked: 'Job Unlinked',
};

// Escalation status labels and colors
export const ESCALATION_STATUS_CONFIG: Record<EscalationStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-red-100 text-red-800' },
  acknowledged: { label: 'Acknowledged', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-800' },
};

// Escalation priority labels and colors
export const ESCALATION_PRIORITY_CONFIG: Record<EscalationPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
};
