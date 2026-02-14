import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Loader2, Search, Briefcase, MapPin, Building2 } from 'lucide-react';

interface AgencyJobsListProps {
  agencyId: string;
}

export function AgencyJobsList({ agencyId }: AgencyJobsListProps) {
  const [search, setSearch] = useState('');

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['agency-invited-jobs', agencyId],
    queryFn: async () => {
      // Get job IDs this agency is invited to
      const { data: invitations, error: invErr } = await supabase
        .from('agency_job_invitations')
        .select('job_id')
        .eq('agency_id', agencyId);
      if (invErr) throw invErr;
      if (!invitations?.length) return [];

      const jobIds = invitations.map(i => i.job_id);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .in('id', jobIds)
        .eq('status', 'open');
      if (error) throw error;
      return data || [];
    },
    enabled: !!agencyId,
  });

  const filteredJobs = jobs?.filter(job =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.client_company.toLowerCase().includes(search.toLowerCase()) ||
    job.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !filteredJobs?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No jobs available</h3>
            <p className="text-muted-foreground">
              This agency hasn't been invited to any open jobs yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {filteredJobs.length} Job{filteredJobs.length !== 1 ? 's' : ''} Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map(job => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{job.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{job.client_company}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{job.country}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.salary_range || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
