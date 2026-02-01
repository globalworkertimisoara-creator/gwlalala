-- Add new roles to the app_role enum
-- Documentation Staff: focused on document processing and compliance
-- Operations Manager: supervises recruitment operations with broader access

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'documentation_staff';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_manager';