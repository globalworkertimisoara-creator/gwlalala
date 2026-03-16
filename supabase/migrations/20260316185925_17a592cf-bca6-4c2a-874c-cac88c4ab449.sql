INSERT INTO public.role_permissions (role, permissions) VALUES
('documentation_lead', '{}'),
('sales_manager', '{}'),
('project_manager', '{}'),
('employer_admin', '{}'),
('employer_hr', '{}'),
('employer_hiring_manager', '{}'),
('employer_viewer', '{}')
ON CONFLICT (role) DO NOTHING;