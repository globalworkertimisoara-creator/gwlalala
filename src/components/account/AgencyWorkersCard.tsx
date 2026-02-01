import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Users, MapPin, Briefcase } from 'lucide-react';

interface AgencyWorker {
  id: string;
  full_name: string;
  nationality: string;
  current_country: string | null;
  approval_status: string;
  current_stage: string;
  agency: {
    company_name: string;
  } | null;
  job: {
    title: string;
  } | null;
}

const APPROVAL_STATUS_COLORS: Record<string, string> = {
  pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  needs_documents: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  needs_documents: 'Needs Documents',
};

export function AgencyWorkersCard() {
  const { data: workers, isLoading } = useQuery({
    queryKey: ['agency-workers-org-view'],
    queryFn: async () => {
      // Get workers with agency and job info
      const { data: workersData, error: workersError } = await supabase
        .from('agency_workers')
        .select('id, full_name, nationality, current_country, approval_status, current_stage, agency_id, job_id')
        .order('submitted_at', { ascending: false });

      if (workersError) throw workersError;

      // Get agency names
      const agencyIds = [...new Set(workersData.map(w => w.agency_id))];
      const { data: agencies } = await supabase
        .rpc('get_agency_profiles_limited');

      // Get job titles
      const jobIds = [...new Set(workersData.map(w => w.job_id))];
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title')
        .in('id', jobIds);

      return workersData.map(worker => ({
        ...worker,
        agency: agencies?.find((a: { id: string }) => a.id === worker.agency_id) || null,
        job: jobs?.find(j => j.id === worker.job_id) || null,
      })) as AgencyWorker[];
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle>Agency Workers</CardTitle>
        </div>
        <CardDescription>
          Workers submitted by recruitment agencies. {workers?.length || 0} workers total.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Agency</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workers?.map((worker) => (
              <TableRow key={worker.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(worker.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{worker.full_name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{worker.nationality}</span>
                        {worker.current_country && worker.current_country !== worker.nationality && (
                          <span>• in {worker.current_country}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{worker.agency?.company_name || 'Unknown'}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{worker.job?.title || 'Unknown'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={APPROVAL_STATUS_COLORS[worker.approval_status] || ''}
                  >
                    {APPROVAL_STATUS_LABELS[worker.approval_status] || worker.approval_status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {(!workers || workers.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No agency workers submitted yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
