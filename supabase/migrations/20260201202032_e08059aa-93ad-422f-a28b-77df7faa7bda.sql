-- Create a table for storing registration codes (admin-configurable)
CREATE TABLE public.registration_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_type TEXT NOT NULL CHECK (code_type IN ('staff', 'agency')),
  code_value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.registration_codes ENABLE ROW LEVEL SECURITY;

-- Admins can manage registration codes
CREATE POLICY "Admins can manage registration codes"
  ON public.registration_codes FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Anyone can verify a registration code (needed during signup before having a role)
-- We don't expose the actual codes, just allow verification via RPC
CREATE OR REPLACE FUNCTION public.verify_registration_code(_code_type TEXT, _code_value TEXT)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.registration_codes
    WHERE code_type = _code_type
    AND code_value = _code_value
  )
$$;

-- Insert default codes (can be changed by admin)
INSERT INTO public.registration_codes (code_type, code_value) VALUES 
  ('staff', 'GLOBALWORKER2024'),
  ('agency', 'AGENCY2024');

-- Add trigger for updated_at
CREATE TRIGGER update_registration_codes_updated_at
  BEFORE UPDATE ON public.registration_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();