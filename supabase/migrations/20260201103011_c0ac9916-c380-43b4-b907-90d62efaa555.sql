-- First migration: Add 'agency' to the app_role enum
-- This must be committed before the value can be used
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agency';