import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AgencyWorkerTable } from '@/components/agency/AgencyWorkerTable';
import { AgencyWorkerDetailPanel } from '@/components/agency/AgencyWorkerDetailPanel';
import { useAllAgencyWorkers } from '@/hooks/useAgency';
import { useJobs } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, Loader2, Group } from 'lucide-react';
import { STAGES } from '@/types/database';
import { AgencyWorker, ApprovalStatus } from '@/types/agency';

export default function AgencyWorkers() {
  const navigate = useNavigate();
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [selectedWorker, setSelectedWorker] = useState<AgencyWorker | null>(null);

  const { data: workers, isLoading } = useAllAgencyWorkers({
    stage: stageFilter,
    jobId: jobFilter,
  });
  const { data: jobs } = useJobs();

  // All workers for stats (unfiltered)
  const { data: allWorkers = [] } = useAllAgencyWorkers({});

  // Filter by search query and approval status
  const filteredWorkers = useMemo(() => {
    if (!workers) return [];
    return workers.filter((worker: any) => {
      if (approvalFilter !== 'all' && worker.approval_status !== approvalFilter) return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        worker.full_name.toLowerCase().includes(query) ||
        worker.email.toLowerCase().includes(query) ||
        worker.nationality?.toLowerCase().includes(query) ||
        worker.agency?.company_name?.toLowerCase().includes(query)
      );
    }) as AgencyWorker[];
  }, [workers, approvalFilter, searchQuery]);

  // Keep selected worker updated
  useEffect(() => {
    if (selectedWorker) {
      const updated = filteredWorkers.find(w => w.id === selectedWorker.id);
      if (updated) setSelectedWorker(updated);
    }
  }, [filteredWorkers]);

  // Status counts for stat bar
  const statusCounts = useMemo(() => {
    return {
      total: allWorkers.length,
      pending_review: allWorkers.filter((w: any) => w.approval_status === 'pending_review').length,
      approved: allWorkers.filter((w: any) => w.approval_status === 'approved').length,
      needs_documents: allWorkers.filter((w: any) => w.approval_status === 'needs_documents').length,
      rejected: allWorkers.filter((w: any) => w.approval_status === 'rejected').length,
    };
  }, [allWorkers]);

  const handleApprovalChipClick = (key: string) => {
    setApprovalFilter(prev => prev === key ? 'all' : key);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Agency Workers</h1>
              <p className="text-sm text-muted-foreground">
                Review and manage workers submitted by recruitment agencies
              </p>
            </div>
          </div>

          {/* Compact Stat Bar */}
          <div className="flex items-center gap-1 text-xs flex-wrap">
            <StatChip
              label="Total"
              value={statusCounts.total}
              active={approvalFilter === 'all'}
              onClick={() => setApprovalFilter('all')}
            />
            <span className="text-muted-foreground">·</span>
            <StatChip
              label="Pending"
              value={statusCounts.pending_review}
              color="text-yellow-700 bg-yellow-50"
              active={approvalFilter === 'pending_review'}
              onClick={() => handleApprovalChipClick('pending_review')}
            />
            <span className="text-muted-foreground">·</span>
            <StatChip
              label="Needs Docs"
              value={statusCounts.needs_documents}
              color="text-orange-700 bg-orange-50"
              active={approvalFilter === 'needs_documents'}
              onClick={() => handleApprovalChipClick('needs_documents')}
            />
            <span className="text-muted-foreground">·</span>
            <StatChip
              label="Approved"
              value={statusCounts.approved}
              color="text-green-700 bg-green-50"
              active={approvalFilter === 'approved'}
              onClick={() => handleApprovalChipClick('approved')}
            />
            <span className="text-muted-foreground">·</span>
            <StatChip
              label="Rejected"
              value={statusCounts.rejected}
              color="text-red-700 bg-red-50"
              active={approvalFilter === 'rejected'}
              onClick={() => handleApprovalChipClick('rejected')}
            />
          </div>

          {/* Filters */}
          <div className="flex items-end gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or agency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {STAGES.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label.split(' / ')[0]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={jobFilter} onValueChange={setJobFilter}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="All Jobs" />
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
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="h-10 w-[150px]">
                <Group className="h-4 w-4 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No grouping</SelectItem>
                <SelectItem value="approval">By Approval</SelectItem>
                <SelectItem value="stage">By Stage</SelectItem>
                <SelectItem value="agency">By Agency</SelectItem>
                <SelectItem value="job">By Job</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main content: table + optional detail panel */}
        <div className="flex-1 flex gap-0 min-h-0 overflow-hidden mx-6 mb-6 rounded-lg border bg-card">
          {/* Table area */}
          <div className={`flex-1 min-w-0 overflow-auto p-3 ${selectedWorker ? 'max-w-[65%]' : ''}`}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredWorkers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm font-medium">No workers found</p>
                <p className="text-xs mt-1">
                  {searchQuery || stageFilter !== 'all' || jobFilter !== 'all' || approvalFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No agency workers have been submitted yet'}
                </p>
              </div>
            ) : (
              <AgencyWorkerTable
                workers={filteredWorkers}
                selectedWorkerId={selectedWorker?.id}
                onWorkerClick={(w) => setSelectedWorker(w)}
                groupBy={groupBy}
              />
            )}
          </div>

          {/* Detail sidebar panel — replaces the old review dialog */}
          {selectedWorker && (
            <div className="w-[35%] min-w-[320px] max-w-[420px] shrink-0 overflow-hidden">
              <AgencyWorkerDetailPanel
                key={selectedWorker.id}
                worker={selectedWorker}
                onClose={() => setSelectedWorker(null)}
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function StatChip({ label, value, color, active, onClick }: { label: string; value: number; color?: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
        active ? 'ring-2 ring-primary/40 ' : 'hover:ring-1 hover:ring-primary/30 '
      }${color || 'text-muted-foreground bg-muted/50'}`}
    >
      <span className="font-medium">{value}</span>
      <span className="opacity-70">{label}</span>
    </button>
  );
}
