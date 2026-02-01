-- Add new passport and personal fields to candidates table
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS passport_number text,
ADD COLUMN IF NOT EXISTS passport_expiry date,
ADD COLUMN IF NOT EXISTS passport_issue_date date,
ADD COLUMN IF NOT EXISTS passport_issued_by text,
ADD COLUMN IF NOT EXISTS parents_names text;

-- Add residence_permit to doc_type enum
ALTER TYPE public.doc_type ADD VALUE IF NOT EXISTS 'residence_permit';