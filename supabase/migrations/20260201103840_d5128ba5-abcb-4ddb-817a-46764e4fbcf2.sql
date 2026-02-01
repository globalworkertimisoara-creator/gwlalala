-- Update the handle_new_user function to check for agency registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Check if this is an agency registration
  IF (NEW.raw_user_meta_data->>'is_agency')::boolean = true THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'agency');
  -- First non-agency user becomes admin, rest become recruiters
  ELSIF (SELECT COUNT(*) FROM public.user_roles WHERE role != 'agency') = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'recruiter');
  END IF;
  
  RETURN NEW;
END;
$$;