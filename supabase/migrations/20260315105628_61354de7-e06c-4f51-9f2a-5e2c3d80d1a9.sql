
-- Step 1: Add new columns to contracts table
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS contract_prefix TEXT,
ADD COLUMN IF NOT EXISTS sequence_number INTEGER,
ADD COLUMN IF NOT EXISTS contract_date DATE,
ADD COLUMN IF NOT EXISTS contract_number TEXT,
ADD COLUMN IF NOT EXISTS number_modified_by UUID,
ADD COLUMN IF NOT EXISTS number_modified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS number_modification_reason TEXT;

-- Trigger to auto-compute contract_number
CREATE OR REPLACE FUNCTION public.compute_contract_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.contract_prefix IS NOT NULL AND NEW.sequence_number IS NOT NULL AND NEW.contract_date IS NOT NULL THEN
    NEW.contract_number := NEW.contract_prefix || '-' || NEW.sequence_number || '/' || TO_CHAR(NEW.contract_date, 'DD.MM.YYYY');
  ELSE
    NEW.contract_number := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS compute_contract_number_trigger ON public.contracts;
CREATE TRIGGER compute_contract_number_trigger
  BEFORE INSERT OR UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_contract_number();

-- Step 2: Create contract_sequences table
CREATE TABLE IF NOT EXISTS public.contract_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_prefix TEXT NOT NULL,
  year INTEGER NOT NULL,
  last_sequence_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(contract_prefix, year)
);

INSERT INTO public.contract_sequences (contract_prefix, year, last_sequence_number)
VALUES 
  ('REC', EXTRACT(YEAR FROM NOW())::INTEGER, 0),
  ('PAR', EXTRACT(YEAR FROM NOW())::INTEGER, 0),
  ('CON', EXTRACT(YEAR FROM NOW())::INTEGER, 0),
  ('SRV', EXTRACT(YEAR FROM NOW())::INTEGER, 0)
ON CONFLICT (contract_prefix, year) DO NOTHING;

ALTER TABLE public.contract_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view contract sequences"
  ON public.contract_sequences FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Admins can manage contract sequences"
  ON public.contract_sequences FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Step 3: Create audit log table
CREATE TABLE IF NOT EXISTS public.contract_number_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_contract_number TEXT,
  new_contract_number TEXT,
  old_sequence_number INTEGER,
  new_sequence_number INTEGER,
  old_contract_date DATE,
  new_contract_date DATE,
  reason TEXT,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contract_number_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view contract number audit log"
  ON public.contract_number_audit_log FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "System can insert audit log"
  ON public.contract_number_audit_log FOR INSERT
  WITH CHECK (true);

-- Step 4: Function to get next contract number
CREATE OR REPLACE FUNCTION public.get_next_contract_number(
  p_contract_prefix TEXT,
  p_contract_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  prefix TEXT,
  sequence_number INTEGER,
  contract_date DATE,
  contract_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INTEGER;
  v_next_sequence INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM p_contract_date)::INTEGER;
  
  INSERT INTO contract_sequences (contract_prefix, year, last_sequence_number)
  VALUES (p_contract_prefix, v_year, 1)
  ON CONFLICT (contract_prefix, year) 
  DO UPDATE SET 
    last_sequence_number = contract_sequences.last_sequence_number + 1,
    updated_at = NOW()
  RETURNING last_sequence_number INTO v_next_sequence;
  
  RETURN QUERY
  SELECT 
    p_contract_prefix,
    v_next_sequence,
    p_contract_date,
    p_contract_prefix || '-' || v_next_sequence || '/' || TO_CHAR(p_contract_date, 'DD.MM.YYYY');
END;
$$;

-- Step 5: Validate contract number uniqueness
CREATE OR REPLACE FUNCTION public.validate_contract_number_unique()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.contracts
    WHERE contract_prefix = NEW.contract_prefix
      AND sequence_number = NEW.sequence_number
      AND EXTRACT(YEAR FROM contract_date) = EXTRACT(YEAR FROM NEW.contract_date)
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
  ) THEN
    RAISE EXCEPTION 'Contract number %-% already exists for year %', 
      NEW.contract_prefix, NEW.sequence_number, EXTRACT(YEAR FROM NEW.contract_date);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_contract_number_unique_trigger ON public.contracts;
CREATE TRIGGER validate_contract_number_unique_trigger
  BEFORE INSERT OR UPDATE ON public.contracts
  FOR EACH ROW
  WHEN (NEW.contract_prefix IS NOT NULL AND NEW.sequence_number IS NOT NULL AND NEW.contract_date IS NOT NULL)
  EXECUTE FUNCTION public.validate_contract_number_unique();

