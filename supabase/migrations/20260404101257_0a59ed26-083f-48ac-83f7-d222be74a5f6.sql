
-- ============================================================
-- 15a: CRM Enhancement — Schema Changes
-- ============================================================

-- ─── 1. Extend clients table with CRM fields ─────────────────

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'net_30',
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS vat_number TEXT,
  ADD COLUMN IF NOT EXISTS vat_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_communication TEXT DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS risk_notes TEXT,
  ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sla_terms TEXT,
  ADD COLUMN IF NOT EXISTS payment_score INTEGER DEFAULT 5;

-- Validation trigger for risk_score and payment_score
CREATE OR REPLACE FUNCTION public.validate_client_scores()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.risk_score IS NOT NULL AND (NEW.risk_score < 1 OR NEW.risk_score > 10) THEN
    RAISE EXCEPTION 'risk_score must be between 1 and 10';
  END IF;
  IF NEW.payment_score IS NOT NULL AND (NEW.payment_score < 1 OR NEW.payment_score > 10) THEN
    RAISE EXCEPTION 'payment_score must be between 1 and 10';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_client_scores_trigger
  BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.validate_client_scores();

CREATE INDEX IF NOT EXISTS idx_clients_priority ON public.clients(priority_level);
CREATE INDEX IF NOT EXISTS idx_clients_risk ON public.clients(risk_score);

-- ─── 2. client_contacts — multiple contacts per client ────────

CREATE TABLE IF NOT EXISTS public.client_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  department TEXT,
  is_primary BOOLEAN DEFAULT false,
  contact_type TEXT DEFAULT 'general',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON public.client_contacts(client_id);

ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal staff can view client contacts"
  ON public.client_contacts FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Internal staff can insert client contacts"
  ON public.client_contacts FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Internal staff can update client contacts"
  ON public.client_contacts FOR UPDATE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()))
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Internal staff can delete client contacts"
  ON public.client_contacts FOR DELETE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- ─── 3. client_relationships — parent/subsidiary/referral ─────

CREATE TABLE IF NOT EXISTS public.client_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  related_client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_relationship CHECK (client_id != related_client_id),
  CONSTRAINT unique_relationship UNIQUE (client_id, related_client_id, relationship_type)
);

-- Validation trigger for relationship_type
CREATE OR REPLACE FUNCTION public.validate_relationship_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.relationship_type NOT IN ('parent', 'subsidiary', 'referral', 'partner', 'related') THEN
    RAISE EXCEPTION 'Invalid relationship_type: %', NEW.relationship_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_relationship_type_trigger
  BEFORE INSERT OR UPDATE ON public.client_relationships
  FOR EACH ROW EXECUTE FUNCTION public.validate_relationship_type();

CREATE INDEX IF NOT EXISTS idx_client_relationships_client ON public.client_relationships(client_id);
CREATE INDEX IF NOT EXISTS idx_client_relationships_related ON public.client_relationships(related_client_id);

ALTER TABLE public.client_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal staff can view client relationships"
  ON public.client_relationships FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Internal staff can insert client relationships"
  ON public.client_relationships FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Internal staff can update client relationships"
  ON public.client_relationships FOR UPDATE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()))
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Internal staff can delete client relationships"
  ON public.client_relationships FOR DELETE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- ─── 4. client_meetings — scheduled meetings ─────────────────

CREATE TABLE IF NOT EXISTS public.client_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  meeting_type TEXT DEFAULT 'in_person',
  status TEXT DEFAULT 'scheduled',
  attendees JSONB DEFAULT '[]',
  agenda TEXT,
  outcome TEXT,
  follow_up_notes TEXT,
  follow_up_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Validation trigger for meeting_type and status
CREATE OR REPLACE FUNCTION public.validate_meeting_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.meeting_type NOT IN ('in_person', 'video', 'phone', 'other') THEN
    RAISE EXCEPTION 'Invalid meeting_type: %', NEW.meeting_type;
  END IF;
  IF NEW.status NOT IN ('scheduled', 'completed', 'cancelled', 'no_show') THEN
    RAISE EXCEPTION 'Invalid meeting status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_meeting_fields_trigger
  BEFORE INSERT OR UPDATE ON public.client_meetings
  FOR EACH ROW EXECUTE FUNCTION public.validate_meeting_fields();

CREATE INDEX IF NOT EXISTS idx_client_meetings_client ON public.client_meetings(client_id);
CREATE INDEX IF NOT EXISTS idx_client_meetings_date ON public.client_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_client_meetings_status ON public.client_meetings(status);

ALTER TABLE public.client_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal staff can view client meetings"
  ON public.client_meetings FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Internal staff can insert client meetings"
  ON public.client_meetings FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Internal staff can update client meetings"
  ON public.client_meetings FOR UPDATE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()))
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Internal staff can delete client meetings"
  ON public.client_meetings FOR DELETE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- ─── 5. client_custom_fields — flexible key-value data ────────

CREATE TABLE IF NOT EXISTS public.client_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_value TEXT,
  field_type TEXT DEFAULT 'text',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_client_field UNIQUE (client_id, field_name)
);

-- Validation trigger for field_type
CREATE OR REPLACE FUNCTION public.validate_custom_field_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.field_type NOT IN ('text', 'number', 'date', 'boolean', 'url') THEN
    RAISE EXCEPTION 'Invalid field_type: %', NEW.field_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_custom_field_type_trigger
  BEFORE INSERT OR UPDATE ON public.client_custom_fields
  FOR EACH ROW EXECUTE FUNCTION public.validate_custom_field_type();

CREATE INDEX IF NOT EXISTS idx_client_custom_fields_client ON public.client_custom_fields(client_id);

ALTER TABLE public.client_custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal staff can view client custom fields"
  ON public.client_custom_fields FOR SELECT
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Internal staff can insert client custom fields"
  ON public.client_custom_fields FOR INSERT
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Internal staff can update client custom fields"
  ON public.client_custom_fields FOR UPDATE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()))
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

CREATE POLICY "Internal staff can delete client custom fields"
  ON public.client_custom_fields FOR DELETE
  USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- ─── 6. Extend client_documents with folders and versioning ───

ALTER TABLE public.client_documents
  ADD COLUMN IF NOT EXISTS folder TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_document_id UUID REFERENCES public.client_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_client_documents_folder ON public.client_documents(folder);

-- ─── 7. Updated timestamp triggers ───────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_client_contacts') THEN
    CREATE TRIGGER set_updated_at_client_contacts
      BEFORE UPDATE ON public.client_contacts
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_client_meetings') THEN
    CREATE TRIGGER set_updated_at_client_meetings
      BEFORE UPDATE ON public.client_meetings
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_client_custom_fields') THEN
    CREATE TRIGGER set_updated_at_client_custom_fields
      BEFORE UPDATE ON public.client_custom_fields
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;
