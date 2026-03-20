import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { JobTable } from '@/components/jobs/JobTable';
import { JobDetailPanel } from '@/components/jobs/JobDetailPanel';
import { useJobs, useJobCandidateCount } from '@/hooks/useJobs';
import { useAgencyInvitations } from '@/hooks/useAgencyInvitations';
import { useInvitedJobs } from '@/hooks/useAgencyInvitations';
import { useProjects } from '@/hooks/useProjects';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Loader2, Group } from 'lucide-react';
import { Job, JobStatus } from '@/types/database';

export default function Jobs() {
  const navigate = useNavigate();
  const { can, isAgency } = usePermissions();
  const { isAgency: authIsAgency } = useAuth();
  const isAgencyUser = isAgency || authIsAgency;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [groupBy, setGroupBy] = useState('none');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Data
  const { data: allJobs, isLoading: allJobsLoading } = useJobs({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search || undefined,
  });
  const { data: invitedJobs, isLoading: invitedJobsLoading } = useInvitedJobs();
  const { data: candidateCounts = {} } = useJobCandidateCount();
  const { data: allInvitations = [] } = useAgencyInvitations();
  const { data: projects = [] } = useProjects();

  // All jobs (unfiltered) for stats
  const { data: allJobsUnfiltered = [] } = useJobs();

  const isLoading = isAgencyUser ? invitedJobsLoading : allJobsLoading;

  // Base jobs filtered for agency users
  const baseJobs = useMemo(() => {
    if (!isAgencyUser) return allJobs || [];
    let jobs = invitedJobs || [];
    if (statusFilter !== 'all') {
      jobs = jobs.filter((j: any) => j.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter((j: any) =>
        j.title.toLowerCase().includes(q) ||
        j.client_company.toLowerCase().includes(q) ||
        j.country.toLowerCase().includes(q)
      );
    }
    return jobs;
  }, [isAgencyUser, allJobs, invitedJobs, statusFilter, search]);

  // Agency counts per job
  const agencyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allInvitations.forEach((inv: any) => {
      counts[inv.job_id] = (counts[inv.job_id] || 0) + 1;
    });
    return counts;
  }, [allInvitations]);

  // Project name per job
  const projectNames = useMemo(() => {
    const map: Record<string, string> = {};
    projects.forEach((p: any) => {
      p.jobs?.forEach((j: any) => {
        map[j.id] = p.name;
      });
    });
    return map;
  }, [projects]);

  // Keep selected job updated
  useEffect(() => {
    if (selectedJob) {
      const updated = baseJobs.find((j: any) => j.id === selectedJob.id);
      if (updated) setSelectedJob(updated);
    }
  }, [baseJobs]);

  // Stat counts
  const stats = useMemo(() => {
    const open = allJobsUnfiltered.filter((j: any) => j.status === 'open').length;
    const filled = allJobsUnfiltered.filter((j: any) => j.status === 'filled').length;
    const closed = allJobsUnfiltered.filter((j: any) => j.status === 'closed').length;
    const understaffed = allJobsUnfiltered.filter((j: any) => j.status === 'open' && (candidateCounts[j.id] || 0) === 0).length;
    const inProgress = allJobsUnfiltered.filter((j: any) => j.status === 'open' && (candidateCounts[j.id] || 0) > 0).length;
    return { total: allJobsUnfiltered.length, open, filled, closed, understaffed, inProgress };
  }, [allJobsUnfiltered, candidateCounts]);

  const handleStatusChipClick = (key: string) => {
    setStatusFilter(key as JobStatus | 'all');
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isAgencyUser ? 'Available Jobs' : 'Jobs'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isAgencyUser
                  ? 'View jobs you\'ve been invited to and submit workers'
                  : 'Manage job openings, link candidates, and track fulfillment'}
              </p>
            </div>
            {!isAgencyUser && can('createJobs') && (
              <Button size="sm" className="gap-1.5" onClick={() => navigate('/jobs/new')}>
                <Plus className="h-4 w-4" /> Add Job
              </Button>
            )}
          </div>

          {/* Compact Stat Bar */}
          {!isAgencyUser && (
            <div className="flex items-center gap-1 text-xs flex-wrap">
              <StatChip label="Total" value={stats.total} active={statusFilter === 'all'} onClick={() => handleStatusChipClick('all')} />
              <span className="text-muted-foreground">·</span>
              <StatChip label="Open" value={stats.open} color="text-green-700 bg-green-50" active={statusFilter === 'open'} onClick={() => handleStatusChipClick('open')} />
              <span className="text-muted-foreground">·</span>
              <StatChip label="Filled" value={stats.filled} color="text-blue-700 bg-blue-50" active={statusFilter === 'filled'} onClick={() => handleStatusChipClick('filled')} />
              <span className="text-muted-foreground">·</span>
              <StatChip label="Closed" value={stats.closed} active={statusFilter === 'closed'} onClick={() => handleStatusChipClick('closed')} />
              <span className="text-muted-foreground">·</span>
              {stats.understaffed > 0 && (
                <>
                  <StatChip label="Understaffed" value={stats.understaffed} color="text-red-700 bg-red-50" />
                  <span className="text-muted-foreground">·</span>
                </>
              )}
              <StatChip label="In Progress" value={stats.inProgress} color="text-amber-700 bg-amber-50" />
            </div>
          )}

          {/* Filters */}
          <div className="flex items-end gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, client, or country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as JobStatus | 'all')}>
              <SelectTrigger className="w-[150px] h-10">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
              </SelectContent>
            </Select>
            {!isAgencyUser && (
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="h-10 w-[150px]">
                  <Group className="h-4 w-4 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No grouping</SelectItem>
                  <SelectItem value="project">By Project</SelectItem>
                  <SelectItem value="status">By Status</SelectItem>
                  <SelectItem value="country">By Country</SelectItem>
                  <SelectItem value="client">By Client</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Main content: table + optional detail panel */}
        <div className="flex-1 flex gap-0 min-h-0 overflow-hidden mx-6 mb-6 rounded-lg border bg-card">
          {/* Table area */}
          <div className={`flex-1 min-w-0 overflow-auto p-3 ${selectedJob ? 'max-w-[65%]' : ''}`}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : baseJobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm font-medium">No jobs found</p>
                <p className="text-xs mt-1">
                  {isAgencyUser ? 'You haven\'t been invited to any jobs yet.' : 'Create your first job to get started.'}
                </p>
              </div>
            ) : (
              <JobTable
                jobs={baseJobs}
                candidateCounts={candidateCounts}
                agencyCounts={agencyCounts}
                projectNames={projectNames}
                selectedJobId={selectedJob?.id}
                onJobClick={(j) => setSelectedJob(j)}
                groupBy={groupBy}
              />
            )}
          </div>

          {/* Detail sidebar panel */}
          {selectedJob && (
            <div className="w-[35%] min-w-[320px] max-w-[420px] shrink-0 overflow-hidden">
              <JobDetailPanel
                key={selectedJob.id}
                job={selectedJob}
                onClose={() => setSelectedJob(null)}
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
