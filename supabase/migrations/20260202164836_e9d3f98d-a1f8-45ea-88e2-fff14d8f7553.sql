-- Add team_id and project_id columns to notifications for team/project-wide notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_team_id ON public.notifications(team_id);
CREATE INDEX IF NOT EXISTS idx_notifications_project_id ON public.notifications(project_id);

-- Create function to check if user can view a notification
CREATE OR REPLACE FUNCTION public.can_view_notification(_user_id uuid, _notification_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.id = _notification_id
    AND (
      -- Personal notification for this user
      n.user_id = _user_id
      OR
      -- Team notification for a team user is member of
      (n.team_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = n.team_id AND tm.user_id = _user_id
      ))
      OR
      -- Project notification for a project user is assigned to
      (n.project_id IS NOT NULL AND public.is_assigned_to_project(_user_id, n.project_id))
    )
  )
$$;

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;

-- Create new SELECT policy that includes team and project notifications
CREATE POLICY "Users can view relevant notifications"
ON public.notifications
FOR SELECT
USING (can_view_notification(auth.uid(), id));

-- Update the UPDATE policy to also allow updating team/project notifications user can see
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can update relevant notifications"
ON public.notifications
FOR UPDATE
USING (can_view_notification(auth.uid(), id))
WITH CHECK (can_view_notification(auth.uid(), id));