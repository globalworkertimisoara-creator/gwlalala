
-- Fix 1: Remove overly permissive INSERT policy on contract_number_audit_log
DROP POLICY IF EXISTS "Authenticated can insert audit log" ON public.contract_number_audit_log;

-- Fix 2: Restrict role_permissions SELECT to internal staff only
DROP POLICY IF EXISTS "Authenticated users can view role permissions" ON public.role_permissions;

CREATE POLICY "Internal staff can view role permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (
  is_authenticated()
  AND NOT is_agency(auth.uid())
  AND NOT is_employer(auth.uid())
);
