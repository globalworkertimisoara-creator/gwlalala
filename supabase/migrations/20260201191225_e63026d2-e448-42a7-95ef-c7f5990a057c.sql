-- Create a function for non-admin staff to retrieve limited agency information
-- This prevents exposure of sensitive contact details (email, phone, address, contact_person)
-- while still allowing staff to see which agencies exist

CREATE OR REPLACE FUNCTION public.get_agency_profiles_limited()
RETURNS TABLE (
  id uuid,
  company_name text,
  country text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, company_name, country 
  FROM public.agency_profiles
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_agency_profiles_limited() TO authenticated;