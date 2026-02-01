-- Drop existing policies on profiles table
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Create more restrictive SELECT policies
-- Staff (non-agencies) can view all profiles for collaboration
CREATE POLICY "Staff can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_authenticated() AND NOT is_agency(auth.uid()));

-- Agencies can only view their own profile
CREATE POLICY "Agencies can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());