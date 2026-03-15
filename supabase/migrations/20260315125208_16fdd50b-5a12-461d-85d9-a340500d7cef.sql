ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_agent';

INSERT INTO public.role_permissions (role, permissions) VALUES
('sales_agent', '{}')
ON CONFLICT (role) DO NOTHING;