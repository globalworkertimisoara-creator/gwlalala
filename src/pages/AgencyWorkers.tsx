import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAllAgencyWorkers } from '@/hooks/useAgency';
import { useJobs } from '@/hooks/useJobs';
import { WorkerReviewDialog } from '@/components/agency/WorkerReviewDialog';
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
import { Loader2, Search, Users, FileText, Building2, ClipboardCheck } from 'lucide-react';
import { STAGES, getStageLabel, getStageColor } from '@/types/database';
import { AgencyWorker, APPROVAL_STATUS_CONFIG, getApprovalStatusColor, getApprovalStatusLabel, ApprovalStatus } from '@/types/agency';
import { format } from 'date-fns';

export default function AgencyWorkers() {
  const navigate = useNavigate();
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewingWorker, setReviewingWorker] = useState<AgencyWorker | null>(null);

  const { data: workers, isLoading } = useAllAgencyWorkers({ 
    stage: stageFilter, 
    jobId: jobFilter 
  });
  const { data: jobs } = useJobs();

  // Filter by search query and approval status
  const filteredWorkers = workers?.filter(worker => {
    // Approval filter
    if (approvalFilter !== 'all' && (worker as any).approval_status !== approvalFilter) {
      return false;
    }
    
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      worker.full_name.toLowerCase().includes(query) ||
      worker.email.toLowerCase().includes(query) ||
      worker.nationality?.toLowerCase().includes(query) ||
      (worker as any).agency?.company_name?.toLowerCase().includes(query)
    );
  }) as AgencyWorker[] | undefined;

  // Count workers by approval status
  const statusCounts = {
    pending_review: workers?.filter((w: any) => w.approval_status === 'pending_review').length || 0,
    approved: workers?.filter((w: any) => w.approval_status === 'approved').length || 0,
    needs_documents: workers?.filter((w: any) => w.approval_status === 'needs_documents').length || 0,
    rejected: workers?.filter((w: any) => w.approval_status === 'rejected').length || 0,
  };

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

        {/* Status Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card 
            className={`cursor-pointer transition-all ${approvalFilter === 'pending_review' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setApprovalFilter(approvalFilter === 'pending_review' ? 'all' : 'pending_review')}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending_review}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <ClipboardCheck className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${approvalFilter === 'needs_documents' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setApprovalFilter(approvalFilter === 'needs_documents' ? 'all' : 'needs_documents')}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Needs Documents</p>
                  <p className="text-2xl font-bold text-orange-600">{statusCounts.needs_documents}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${approvalFilter === 'approved' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setApprovalFilter(approvalFilter === 'approved' ? 'all' : 'approved')}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${approvalFilter === 'rejected' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setApprovalFilter(approvalFilter === 'rejected' ? 'all' : 'rejected')}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
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
              {approvalFilter !== 'all' && (
                <Button variant="ghost" onClick={() => setApprovalFilter('all')}>
                  Clear Status Filter
                </Button>
              )}
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
                  {searchQuery || stageFilter !== 'all' || jobFilter !== 'all' || approvalFilter !== 'all'
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
                      <TableHead>Approval</TableHead>
                      <TableHead>Stage</TableHead>
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
                          {worker.agency ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{worker.agency.company_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {worker.agency.country}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {worker.job ? (
                            <div>
                              <p className="font-medium">{worker.job.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {worker.job.client_company}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getApprovalStatusColor(worker.approval_status)}>
                            {getApprovalStatusLabel(worker.approval_status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStageColor(worker.current_stage)}>
                            {getStageLabel(worker.current_stage)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(worker.submitted_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReviewingWorker(worker)}
                            >
                              <ClipboardCheck className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/agency-workers/${worker.id}`)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </div>
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

      {/* Review Dialog */}
      {reviewingWorker && (
        <WorkerReviewDialog
          worker={reviewingWorker}
          open={!!reviewingWorker}
          onOpenChange={(open) => !open && setReviewingWorker(null)}
        />
      )}
    </AppLayout>
  );
}