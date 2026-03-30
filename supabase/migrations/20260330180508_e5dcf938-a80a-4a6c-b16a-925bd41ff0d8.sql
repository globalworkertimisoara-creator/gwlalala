
-- Fix: Set search_path on get_contract_prefix function
CREATE OR REPLACE FUNCTION public.get_contract_prefix(p_contract_type text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_contract_type
    WHEN 'recruitment' THEN 'REC'
    WHEN 'partnership' THEN 'PAR'
    WHEN 'consultancy' THEN 'CON'
    WHEN 'service' THEN 'SRV'
    WHEN 'employer_agreement' THEN 'REC'
    WHEN 'agency_agreement' THEN 'PAR'
    WHEN 'worker_contract' THEN 'REC'
    WHEN 'service_agreement' THEN 'SRV'
    ELSE 'CON'
  END;
$$;
