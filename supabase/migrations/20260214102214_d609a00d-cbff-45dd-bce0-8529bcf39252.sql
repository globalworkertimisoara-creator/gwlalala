
DROP POLICY "Authenticated users can create notifications" ON public.notifications;

CREATE POLICY "Staff can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  is_authenticated() AND NOT is_agency(auth.uid())
);
