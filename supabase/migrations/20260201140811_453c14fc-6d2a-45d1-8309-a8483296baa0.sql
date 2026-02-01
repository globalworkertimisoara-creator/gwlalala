-- Fix notes table RLS to exclude agencies from viewing/creating notes
-- Notes are internal staff-only for candidate evaluation

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view all notes" ON public.notes;
DROP POLICY IF EXISTS "Authenticated users can create notes" ON public.notes;

-- Create staff-only policies (excludes agencies)
CREATE POLICY "Staff can view all notes"
ON public.notes
FOR SELECT
USING (public.is_authenticated() AND NOT public.is_agency(auth.uid()));

CREATE POLICY "Staff can create notes"
ON public.notes
FOR INSERT
WITH CHECK (public.is_authenticated() AND NOT public.is_agency(auth.uid()));