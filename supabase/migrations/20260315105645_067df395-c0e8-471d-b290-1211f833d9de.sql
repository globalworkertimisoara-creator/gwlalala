
-- Fix search_path on functions
ALTER FUNCTION public.compute_contract_number() SET search_path = public;
ALTER FUNCTION public.validate_contract_number_unique() SET search_path = public;

-- Fix permissive audit log insert policy - restrict to authenticated users
DROP POLICY IF EXISTS "System can insert audit log" ON public.contract_number_audit_log;
CREATE POLICY "Authenticated can insert audit log"
  ON public.contract_number_audit_log FOR INSERT
  WITH CHECK (is_authenticated());
