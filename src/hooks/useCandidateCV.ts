import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ─── Education ──────────────────────────────────────────────────────────────

export function useCandidateEducation(candidateId: string | undefined) {
  return useQuery({
    queryKey: ['candidate-education', candidateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidate_education')
        .select('*')
        .eq('candidate_id', candidateId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!candidateId,
  });
}

export function useSaveCandidateEducation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ candidateId, entries }: { candidateId: string; entries: any[] }) => {
      // Delete existing then insert new
      await supabase.from('candidate_education').delete().eq('candidate_id', candidateId);
      if (entries.length > 0) {
        const rows = entries.map((e, i) => ({
          candidate_id: candidateId,
          education_level: e.education_level,
          field_of_study: e.field_of_study || null,
          institution_name: e.institution_name || null,
          graduation_year: e.graduation_year || null,
          degree_obtained: e.degree_obtained || null,
          sort_order: i,
        }));
        const { error } = await supabase.from('candidate_education').insert(rows as any);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['candidate-education', vars.candidateId] });
      toast({ title: 'Education saved' });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Error', description: e.message }),
  });
}

// ─── Work Experience ────────────────────────────────────────────────────────

export function useCandidateWorkExperience(candidateId: string | undefined) {
  return useQuery({
    queryKey: ['candidate-work-experience', candidateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidate_work_experience')
        .select('*')
        .eq('candidate_id', candidateId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!candidateId,
  });
}

export function useSaveCandidateWorkExperience() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ candidateId, entries }: { candidateId: string; entries: any[] }) => {
      await supabase.from('candidate_work_experience').delete().eq('candidate_id', candidateId);
      if (entries.length > 0) {
        const rows = entries.map((e, i) => ({
          candidate_id: candidateId,
          job_title: e.job_title,
          company_name: e.company_name || null,
          country: e.country || null,
          start_date: e.start_date || null,
          end_date: e.end_date || null,
          job_description: e.job_description || null,
          sort_order: i,
        }));
        const { error } = await supabase.from('candidate_work_experience').insert(rows as any);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['candidate-work-experience', vars.candidateId] });
      toast({ title: 'Work experience saved' });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Error', description: e.message }),
  });
}

// ─── Languages ──────────────────────────────────────────────────────────────

export function useCandidateLanguages(candidateId: string | undefined) {
  return useQuery({
    queryKey: ['candidate-languages', candidateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidate_languages')
        .select('*')
        .eq('candidate_id', candidateId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!candidateId,
  });
}

export function useSaveCandidateLanguages() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ candidateId, entries }: { candidateId: string; entries: any[] }) => {
      await supabase.from('candidate_languages').delete().eq('candidate_id', candidateId);
      if (entries.length > 0) {
        const rows = entries.map(e => ({
          candidate_id: candidateId,
          language_name: e.language_name,
          proficiency_level: e.proficiency_level || 'basic',
        }));
        const { error } = await supabase.from('candidate_languages').insert(rows as any);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['candidate-languages', vars.candidateId] });
      toast({ title: 'Languages saved' });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Error', description: e.message }),
  });
}

// ─── Skills ─────────────────────────────────────────────────────────────────

export function useCandidateSkills(candidateId: string | undefined) {
  return useQuery({
    queryKey: ['candidate-skills', candidateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidate_skills')
        .select('*')
        .eq('candidate_id', candidateId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!candidateId,
  });
}

export function useSaveCandidateSkills() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ candidateId, entries }: { candidateId: string; entries: any[] }) => {
      await supabase.from('candidate_skills').delete().eq('candidate_id', candidateId);
      if (entries.length > 0) {
        const rows = entries.map(e => ({
          candidate_id: candidateId,
          skill_name: e.skill_name,
          years_experience: e.years_experience || null,
        }));
        const { error } = await supabase.from('candidate_skills').insert(rows as any);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['candidate-skills', vars.candidateId] });
      toast({ title: 'Skills saved' });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Error', description: e.message }),
  });
}

// ─── References ─────────────────────────────────────────────────────────────

export function useCandidateReferences(candidateId: string | undefined) {
  return useQuery({
    queryKey: ['candidate-references', candidateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidate_references')
        .select('*')
        .eq('candidate_id', candidateId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!candidateId,
  });
}

export function useSaveCandidateReferences() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ candidateId, entries }: { candidateId: string; entries: any[] }) => {
      await supabase.from('candidate_references').delete().eq('candidate_id', candidateId);
      if (entries.length > 0) {
        const rows = entries.map(e => ({
          candidate_id: candidateId,
          reference_name: e.reference_name,
          position_title: e.position_title || null,
          phone: e.phone || null,
          email: e.email || null,
          relationship: e.relationship || null,
        }));
        const { error } = await supabase.from('candidate_references').insert(rows as any);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['candidate-references', vars.candidateId] });
      toast({ title: 'References saved' });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Error', description: e.message }),
  });
}
