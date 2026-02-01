-- Add new roles to the app_role enum
-- These must be committed before use in subsequent migrations
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'documentation_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'project_manager';

-- Create escalation status enum
CREATE TYPE public.escalation_status AS ENUM ('open', 'acknowledged', 'in_progress', 'resolved', 'closed');

-- Create activity action type enum
CREATE TYPE public.activity_action AS ENUM (
  'created', 'updated', 'deleted', 'viewed',
  'assigned', 'unassigned', 'status_changed',
  'escalated', 'escalation_resolved', 'escalation_acknowledged',
  'candidate_added', 'candidate_removed', 'stage_changed',
  'document_uploaded', 'document_deleted', 'note_added',
  'job_linked', 'job_unlinked'
);