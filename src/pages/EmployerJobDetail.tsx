import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Briefcase, Loader2, MapPin, Building2 } from 'lucide-react';

export default function EmployerJobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
