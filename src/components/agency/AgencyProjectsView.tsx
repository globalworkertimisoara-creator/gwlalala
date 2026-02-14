import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, FolderOpen, MapPin, Briefcase, Users } from 'lucide-react';

interface AgencyProjectsViewProps {
  agencyId: string;
}

interface AgencyProjectData {
  id: string;
  name: string;
  employer_name: string;
  location: string;
  status: string;
  jobs: {
    id: string;
    title: string;
    country: string;
    total_positions_filled: number;
    agency_applicants: number;
  }[];
  total_open_spots: number;
  total_filled: number;
  total_positions: number;
  agency_total_applicants: number;
}

export function AgencyProjectsView({ agencyId }: AgencyProjectsViewProps) {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['agency-projects', agencyId],
    queryFn: async (): Promise<AgencyProjectData[]> => {
      // 1. Get job IDs this agency is invited to
      const { data: invitations, error: invErr } = await supabase
        .from('agency_job_invitations')
        .select('job_id')
        .eq('agency_id', agencyId);
      if (invErr) throw invErr;
      if (!invitations?.length) return [];

      const jobIds = invitations.map(i => i.job_id);

      // 2. Get those jobs with their project info
      const { data: jobs, error: jobsErr } = await supabase
        .from('jobs')
        .select('id, title, country, project_id, status')
        .in('id', jobIds);
      if (jobsErr) throw jobsErr;
      if (!jobs?.length) return [];

      // 3. Get unique project IDs
      const projectIds = [...new Set(jobs.filter(j => j.project_id).map(j => j.project_id!))];
      if (!projectIds.length) return [];

      // 4. Fetch projects
      const { data: projectsData, error: projErr } = await supabase
        .from('projects')
        .select('id, name, employer_name, location, status')
        .in('id', projectIds);
      if (projErr) throw projErr;

      // 5. Get ALL jobs for these projects (to calculate total filled across all agencies)
      const { data: allProjectJobs, error: allJobsErr } = await supabase
        .from('jobs')
        .select('id, title, country, project_id, status')
        .in('project_id', projectIds);
      if (allJobsErr) throw allJobsErr;

      const allProjectJobIds = allProjectJobs?.map(j => j.id) || [];

      // 6. Get candidate_job_links for ALL jobs in these projects (filled = placed)
      const { data: allLinks, error: linksErr } = await supabase
        .from('candidate_job_links')
        .select('job_id, current_status')
        .in('job_id', allProjectJobIds);
      if (linksErr) throw linksErr;

      // 7. Get this agency's workers for these jobs
      const { data: agencyWorkers, error: awErr } = await supabase
        .from('agency_workers')
        .select('id, job_id')
        .eq('agency_id', agencyId)
        .in('job_id', allProjectJobIds);
      if (awErr) throw awErr;

      // Build counts
      const filledByJob: Record<string, number> = {};
      const totalByJob: Record<string, number> = {};
      (allLinks || []).forEach(link => {
        totalByJob[link.job_id] = (totalByJob[link.job_id] || 0) + 1;
        if (link.current_status === 'placed') {
          filledByJob[link.job_id] = (filledByJob[link.job_id] || 0) + 1;
        }
      });

      const agencyWorkersByJob: Record<string, number> = {};
      (agencyWorkers || []).forEach(w => {
        agencyWorkersByJob[w.job_id] = (agencyWorkersByJob[w.job_id] || 0) + 1;
      });

      // Build project data - only include jobs agency is invited to
      const invitedJobSet = new Set(jobIds);

      return (projectsData || []).map(project => {
        const pJobs = (allProjectJobs || []).filter(j => j.project_id === project.id && invitedJobSet.has(j.id));

        let totalFilled = 0;
        let totalPositions = 0;
        let agencyTotal = 0;

        const jobRows = pJobs.map(job => {
          const filled = filledByJob[job.id] || 0;
          const positions = totalByJob[job.id] || 0;
          const agencyApplicants = agencyWorkersByJob[job.id] || 0;
          totalFilled += filled;
          totalPositions += positions;
          agencyTotal += agencyApplicants;

          return {
            id: job.id,
            title: job.title,
            country: job.country,
            total_positions_filled: filled,
            agency_applicants: agencyApplicants,
          };
        });

        return {
          id: project.id,
          name: project.name,
          employer_name: project.employer_name,
          location: project.location,
          status: project.status,
          jobs: jobRows,
          total_open_spots: totalPositions - totalFilled,
          total_filled: totalFilled,
          total_positions: totalPositions,
          agency_total_applicants: agencyTotal,
        };
      }).filter(p => p.jobs.length > 0);
    },
    enabled: !!agencyId,
    refetchInterval: 15000, // Real-time-ish: refetch every 15 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No projects available</h3>
          <p className="text-muted-foreground">
            You haven't been invited to any jobs linked to projects yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Spots</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.reduce((acc, p) => acc + Math.max(0, p.total_open_spots), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Applicants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.reduce((acc, p) => acc + p.agency_total_applicants, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Submitted by your agency</p>
          </CardContent>
        </Card>
      </div>

      {/* Project cards */}
      {projects.map(project => {
        const fillPct = project.total_positions > 0
          ? Math.round((project.total_filled / project.total_positions) * 100)
          : 0;

        return (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span>{project.employer_name}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {project.location}
                    </span>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-1">
                    {Math.max(0, project.total_open_spots)} open spot{project.total_open_spots !== 1 ? 's' : ''}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {project.agency_total_applicants} your applicant{project.agency_total_applicants !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Fill progress</span>
                  <span>{project.total_filled} / {project.total_positions} filled ({fillPct}%)</span>
                </div>
                <Progress value={fillPct} className="h-2" />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Filled</TableHead>
                    <TableHead className="text-right">Your Applicants</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.jobs.map(job => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{job.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {job.country}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={job.total_positions_filled > 0 ? 'default' : 'secondary'} className="text-xs">
                          {job.total_positions_filled} placed
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {job.agency_applicants}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
