import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useJob, useUpdateJob, useJobCandidates, useLinkCandidateToJob } from '@/hooks/useJobs';
import { useCandidates } from '@/hooks/useCandidates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Loader2,
  Building2,
  MapPin,
  DollarSign,
  Users,
  ExternalLink,
  Search,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { JobStatus, getStageLabel, getStageColor } from '@/types/database';
import { cn } from '@/lib/utils';

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<JobStatus, string> = {
  open: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  filled: 'bg-blue-100 text-blue-800',
};

function getInitials(fullName: string): string {
  return fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: job, isLoading: jobLoading } = useJob(id);
  const { data: jobCandidateLinks, isLoading: linkedLoading } = useJobCandidates(id);
  const { data: allCandidates } = useCandidates();
  const updateJob = useUpdateJob();
  const linkCandidate = useLinkCandidateToJob();

  const [newStatus, setNewStatus] = useState<string>('');
  const [linkSearch, setLinkSearch] = useState('');

  // ─── Derived ─────────────────────────────────────────────────────────────

  // Extract the candidate objects from the link rows
  const linkedCandidates = useMemo(
    () => (jobCandidateLinks || []).map((link) => link.candidates),
    [jobCandidateLinks]
  );

  const linkedIds = useMemo(
    () => new Set(linkedCandidates.map((c) => c.id)),
    [linkedCandidates]
  );

  // Candidates available to link: exclude already-linked ones, filter by search
  const availableCandidates = useMemo(() => {
    if (!linkSearch.trim()) return [];
    const q = linkSearch.trim().toLowerCase();
    return (allCandidates || []).filter(
      (c) =>
        !linkedIds.has(c.id) &&
        (c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
    );
  }, [allCandidates, linkedIds, linkSearch]);

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleStatusChange = async () => {
    if (!newStatus || !id) return;
    await updateJob.mutateAsync({ id, status: newStatus as JobStatus });
    setNewStatus('');
  };

  const handleLink = async (candidateId: string) => {
    if (!id) return;
    await linkCandidate.mutateAsync({ candidate_id: candidateId, job_id: id });
    setLinkSearch('');
  };

  // ─── Loading / Not Found ─────────────────────────────────────────────────

  if (jobLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!job) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 text-center max-w-md mx-auto mt-24">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-lg font-semibold text-foreground">Job not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This job may have been deleted or the link is invalid.
          </p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
      </AppLayout>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">

        {/* Back */}
        <Button variant="ghost" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
                  <Badge className={cn('text-xs', STATUS_COLORS[job.status])}>
                    {job.status}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    {job.client_company}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {job.country}
                  </span>
                  {job.salary_range && (
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4" />
                      {job.salary_range}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {linkedCandidates.length} candidate{linkedCandidates.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {job.required_skills && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Required Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.required_skills.split(',').map((skill) => {
                        const s = skill.trim();
                        return s ? (
                          <Badge key={s} variant="secondary" className="text-xs bg-primary/8 text-primary">
                            {s}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {job.description && (
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{job.description}</p>
                )}

                <p className="text-xs text-muted-foreground mt-3">
                  Created {format(new Date(job.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Two-column layout ──────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Left: Status change + Link candidate */}
          <div className="space-y-4">
            {/* Change Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Change Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>New Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open" disabled={job.status === 'open'}>
                        Open {job.status === 'open' && '(current)'}
                      </SelectItem>
                      <SelectItem value="closed" disabled={job.status === 'closed'}>
                        Closed {job.status === 'closed' && '(current)'}
                      </SelectItem>
                      <SelectItem value="filled" disabled={job.status === 'filled'}>
                        Filled {job.status === 'filled' && '(current)'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  disabled={!newStatus || updateJob.isPending}
                  onClick={handleStatusChange}
                >
                  {updateJob.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Status
                </Button>
              </CardContent>
            </Card>

            {/* Link Candidate */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Link Candidate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email…"
                    value={linkSearch}
                    onChange={(e) => setLinkSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>

                {linkSearch.trim() && (
                  <div className="rounded-lg border border-border/60 overflow-hidden">
                    {availableCandidates.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto divide-y divide-border/40">
                        {availableCandidates.slice(0, 8).map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/40 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{c.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary"
                              onClick={() => handleLink(c.id)}
                              disabled={linkCandidate.isPending}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        No unlinked candidates match
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Linked candidates list */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Linked Candidates</CardTitle>
              </CardHeader>
              <CardContent>
                {linkedLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : linkedCandidates.length > 0 ? (
                  <div className="space-y-2">
                    {linkedCandidates.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-4 p-3 rounded-lg border border-border/50 hover:border-primary/30 cursor-pointer transition-colors"
                        onClick={() => navigate(`/candidates/${c.id}`)}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                            {getInitials(c.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{c.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className={cn('text-xs', getStageColor(c.current_stage))}>
                            {getStageLabel(c.current_stage).split(' / ')[0]}
                          </Badge>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-muted-foreground font-medium">No candidates linked yet</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Use the search panel on the left to link candidates to this job.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
