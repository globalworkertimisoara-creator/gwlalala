import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAllAgencyWorkers } from '@/hooks/useAgency';
import { useJobs } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Users, FileText, Building2 } from 'lucide-react';
import { STAGES, getStageLabel, getStageColor } from '@/types/database';
import { format } from 'date-fns';

export default function AgencyWorkers() {
  const navigate = useNavigate();
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: workers, isLoading } = useAllAgencyWorkers({ 
    stage: stageFilter, 
    jobId: jobFilter 
  });
  const { data: jobs } = useJobs();

  // Filter by search query
  const filteredWorkers = workers?.filter(worker => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      worker.full_name.toLowerCase().includes(query) ||
      worker.email.toLowerCase().includes(query) ||
      worker.nationality?.toLowerCase().includes(query) ||
      (worker as any).agency?.company_name?.toLowerCase().includes(query)
    );
  });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Agency Workers</h1>
          <p className="text-muted-foreground">
            Review and manage workers submitted by recruitment agencies
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or agency..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {STAGES.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={jobFilter} onValueChange={setJobFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by job" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {jobs?.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Workers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Agency Submissions
            </CardTitle>
            <CardDescription>
              {filteredWorkers?.length || 0} workers found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredWorkers?.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No workers found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || stageFilter !== 'all' || jobFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No agency workers have been submitted yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker</TableHead>
                      <TableHead>Agency</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Nationality</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkers?.map((worker) => (
                      <TableRow key={worker.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{worker.full_name}</p>
                            <p className="text-sm text-muted-foreground">{worker.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(worker as any).agency ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{(worker as any).agency.company_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {(worker as any).agency.country}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {(worker as any).job ? (
                            <div>
                              <p className="font-medium">{(worker as any).job.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {(worker as any).job.client_company}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{worker.nationality}</TableCell>
                        <TableCell>
                          <Badge className={getStageColor(worker.current_stage)}>
                            {getStageLabel(worker.current_stage)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(worker.submitted_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/agency-workers/${worker.id}`)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
