
-- Fix: Scope company_projects SELECT policies
DROP POLICY IF EXISTS "Authenticated users can view company_projects" ON public.company_projects;

CREATE POLICY "Staff can view all company_projects"
ON public.company_projects
FOR SELECT
TO authenticated
USING (
  is_authenticated()
  AND NOT is_agency(auth.uid())
  AND NOT is_employer(auth.uid())
);

CREATE POLICY "Employers can view own company_projects"
ON public.company_projects
FOR SELECT
TO authenticated
USING (
  is_employer(auth.uid())
  AND company_id = public.get_employer_company_id(auth.uid())
);
