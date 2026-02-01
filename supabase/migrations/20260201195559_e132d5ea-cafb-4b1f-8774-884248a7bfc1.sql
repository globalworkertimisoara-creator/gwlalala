-- Fix: Agencies can only edit/delete their own profiles if they have no workers in projects
-- This prevents agencies from modifying/deleting profiles that are actively being used

-- Drop existing update policy for agencies
DROP POLICY IF EXISTS "Agencies can update their own profile" ON public.agency_profiles;

-- Create new update policy - agencies can only update if they have no workers submitted
CREATE POLICY "Agencies can update their own profile if not in use"
  ON public.agency_profiles FOR UPDATE
  USING (
    user_id = auth.uid() AND
    NOT EXISTS (
      SELECT 1 FROM public.agency_workers aw
      WHERE aw.agency_id = id
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND
    NOT EXISTS (
      SELECT 1 FROM public.agency_workers aw
      WHERE aw.agency_id = id
    )
  );

-- Allow admins to update any agency profile (for corrections/management)
CREATE POLICY "Admins can update agency profiles"
  ON public.agency_profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create delete policy - agencies can only delete if they have no workers submitted
CREATE POLICY "Agencies can delete their own profile if not in use"
  ON public.agency_profiles FOR DELETE
  USING (
    user_id = auth.uid() AND
    NOT EXISTS (
      SELECT 1 FROM public.agency_workers aw
      WHERE aw.agency_id = id
    )
  );

-- Allow admins to delete any agency profile
CREATE POLICY "Admins can delete agency profiles"
  ON public.agency_profiles FOR DELETE
  USING (has_role(auth.uid(), 'admin'));