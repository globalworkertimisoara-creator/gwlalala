
-- Fix: Restrict notes SELECT to creator, admins, or staff with candidate access
DROP POLICY IF EXISTS "Staff can view all notes" ON public.notes;

CREATE POLICY "Staff can view relevant notes"
ON public.notes
FOR SELECT
TO authenticated
USING (
  NOT is_agency(auth.uid())
  AND (
    created_by = auth.uid()
    OR has_role(auth.uid(), 'admin')
    OR can_view_candidate_history(auth.uid(), candidate_id)
  )
);
