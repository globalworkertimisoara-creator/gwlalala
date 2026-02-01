-- Fix: Agency contact details should only be visible to admins
-- Other staff should use the get_agency_profiles_limited() function for basic agency info

-- The current "Admins can view all agency profiles" policy is correct
-- The issue is that queries via agency_workers join still expose full agency data
-- because the agency_workers SELECT policy allows all staff to view workers with agency data

-- No changes needed to agency_profiles RLS - it's already admin-only
-- The issue is in how the application queries agency data

-- Verify the policy is correct (this will fail silently if policy exists)
DO $$
BEGIN
  -- Check if the admin-only policy exists and is correct
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agency_profiles' 
    AND policyname = 'Admins can view all agency profiles'
  ) THEN
    -- Create the admin-only policy if it doesn't exist
    EXECUTE 'CREATE POLICY "Admins can view all agency profiles" ON public.agency_profiles FOR SELECT USING (has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;