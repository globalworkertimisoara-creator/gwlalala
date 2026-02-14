
-- Billing records: links a payment amount to a candidate (via agency worker)
CREATE TABLE public.billing_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  agency_id uuid REFERENCES public.agency_profiles(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'agreed', 'in_progress', 'completed', 'disputed')),
  agreed_at timestamp with time zone,
  agreed_by_admin uuid,
  agreed_by_agency uuid,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Payments: tracks individual payments as % of the total
CREATE TABLE public.billing_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_record_id uuid REFERENCES public.billing_records(id) ON DELETE CASCADE NOT NULL,
  amount numeric(12,2) NOT NULL,
  percentage numeric(5,2) NOT NULL,
  payment_date date,
  payment_method text,
  reference_number text,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Billing change log: immutable audit trail
CREATE TABLE public.billing_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_record_id uuid REFERENCES public.billing_records(id) ON DELETE CASCADE NOT NULL,
  billing_payment_id uuid REFERENCES public.billing_payments(id) ON DELETE SET NULL,
  action text NOT NULL,
  field_changed text,
  old_value text,
  new_value text,
  changed_by uuid NOT NULL,
  changed_by_name text,
  changed_by_role text,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Billing notes: both parties can leave notes
CREATE TABLE public.billing_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_record_id uuid REFERENCES public.billing_records(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_by uuid NOT NULL,
  created_by_name text,
  created_by_role text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_notes ENABLE ROW LEVEL SECURITY;

-- Helper function: can user access billing for a given agency?
CREATE OR REPLACE FUNCTION public.can_access_billing(_user_id uuid, _agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Admin can access all billing
    public.has_role(_user_id, 'admin')
    OR
    -- Agency owner can access their own billing
    (
      public.is_agency(_user_id)
      AND public.get_agency_profile_id(_user_id) = _agency_id
      AND public.is_agency_owner(_user_id)
    )
$$;

-- RLS: billing_records
CREATE POLICY "Admin can manage billing records" ON public.billing_records
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agency owners can view their billing records" ON public.billing_records
  FOR SELECT USING (public.can_access_billing(auth.uid(), agency_id));

-- RLS: billing_payments
CREATE POLICY "Admin can manage billing payments" ON public.billing_payments
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agency owners can view their billing payments" ON public.billing_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.billing_records br
      WHERE br.id = billing_payments.billing_record_id
      AND public.can_access_billing(auth.uid(), br.agency_id)
    )
  );

-- RLS: billing_change_log
CREATE POLICY "Billing parties can view change log" ON public.billing_change_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.billing_records br
      WHERE br.id = billing_change_log.billing_record_id
      AND public.can_access_billing(auth.uid(), br.agency_id)
    )
  );

CREATE POLICY "Billing parties can insert change log" ON public.billing_change_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.billing_records br
      WHERE br.id = billing_change_log.billing_record_id
      AND public.can_access_billing(auth.uid(), br.agency_id)
    )
  );

-- RLS: billing_notes
CREATE POLICY "Billing parties can view notes" ON public.billing_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.billing_records br
      WHERE br.id = billing_notes.billing_record_id
      AND public.can_access_billing(auth.uid(), br.agency_id)
    )
  );

CREATE POLICY "Billing parties can insert notes" ON public.billing_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.billing_records br
      WHERE br.id = billing_notes.billing_record_id
      AND public.can_access_billing(auth.uid(), br.agency_id)
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_billing_records_updated_at
  BEFORE UPDATE ON public.billing_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_billing_payments_updated_at
  BEFORE UPDATE ON public.billing_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
