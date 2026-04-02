-- Fix SECURITY DEFINER view warning by setting security_invoker = true
ALTER VIEW public.v_candidates_for_employers SET (security_invoker = on);