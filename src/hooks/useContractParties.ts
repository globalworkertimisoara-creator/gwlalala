import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PartyOption {
  id: string;
  name: string;
}

/** Fetch all companies for employer party selection */
export function useCompanies() {
  return useQuery({
    queryKey: ['companies-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, company_name')
        .order('company_name');
      if (error) throw error;
      return (data ?? []).map((c) => ({ id: c.id, name: c.company_name })) as PartyOption[];
    },
  });
}

/** Fetch all agency profiles for agency party selection */
export function useAgencies() {
  return useQuery({
    queryKey: ['agencies-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_profiles')
        .select('id, company_name')
        .order('company_name');
      if (error) throw error;
      return (data ?? []).map((a) => ({ id: a.id, name: a.company_name })) as PartyOption[];
    },
  });
}

/** Fetch all candidates for worker party selection */
export function useCandidatesList() {
  return useQuery({
    queryKey: ['candidates-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select('id, full_name')
        .order('full_name')
        .limit(500);
      if (error) throw error;
      return (data ?? []).map((c) => ({ id: c.id, name: c.full_name })) as PartyOption[];
    },
  });
}

/** Build a lookup map from party_id -> name across all party types */
export function usePartyNameLookup() {
  const { data: companies = [] } = useCompanies();
  const { data: agencies = [] } = useAgencies();
  const { data: candidates = [] } = useCandidatesList();

  const lookup = new Map<string, string>();
  for (const c of companies) lookup.set(c.id, c.name);
  for (const a of agencies) lookup.set(a.id, a.name);
  for (const c of candidates) lookup.set(c.id, c.name);

  return lookup;
}

/** Build a lookup map from user_id -> name for sales staff */
export function useSalesPersonLookup() {
  const { data: profiles = [] } = useQuery({
    queryKey: ['all-staff-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .not('full_name', 'is', null);
      if (error) throw error;
      return (data ?? []) as { user_id: string; full_name: string | null }[];
    },
  });

  const lookup = new Map<string, string>();
  for (const p of profiles) {
    if (p.full_name) lookup.set(p.user_id, p.full_name);
  }
  return lookup;
}
