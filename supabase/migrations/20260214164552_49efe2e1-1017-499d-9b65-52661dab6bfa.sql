
-- Step 1: Add employer to app_role enum and create employer_team_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'employer';

CREATE TYPE public.employer_team_role AS ENUM (
  'employer_admin',
  'employer_hr',
  'employer_hiring_manager',
  'employer_viewer'
);
