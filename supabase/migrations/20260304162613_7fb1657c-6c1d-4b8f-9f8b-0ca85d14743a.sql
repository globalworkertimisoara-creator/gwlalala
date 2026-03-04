
-- Add pipeline recruitment stage to candidate_workflow
-- This allows each candidate to have an independent pipeline stage per project
ALTER TABLE public.candidate_workflow 
ADD COLUMN IF NOT EXISTS pipeline_stage public.recruitment_stage NOT NULL DEFAULT 'sourced';

-- Add updated tracking for pipeline stage changes
-- (updated_at already exists and is auto-updated via trigger)
