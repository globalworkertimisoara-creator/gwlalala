-- Fix incorrect "in use" checks on agency_profiles update/delete policies
-- and add staff (non-agency) read access while keeping agencies restricted to their own profile.

-- 1) Replace the broken EXISTS subquery (aw.agency_id = aw.id) with correct join to agency_profiles.id
DROP POLICY IF EXISTS "Agencies can update their own profile if not in use" ON public.agency_profiles;
CREATE POLICY "Agencies can update their own profile if not in use"
ON public.agency_profiles
FOR UPDATE
USING (
  user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1
    FROM public.agency_workers aw
    WHERE aw.agency_id = public.agency_profiles.id
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1
    FROM public.agency_workers aw
    WHERE aw.agency_id = public.agency_profiles.id
  )
);

DROP POLICY IF EXISTS "Agencies can delete their own profile if not in use" ON public.agency_profiles;
CREATE POLICY "Agencies can delete their own profile if not in use"
ON public.agency_profiles
FOR DELETE
USING (
  user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1
    FROM public.agency_workers aw
    WHERE aw.agency_id = public.agency_profiles.id
  )
);

-- 2) Allow internal staff (authenticated, non-agency) to view all agency profiles.
--    Agencies remain limited to their own profile via existing policy.
DROP POLICY IF EXISTS "Staff can view all agency profiles" ON public.agency_profiles;
CREATE POLICY "Staff can view all agency profiles"
ON public.agency_profiles
FOR SELECT
USING (
  is_authenticated()
  AND NOT is_agency(auth.uid())
);