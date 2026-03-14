
-- Contract templates table
CREATE TABLE public.contract_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'recruitment',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contract template versions (version history)
CREATE TABLE public.contract_template_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.contract_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, version_number)
);

-- Enable RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_template_versions ENABLE ROW LEVEL SECURITY;

-- RLS: All authenticated internal staff can view templates
CREATE POLICY "Authenticated users can view templates"
ON public.contract_templates FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view template versions"
ON public.contract_template_versions FOR SELECT TO authenticated
USING (true);

-- RLS: Admin, ops manager, sales manager can manage templates
CREATE POLICY "Admin/ops/sales can insert templates"
ON public.contract_templates FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'operations_manager', 'sales_manager')
  )
);

CREATE POLICY "Admin/ops/sales can update templates"
ON public.contract_templates FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'operations_manager', 'sales_manager')
  )
);

CREATE POLICY "Admin/ops can delete templates"
ON public.contract_templates FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'operations_manager')
  )
);

CREATE POLICY "Admin/ops/sales can insert versions"
ON public.contract_template_versions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'operations_manager', 'sales_manager')
  )
);

CREATE POLICY "Admin/ops can delete versions"
ON public.contract_template_versions FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'operations_manager')
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_contract_templates_updated_at
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
