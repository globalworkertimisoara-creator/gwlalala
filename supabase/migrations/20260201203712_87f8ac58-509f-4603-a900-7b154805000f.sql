-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create team_members table to link users to teams
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_lead BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Teams policies - all authenticated staff can view teams
CREATE POLICY "Staff can view all teams"
ON public.teams FOR SELECT
USING (is_authenticated() AND NOT is_agency(auth.uid()));

-- Only admins and managers can create teams
CREATE POLICY "Managers can create teams"
ON public.teams FOR INSERT
WITH CHECK (can_manage_assignments(auth.uid()));

-- Only admins can update teams
CREATE POLICY "Admins can update teams"
ON public.teams FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can delete teams
CREATE POLICY "Admins can delete teams"
ON public.teams FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Team members policies
CREATE POLICY "Staff can view team members"
ON public.team_members FOR SELECT
USING (is_authenticated() AND NOT is_agency(auth.uid()));

CREATE POLICY "Managers can add team members"
ON public.team_members FOR INSERT
WITH CHECK (can_manage_assignments(auth.uid()));

CREATE POLICY "Managers can remove team members"
ON public.team_members FOR DELETE
USING (can_manage_assignments(auth.uid()));

-- Add updated_at trigger for teams
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();