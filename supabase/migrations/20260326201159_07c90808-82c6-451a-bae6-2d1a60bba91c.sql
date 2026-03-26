CREATE TABLE IF NOT EXISTS public.company_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, project_id)
);

ALTER TABLE public.company_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view company_projects"
  ON public.company_projects
  FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO public.company_projects (company_id, project_id)
SELECT company_id, id FROM public.projects WHERE company_id IS NOT NULL
ON CONFLICT DO NOTHING;