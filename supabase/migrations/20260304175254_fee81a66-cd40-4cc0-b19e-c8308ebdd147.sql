
-- Contract activity log table
CREATE TABLE public.contract_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL,
  action text NOT NULL,
  field_changed text,
  old_value text,
  new_value text,
  summary text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.contract_activity_log ENABLE ROW LEVEL SECURITY;

-- Staff can insert
CREATE POLICY "Staff can insert contract activity"
  ON public.contract_activity_log FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()));

-- Staff can view all
CREATE POLICY "Staff can view all contract activity"
  ON public.contract_activity_log FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- Agencies can view own contracts activity
CREATE POLICY "Agencies can view own contract activity"
  ON public.contract_activity_log FOR SELECT
  USING (
    is_agency(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_activity_log.contract_id
        AND c.party_type = 'agency'
        AND c.party_id = get_agency_profile_id(auth.uid())
    )
  );

-- Employers can view own contracts activity
CREATE POLICY "Employers can view own contract activity"
  ON public.contract_activity_log FOR SELECT
  USING (
    is_employer(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_activity_log.contract_id
        AND c.party_type = 'employer'
        AND c.party_id = get_employer_company_id(auth.uid())
    )
  );

-- Index for fast lookups
CREATE INDEX idx_contract_activity_log_contract_id ON public.contract_activity_log(contract_id);
