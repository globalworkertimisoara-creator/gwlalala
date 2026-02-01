-- Update the handle_new_user trigger to verify registration codes server-side
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _code_type TEXT;
  _code_value TEXT;
  _is_valid BOOLEAN;
BEGIN
  -- Extract registration code from metadata
  _code_value := NEW.raw_user_meta_data->>'registration_code';
  
  -- Determine code type based on registration type
  IF (NEW.raw_user_meta_data->>'is_agency')::boolean = true THEN
    _code_type := 'agency';
  ELSE
    _code_type := 'staff';
  END IF;
  
  -- Verify the registration code server-side
  SELECT EXISTS (
    SELECT 1 FROM public.registration_codes
    WHERE code_type = _code_type
    AND code_value = _code_value
  ) INTO _is_valid;
  
  -- Reject signup if code is invalid
  IF NOT _is_valid THEN
    RAISE EXCEPTION 'Invalid registration code' USING ERRCODE = 'P0001';
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Assign role based on registration type
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
$function$;