-- Step 6: Log number changes
CREATE OR REPLACE FUNCTION public.log_contract_number_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.contract_prefix IS NOT NULL THEN
    INSERT INTO contract_number_audit_log (
      contract_id, action, new_contract_number, new_sequence_number, new_contract_date, changed_by
    ) VALUES (
      NEW.id, 'number_created', NEW.contract_number, NEW.sequence_number, NEW.contract_date,
      COALESCE(NEW.number_modified_by, auth.uid())
    );
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.sequence_number IS DISTINCT FROM NEW.sequence_number THEN
      INSERT INTO contract_number_audit_log (
        contract_id, action, old_contract_number, new_contract_number,
        old_sequence_number, new_sequence_number, old_contract_date, new_contract_date,
        reason, changed_by
      ) VALUES (
        NEW.id, 'number_changed', OLD.contract_number, NEW.contract_number,
        OLD.sequence_number, NEW.sequence_number, OLD.contract_date, NEW.contract_date,
        NEW.number_modification_reason, COALESCE(NEW.number_modified_by, auth.uid())
      );
    ELSIF OLD.contract_date IS DISTINCT FROM NEW.contract_date THEN
      INSERT INTO contract_number_audit_log (
        contract_id, action, old_contract_number, new_contract_number,
        old_contract_date, new_contract_date, reason, changed_by
      ) VALUES (
        NEW.id, 'date_changed', OLD.contract_number, NEW.contract_number,
        OLD.contract_date, NEW.contract_date,
        NEW.number_modification_reason, COALESCE(NEW.number_modified_by, auth.uid())
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_contract_number_change_trigger ON public.contracts;
CREATE TRIGGER log_contract_number_change_trigger
  AFTER INSERT OR UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_contract_number_change();

-- Step 7: Helper function
CREATE OR REPLACE FUNCTION public.get_contract_prefix(p_contract_type TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_contract_type
    WHEN 'recruitment' THEN 'REC'
    WHEN 'partnership' THEN 'PAR'
    WHEN 'consultancy' THEN 'CON'
    WHEN 'service' THEN 'SRV'
    WHEN 'employer_agreement' THEN 'REC'
    WHEN 'agency_agreement' THEN 'PAR'
    WHEN 'worker_contract' THEN 'REC'
    WHEN 'service_agreement' THEN 'SRV'
    ELSE 'CON'
  END;
$$;

-- Step 8: Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON public.contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_prefix_sequence ON public.contracts(contract_prefix, sequence_number);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_date ON public.contracts(contract_date);
CREATE INDEX IF NOT EXISTS idx_contract_sequences_prefix_year ON public.contract_sequences(contract_prefix, year);
CREATE INDEX IF NOT EXISTS idx_contract_audit_log_contract ON public.contract_number_audit_log(contract_id);

-- Step 9: View
CREATE OR REPLACE VIEW public.v_contracts_with_details
WITH (security_invoker = true)
AS
SELECT 
  c.id, c.contract_number, c.contract_prefix, c.sequence_number, c.contract_date,
  c.contract_type, c.party_type, c.party_id, c.title, c.status,
  c.start_date, c.end_date, c.renewal_date, c.auto_renew,
  c.total_value, c.currency, c.storage_path,
  c.signed_by_party_at, c.signed_by_staff_at,
  c.sales_person_id, c.project_id, c.job_id,
  c.notes, c.created_by, c.created_at, c.updated_at,
  c.number_modified_by, c.number_modified_at, c.number_modification_reason,
  sp.full_name as sales_person_name,
  CASE 
    WHEN c.party_type = 'employer' THEN comp.company_name
    WHEN c.party_type = 'agency' THEN ag.company_name
    WHEN c.party_type = 'worker' THEN cand.full_name
    ELSE NULL
  END as client_name,
  proj.name as project_name,
  cand.full_name as candidate_name
FROM public.contracts c
LEFT JOIN public.profiles sp ON sp.user_id = c.sales_person_id
LEFT JOIN public.companies comp ON comp.id = c.party_id AND c.party_type = 'employer'
LEFT JOIN public.agency_profiles ag ON ag.id = c.party_id AND c.party_type = 'agency'
LEFT JOIN public.candidates cand ON cand.id = c.party_id AND c.party_type = 'worker'
LEFT JOIN public.projects proj ON proj.id = c.project_id;
