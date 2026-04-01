-- =============================================
-- 1. Remove tables from Realtime publication
-- =============================================
ALTER PUBLICATION supabase_realtime DROP TABLE public.candidates;
ALTER PUBLICATION supabase_realtime DROP TABLE public.stage_history;
ALTER PUBLICATION supabase_realtime DROP TABLE public.tasks;

-- =============================================
-- 2. Fix employer over-access on agency_workers
-- =============================================
DROP POLICY "Staff can view all agency workers" ON public.agency_workers;
CREATE POLICY "Staff can view all agency workers" ON public.agency_workers
  FOR SELECT USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

DROP POLICY "Admins and recruiters can update agency workers" ON public.agency_workers;
CREATE POLICY "Admins and recruiters can update agency workers" ON public.agency_workers
  FOR UPDATE USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()))
  WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- =============================================
-- 3. Fix employer over-access on documents
-- =============================================
DROP POLICY "Staff can view all documents" ON public.documents;
CREATE POLICY "Staff can view all documents" ON public.documents
  FOR SELECT USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

DROP POLICY "Staff can upload documents" ON public.documents;
CREATE POLICY "Staff can upload documents" ON public.documents
  FOR INSERT WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- =============================================
-- 4. Fix employer over-access on agency_profiles
-- =============================================
DROP POLICY "Staff can view all agency profiles" ON public.agency_profiles;
CREATE POLICY "Staff can view all agency profiles" ON public.agency_profiles
  FOR SELECT USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- =============================================
-- 5. Fix employer over-access on profiles
-- =============================================
DROP POLICY "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- =============================================
-- 6. Fix employer over-access on activity_log
-- =============================================
DROP POLICY "Staff can view activity log" ON public.activity_log;
CREATE POLICY "Staff can view activity log" ON public.activity_log
  FOR SELECT USING (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

DROP POLICY "Staff can create activity log entries" ON public.activity_log;
CREATE POLICY "Staff can create activity log entries" ON public.activity_log
  FOR INSERT WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- =============================================
-- 7. Fix employer over-access on notes
-- =============================================
DROP POLICY "Staff can create notes" ON public.notes;
CREATE POLICY "Staff can create notes" ON public.notes
  FOR INSERT WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));

-- =============================================
-- 8. Fix employer over-access on contract_activity_log
-- =============================================
DROP POLICY "Staff can insert contract activity" ON public.contract_activity_log;
CREATE POLICY "Staff can insert contract activity" ON public.contract_activity_log
  FOR INSERT WITH CHECK (is_authenticated() AND NOT is_agency(auth.uid()) AND NOT is_employer(auth.uid()));