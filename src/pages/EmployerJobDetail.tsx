import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Briefcase, Loader2, MapPin, Building2, ShieldAlert } from 'lucide-react';

export default function EmployerJobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isRealAdmin } = useAuth();

  // Get user's company_id for scoping
  const { data: userProfile } = useQuery({
    queryKey: ['employer-user-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user?.id ?? '')
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const companyId = userProfile?.company_id;

  // Verify job belongs to user's company via project linkage
  const { data: isAuthorized, isLoading: authLoading } = useQuery({
    queryKey: ['employer-job-auth', id, companyId],
    queryFn: async () => {
      if (isRealAdmin) return true;
      if (!companyId) return false;
      // Check: job -> project -> company_projects -> company_id
      const { data: job } = await supabase
        .from('jobs')
        .select('project_id')
        .eq('id', id!)
        .single();
      if (!job?.project_id) return false;
      const { data: link } = await supabase
        .from('company_projects')
        .select('project_id')
        .eq('company_id', companyId)
        .eq('project_id', job.project_id)
        .maybeSingle();
      return !!link;
    },
    enabled: !!id && (!!companyId || isRealAdmin),
  });

  const { data: job, isLoading } = useQuery({
    queryKey: ['employer-job-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, client_company, country, salary_range, required_skills, description, status')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && isAuthorized === true,
  });

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="text-center py-12">
        <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-destructive/40" />
        <p className="text-lg font-semibold">Access Denied</p>
        <p className="text-sm text-muted-foreground mt-1">You don't have access to this role.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/employer')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
        <p className="text-lg font-semibold">Role not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/employer')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-muted-foreground">{job.client_company}</p>
        </div>
        <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>{job.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Country</p>
              <p className="font-medium">{job.country}</p>
            </div>
          </div>
          {job.salary_range && (
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Salary Range</p>
                <p className="font-medium">{job.salary_range}</p>
              </div>
            </div>
          )}
          {job.required_skills && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Required Skills</p>
              <p className="text-sm">{job.required_skills}</p>
            </div>
          )}
          {job.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm whitespace-pre-wrap">{job.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
