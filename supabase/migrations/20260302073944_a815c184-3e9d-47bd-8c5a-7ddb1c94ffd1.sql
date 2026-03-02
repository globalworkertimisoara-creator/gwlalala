
-- ============================================================
-- Step 1: Contract Documents table
-- ============================================================
CREATE TABLE public.contract_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'other',
  storage_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contract_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage contract documents"
ON public.contract_documents
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role NOT IN ('agency', 'employer')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role NOT IN ('agency', 'employer')
  )
);

CREATE POLICY "Parties can view their contract documents"
ON public.contract_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = contract_id
    AND (
      (c.party_type = 'agency' AND c.party_id = public.get_agency_profile_id(auth.uid()))
      OR
      (c.party_type = 'employer' AND c.party_id = public.get_employer_company_id(auth.uid()))
    )
  )
);

-- ============================================================
-- Step 2: Contract documents storage bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('contract-documents', 'contract-documents', false);

CREATE POLICY "Staff can manage contract files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'contract-documents'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role NOT IN ('agency', 'employer')
  )
)
WITH CHECK (
  bucket_id = 'contract-documents'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role NOT IN ('agency', 'employer')
  )
);

CREATE POLICY "Parties can read contract files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contract-documents'
  AND (
    public.is_agency(auth.uid())
    OR public.is_employer(auth.uid())
  )
);

-- ============================================================
-- Step 3: Add sales_person_id to contracts
-- ============================================================
ALTER TABLE public.contracts ADD COLUMN sales_person_id UUID;

-- ============================================================
-- Step 4: Sales commissions table
-- ============================================================
CREATE TABLE public.sales_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  sales_person_id UUID NOT NULL,
  commission_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  original_amount NUMERIC,
  adjustment_reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_commissions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_sales_commissions_updated_at
  BEFORE UPDATE ON public.sales_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Validate commission amount
CREATE OR REPLACE FUNCTION public.validate_commission_amount()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.commission_amount < 0 THEN
    RAISE EXCEPTION 'Commission amount cannot be negative';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_commission_amount_trigger
  BEFORE INSERT OR UPDATE ON public.sales_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_commission_amount();

-- ============================================================
-- Step 5: Security definer helpers
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_view_sales_commissions(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'sales_manager')
  )
$$;

-- ============================================================
-- Step 6: RLS for sales_commissions
-- ============================================================
CREATE POLICY "Admins can manage all commissions"
ON public.sales_commissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sales managers can view all commissions"
ON public.sales_commissions
FOR SELECT
TO authenticated
USING (public.can_view_sales_commissions(auth.uid()));

CREATE POLICY "Salesperson can view own commissions"
ON public.sales_commissions
FOR SELECT
TO authenticated
USING (sales_person_id = auth.uid());

-- ============================================================
-- Step 7: Summary view
-- ============================================================
CREATE OR REPLACE VIEW public.v_sales_commission_summary
WITH (security_invoker = true)
AS
SELECT
  sc.id,
  sc.contract_id,
  sc.project_id,
  sc.sales_person_id,
  sc.commission_amount,
  sc.original_amount,
  sc.currency,
  sc.status AS commission_status,
  sc.adjustment_reason,
  sc.created_at,
  sc.updated_at,
  c.title AS contract_title,
  c.contract_type,
  c.status AS contract_status,
  c.total_value AS contract_value,
  c.party_type,
  c.party_id,
  p.name AS project_name,
  p.status AS project_status,
  p.employer_name,
  pr.full_name AS sales_person_name
FROM public.sales_commissions sc
LEFT JOIN public.contracts c ON c.id = sc.contract_id
LEFT JOIN public.projects p ON p.id = sc.project_id
LEFT JOIN public.profiles pr ON pr.user_id = sc.sales_person_id;

-- Validate commission status
CREATE OR REPLACE FUNCTION public.validate_commission_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'earned', 'partial', 'frozen', 'forfeited') THEN
    RAISE EXCEPTION 'Invalid commission status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_commission_status_trigger
  BEFORE INSERT OR UPDATE ON public.sales_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_commission_status();
