-- Enums
CREATE TYPE public.client_type AS ENUM ('company', 'individual');
CREATE TYPE public.client_status AS ENUM ('lead', 'active', 'on_hold', 'inactive', 'churned');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled', 'void');

-- Main clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_type public.client_type NOT NULL,
  status public.client_status NOT NULL DEFAULT 'lead',
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  nationality TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  id_document_type TEXT,
  id_document_number TEXT,
  id_document_expiry DATE,
  billing_name TEXT,
  billing_address TEXT,
  billing_email TEXT,
  tax_id TEXT,
  source TEXT,
  assigned_to UUID,
  notes TEXT,
  tags TEXT[],
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_type ON public.clients(client_type);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_company_id ON public.clients(company_id);
CREATE INDEX idx_clients_assigned_to ON public.clients(assigned_to);
CREATE INDEX idx_clients_created_at ON public.clients(created_at DESC);

CREATE OR REPLACE FUNCTION public.validate_client_fields()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.client_type = 'company' AND NEW.company_id IS NULL THEN
    RAISE EXCEPTION 'Company clients must have a company_id';
  END IF;
  IF NEW.client_type = 'individual' AND (NEW.first_name IS NULL OR NEW.last_name IS NULL OR NEW.email IS NULL) THEN
    RAISE EXCEPTION 'Individual clients must have first_name, last_name, and email';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_client_fields
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.validate_client_fields();

CREATE TRIGGER set_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'client',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, project_id)
);
CREATE INDEX idx_client_projects_client ON public.client_projects(client_id);
CREATE INDEX idx_client_projects_project ON public.client_projects(project_id);

CREATE TABLE public.client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_notes_client ON public.client_notes(client_id);

CREATE TABLE public.client_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  performed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_activity_client ON public.client_activity_log(client_id);

CREATE TABLE public.client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_documents_client ON public.client_documents(client_id);

CREATE TABLE public.client_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_number TEXT,
  contract_id UUID REFERENCES public.contracts(id),
  project_id UUID REFERENCES public.projects(id),
  description TEXT,
  line_items JSONB,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status public.invoice_status NOT NULL DEFAULT 'draft',
  issue_date DATE,
  due_date DATE,
  paid_date DATE,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_invoices_client ON public.client_invoices(client_id);
CREATE INDEX idx_client_invoices_status ON public.client_invoices(status);

CREATE TRIGGER set_client_invoices_updated_at
  BEFORE UPDATE ON public.client_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internal staff can view clients" ON public.clients FOR SELECT TO authenticated
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));
CREATE POLICY "Internal staff can insert clients" ON public.clients FOR INSERT TO authenticated
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));
CREATE POLICY "Internal staff can update clients" ON public.clients FOR UPDATE TO authenticated
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internal staff can view client_projects" ON public.client_projects FOR SELECT TO authenticated
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));
CREATE POLICY "Internal staff can insert client_projects" ON public.client_projects FOR INSERT TO authenticated
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));
CREATE POLICY "Internal staff can delete client_projects" ON public.client_projects FOR DELETE TO authenticated
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internal staff can view client_notes" ON public.client_notes FOR SELECT TO authenticated
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));
CREATE POLICY "Internal staff can insert client_notes" ON public.client_notes FOR INSERT TO authenticated
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));
CREATE POLICY "Creator can delete client_notes" ON public.client_notes FOR DELETE TO authenticated
  USING (created_by = auth.uid());

ALTER TABLE public.client_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internal staff can view client_activity_log" ON public.client_activity_log FOR SELECT TO authenticated
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));
CREATE POLICY "Internal staff can insert client_activity_log" ON public.client_activity_log FOR INSERT TO authenticated
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internal staff can view client_documents" ON public.client_documents FOR SELECT TO authenticated
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));
CREATE POLICY "Internal staff can insert client_documents" ON public.client_documents FOR INSERT TO authenticated
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));
CREATE POLICY "Uploader can delete client_documents" ON public.client_documents FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid());

ALTER TABLE public.client_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Internal staff can view client_invoices" ON public.client_invoices FOR SELECT TO authenticated
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));
CREATE POLICY "Internal staff can insert client_invoices" ON public.client_invoices FOR INSERT TO authenticated
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));
CREATE POLICY "Internal staff can update client_invoices" ON public.client_invoices FOR UPDATE TO authenticated
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));
CREATE POLICY "Admins can delete client_invoices" ON public.client_invoices FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Analytics view
CREATE OR REPLACE VIEW public.v_client_analytics AS
SELECT
  c.id,
  c.client_type,
  c.status,
  CASE
    WHEN c.client_type = 'company' THEN co.company_name
    ELSE COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '')
  END AS display_name,
  c.created_at,
  c.assigned_to,
  COUNT(DISTINCT cp.project_id) AS project_count,
  COUNT(DISTINCT ct.id) AS contract_count,
  COALESCE(SUM(ci.total_amount), 0) AS total_invoiced,
  COALESCE(SUM(ci.paid_amount), 0) AS total_paid,
  COALESCE(SUM(ci.total_amount) - SUM(ci.paid_amount), 0) AS outstanding_amount
FROM public.clients c
LEFT JOIN public.companies co ON c.company_id = co.id
LEFT JOIN public.client_projects cp ON c.id = cp.client_id
LEFT JOIN public.contracts ct ON ct.party_id = c.id
LEFT JOIN public.client_invoices ci ON c.id = ci.client_id
GROUP BY c.id, c.client_type, c.status, co.company_name, c.first_name, c.last_name, c.created_at, c.assigned_to;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('client-documents', 'client-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Staff can upload client docs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-documents' AND is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));
CREATE POLICY "Staff can view client docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'client-documents' AND is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));
CREATE POLICY "Staff can delete client docs" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'client-documents' AND is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- Data migration
INSERT INTO public.clients (client_type, status, company_id, created_by, created_at)
SELECT 'company'::public.client_type, 'active'::public.client_status, id, created_by, COALESCE(created_at, now())
FROM public.companies
WHERE id NOT IN (SELECT company_id FROM public.clients WHERE company_id IS NOT NULL)
ON CONFLICT DO NOTHING;

INSERT INTO public.client_projects (client_id, project_id, created_at)
SELECT c.id, cp.project_id, cp.created_at
FROM public.company_projects cp
JOIN public.clients c ON c.company_id = cp.company_id
ON CONFLICT DO NOTHING;