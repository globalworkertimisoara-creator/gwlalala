import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useInvitedJobs } from '@/hooks/useAgencyInvitations';
import { useAgencyProfile } from '@/hooks/useAgency';
import { SubmitWorkerDialog } from '@/components/agency/SubmitWorkerDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Search, Briefcase, MapPin, Building2 } from 'lucide-react';

export default function AgencyJobs() {
  const { data: jobs, isLoading } = useInvitedJobs();
  const { data: agencyProfile } = useAgencyProfile();
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  const filteredJobs = jobs?.filter(job =>
    job.title.toLowerCase().includes(search.toLowerCase()) ||
    job.client_company.toLowerCase().includes(search.toLowerCase()) ||
    job.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Available Jobs</h1>
          <p className="text-muted-foreground">
            View jobs you've been invited to and submit workers
          </p>
        </div>

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
        ) : filteredJobs?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No jobs available</h3>
              <p className="text-muted-foreground">
                You haven't been invited to any jobs yet. Contact GlobalWorker for access.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {filteredJobs?.length} Job{filteredJobs?.length !== 1 ? 's' : ''} Available
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
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs?.map(job => (
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
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => setSelectedJob(job)}
                        >
                          View & Submit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Job Detail Dialog (instead of navigating to non-existent /agency/jobs/:id) */}
        <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                {selectedJob?.title}
              </DialogTitle>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Client</span>
                    <span className="text-sm font-medium">{selectedJob.client_company}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Country</span>
                    <span className="text-sm font-medium">{selectedJob.country}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={selectedJob.status === 'open' ? 'default' : 'secondary'}>{selectedJob.status}</Badge>
                  </div>
                  {selectedJob.salary_range && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Salary Range</span>
                      <span className="text-sm font-medium">{selectedJob.salary_range}</span>
                    </div>
                  )}
                  {selectedJob.required_skills && (
                    <div>
                      <span className="text-sm text-muted-foreground">Required Skills</span>
                      <p className="text-sm mt-1">{selectedJob.required_skills}</p>
                    </div>
                  )}
                  {selectedJob.description && (
                    <div>
                      <span className="text-sm text-muted-foreground">Description</span>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedJob.description}</p>
                    </div>
                  )}
                </div>
                {agencyProfile && (
                  <div className="flex justify-end pt-2 border-t">
                    <SubmitWorkerDialog
                      agencyId={agencyProfile.id}
                      onSuccess={() => setSelectedJob(null)}
                      trigger={
                        <Button>Submit Worker for This Role</Button>
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
