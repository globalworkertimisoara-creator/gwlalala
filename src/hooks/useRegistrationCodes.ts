import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RegistrationCode {
  id: string;
  code_type: 'staff' | 'agency';
  code_value: string;
  updated_at: string;
  updated_by: string | null;
}

export function useRegistrationCodes() {
  return useQuery({
    queryKey: ['registration-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registration_codes')
        .select('*')
        .order('code_type');

      if (error) throw error;
      return data as RegistrationCode[];
    },
  });
}

export function useUpdateRegistrationCode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ codeType, codeValue }: { codeType: 'staff' | 'agency'; codeValue: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('registration_codes')
        .update({ 
          code_value: codeValue,
          updated_by: user?.id 
        })
        .eq('code_type', codeType)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['registration-codes'] });
      toast({
        title: 'Code updated',
        description: `The ${variables.codeType} registration code has been updated.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update code',
        description: error.message,
      });
    },
  });
}

export async function verifyRegistrationCode(codeType: 'staff' | 'agency', codeValue: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_registration_code', {
    _code_type: codeType,
    _code_value: codeValue,
  });

  if (error) {
    console.error('Error verifying registration code:', error);
    return false;
  }

  return data === true;
}
