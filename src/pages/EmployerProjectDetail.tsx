import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft, Building2, MapPin, Users, Briefcase, Loader2, FolderOpen,
} from 'lucide-react';
import { format } from 'date-fns';
import { getProjectStatusLabel } from '@/types/project';

const PHASE_LABELS: Record<string, string> = {
  recruitment: 'Recruitment',
  documentation: 'Documentation',
  visa: 'Visa',
  arrival: 'Arrival',
  residence_permit: 'Residence Permit',
};

export default function EmployerProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project, isLoading: projLoading } = useQuery({
    queryKey: ['employer-project-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['employer-project-jobs', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('jobs')
        .select('id, title, status, country')
        .eq('project_id', id!);
      return data || [];
    },
    enabled: !!id,
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ['employer-project-workflows', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('candidate_workflow')
        .select('id, current_phase, candidate_id, candidates(full_name, email, nationality)')
        .eq('project_id', id!);
      return data || [];
    },
    enabled: !!id,
  });

  if (projLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
        <p className="text-lg font-semibold">Project not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/employer')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  // Phase summary
  const phaseCounts = workflows.reduce((acc: Record<string, number>, wf: any) => {
    acc[wf.current_phase] = (acc[wf.current_phase] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate('/employer')}>
        <ArrowLeft className="h-4 w-4" /> Back to Employer Portal
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.employer_name} • {project.location}</p>
        </div>
        <Badge variant="secondary">{getProjectStatusLabel(project.status)}</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Employer</p>
                <p className="font-medium">{project.employer_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-medium">{project.location}</p>
              </div>
            </div>
            {project.countries_in_contract?.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Contract Countries</p>
                <div className="flex flex-wrap gap-1">
                  {project.countries_in_contract.map((c: string) => (
                    <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Phase overview + candidates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Phase summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Candidate Progress</CardTitle>
              <CardDescription>{workflows.length} candidate(s) in workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {Object.entries(PHASE_LABELS).map(([key, label]) => (
                  <div key={key} className="text-center p-2 rounded-lg border">
                    <p className="text-2xl font-bold">{phaseCounts[key] || 0}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Candidates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Candidates ({workflows.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workflows.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No candidates yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Nationality</TableHead>
                      <TableHead>Phase</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workflows.map((wf: any) => (
                      <TableRow
                        key={wf.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/employer/candidates/${wf.candidate_id}`)}
                      >
                        <TableCell className="font-medium">{(wf.candidates as any)?.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{(wf.candidates as any)?.email}</TableCell>
                        <TableCell>{(wf.candidates as any)?.nationality || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{PHASE_LABELS[wf.current_phase] || wf.current_phase}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Jobs */}
          {jobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Linked Roles ({jobs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job: any) => (
                      <TableRow 
                        key={job.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/employer/jobs/${job.id}`)}
                      >
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>{job.country}</TableCell>
                        <TableCell>
                          <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>{job.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
