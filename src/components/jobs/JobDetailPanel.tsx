import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  X, ExternalLink, ChevronDown, ChevronRight, Building2, MapPin, DollarSign,
  Users, Briefcase, FolderKanban, Search, Plus, Loader2, Clock, CheckSquare,
  Circle, CheckCircle2, Send,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Job, JobStatus, getStageLabel, getStageColor } from '@/types/database';
import { useUpdateJob, useJobCandidates, useLinkCandidateToJob } from '@/hooks/useJobs';
import { useCandidates } from '@/hooks/useCandidates';
import { useProjects, useLinkJobToProject } from '@/hooks/useProjects';
import { useAgencyInvitations } from '@/hooks/useAgencyInvitations';
import { useTasks, useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

interface JobDetailPanelProps {
  job: Job;
  onClose: () => void;
}

const STATUS_COLORS: Record<JobStatus, string> = {
  open: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  filled: 'bg-blue-100 text-blue-800',
};

export function JobDetailPanel({ job, onClose }: JobDetailPanelProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const updateJob = useUpdateJob();
  const linkCandidate = useLinkCandidateToJob();
  const linkJobToProject = useLinkJobToProject();
  const { data: jobCandidateLinks = [] } = useJobCandidates(job.id);
  const { data: allCandidates } = useCandidates();
  const { data: projects } = useProjects();
  const { data: invitations = [] } = useAgencyInvitations(job.id);
  const { data: tasks = [] } = useTasks({ entity_type: 'job', entity_id: job.id });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    status: true,
    project: true,
    candidates: true,
    agencies: false,
    tasks: false,
  });

  const [linkSearch, setLinkSearch] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const daysOpen = differenceInDays(new Date(), new Date(job.created_at));
  const linkedCandidates = useMemo(
    () => (jobCandidateLinks).map((link: any) => link.candidates),
    [jobCandidateLinks]
  );
  const linkedIds = useMemo(() => new Set(linkedCandidates.map((c: any) => c.id)), [linkedCandidates]);
  const pendingTasks = tasks.filter(t => t.status !== 'done');

  // Current project for this job
  const currentProject = projects?.find(p =>
    p.jobs.some((j: any) => j.id === job.id)
  );

  // Candidates available to link
  const availableCandidates = useMemo(() => {
    if (!linkSearch.trim()) return [];
    const q = linkSearch.trim().toLowerCase();
    return (allCandidates || []).filter(
      (c) => !linkedIds.has(c.id) &&
        (c.full_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
    );
  }, [allCandidates, linkedIds, linkSearch]);

  const handleStatusChange = async (newStatus: string) => {
    await updateJob.mutateAsync({ id: job.id, status: newStatus as JobStatus });
  };

  const handleLink = async (candidateId: string) => {
    await linkCandidate.mutateAsync({ candidate_id: candidateId, job_id: job.id });
    setLinkSearch('');
  };

  const handleProjectLink = async (projectId: string | null) => {
    await linkJobToProject.mutateAsync({ jobId: job.id, projectId });
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    await createTask.mutateAsync({
      title: newTaskTitle.trim(),
      priority: 'medium',
      entity_type: 'job',
      entity_id: job.id,
      task_type: 'job',
    });
    setNewTaskTitle('');
  };

  return (
    <div className="flex flex-col h-full border-l bg-card">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b bg-muted/30">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Briefcase className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base truncate">{job.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={cn('text-[10px]', STATUS_COLORS[job.status])}>
              {job.status}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{daysOpen}d open</span>
            <span className="text-[10px] text-muted-foreground">· {linkedCandidates.length} candidates</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/jobs/${job.id}`)} title="Open full view">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {/* Details */}
          <SectionHeader title="Details" expanded={expandedSections.details} onToggle={() => toggleSection('details')} />
          {expandedSections.details && (
            <div className="pb-3 space-y-2 text-sm">
              <DetailRow icon={Building2} label="Client" value={job.client_company} />
              <DetailRow icon={MapPin} label="Country" value={job.country} />
              {job.salary_range && <DetailRow icon={DollarSign} label="Salary" value={job.salary_range} />}
              <DetailRow icon={Clock} label="Created" value={format(new Date(job.created_at), 'MMM d, yyyy')} />
              {job.required_skills && (
                <div>
                  <span className="text-muted-foreground text-xs">Skills</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.required_skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                      <Badge key={skill} variant="secondary" className="text-[9px] px-1.5 py-0">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {job.description && (
                <div>
                  <span className="text-muted-foreground text-xs">Description</span>
                  <p className="text-xs mt-0.5 text-foreground/80 line-clamp-3">{job.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Status */}
          {can('editJobs') && (
            <>
              <SectionHeader title="Status" expanded={expandedSections.status} onToggle={() => toggleSection('status')} />
              {expandedSections.status && (
                <div className="pb-3 space-y-2">
                  <Select value={job.status} onValueChange={handleStatusChange} disabled={updateJob.isPending}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="filled">Filled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* Project */}
          <SectionHeader title="Project" expanded={expandedSections.project} onToggle={() => toggleSection('project')} />
          {expandedSections.project && (
            <div className="pb-3">
              {currentProject ? (
                <div className="space-y-2">
                  <button
                    className="flex items-center gap-2 w-full rounded-md border px-2 py-1.5 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => { onClose(); navigate(`/projects/${currentProject.id}`); }}
                  >
                    <FolderKanban className="h-3 w-3 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-primary truncate">{currentProject.name}</p>
                      <p className="text-[10px] text-muted-foreground">{currentProject.employer_name}</p>
                    </div>
                  </button>
                  <Button
                    variant="outline" size="sm" className="w-full text-xs"
                    onClick={() => handleProjectLink(null)}
                    disabled={linkJobToProject.isPending}
                  >
                    Unlink from Project
                  </Button>
                </div>
              ) : (
                <Select onValueChange={(value) => handleProjectLink(value)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Link to a project…" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Linked Candidates */}
          <SectionHeader title={`Candidates (${linkedCandidates.length})`} expanded={expandedSections.candidates} onToggle={() => toggleSection('candidates')} />
          {expandedSections.candidates && (
            <div className="pb-3 space-y-2">
              {/* Search to link */}
              {can('linkCandidatesToJobs') && (
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search to link…"
                    value={linkSearch}
                    onChange={(e) => setLinkSearch(e.target.value)}
                    className="h-7 text-xs pl-7"
                  />
                </div>
              )}
              {linkSearch.trim() && availableCandidates.length > 0 && (
                <div className="rounded border max-h-32 overflow-y-auto divide-y">
                  {availableCandidates.slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center justify-between px-2 py-1 hover:bg-muted/40 text-xs">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{c.full_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleLink(c.id)} disabled={linkCandidate.isPending}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {/* Linked list */}
              {linkedCandidates.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-1">No candidates linked</p>
              ) : (
                <div className="space-y-1">
                  {linkedCandidates.map((c: any) => (
                    <button
                      key={c.id}
                      className="flex items-center gap-2 w-full rounded-md border px-2 py-1.5 text-left hover:bg-muted/50 transition-colors"
                      onClick={() => { onClose(); navigate(`/candidates/${c.id}`); }}
                    >
                      <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{c.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.email}</p>
                      </div>
                      <Badge variant="secondary" className={cn('text-[9px] px-1 py-0 shrink-0', getStageColor(c.current_stage))}>
                        {getStageLabel(c.current_stage).split(' / ')[0]}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Agencies Invited */}
          <SectionHeader title={`Agencies (${invitations.length})`} expanded={expandedSections.agencies} onToggle={() => toggleSection('agencies')} />
          {expandedSections.agencies && (
            <div className="pb-3">
              {invitations.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-1">No agencies invited</p>
              ) : (
                <div className="space-y-1">
                  {invitations.map((inv: any) => (
                    <div key={inv.id} className="flex items-center gap-2 rounded-md border px-2 py-1.5">
                      <Send className="h-3 w-3 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{inv.agency_profiles?.company_name || 'Agency'}</p>
                        {inv.agency_profiles?.country && (
                          <p className="text-[10px] text-muted-foreground">{inv.agency_profiles.country}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 capitalize shrink-0">{inv.status || 'invited'}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tasks */}
          <SectionHeader title={`Tasks (${pendingTasks.length})`} expanded={expandedSections.tasks} onToggle={() => toggleSection('tasks')} />
          {expandedSections.tasks && (
            <div className="pb-3 space-y-2">
              <div className="flex items-center gap-1">
                <Input
                  placeholder="Add a task..."
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateTask(); }}
                  className="h-7 text-xs flex-1"
                />
                <Button size="icon" className="h-7 w-7 shrink-0" disabled={createTask.isPending || !newTaskTitle.trim()} onClick={handleCreateTask}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {pendingTasks.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-1">No pending tasks</p>
              ) : (
                <div className="space-y-1">
                  {pendingTasks.slice(0, 8).map(task => (
                    <div key={task.id} className="flex items-center gap-1.5 text-[11px] px-1">
                      <button onClick={() => updateTask.mutateAsync({ id: task.id, status: 'done' })} className="shrink-0">
                        <Circle className="h-3 w-3 text-muted-foreground hover:text-primary" />
                      </button>
                      <span className="truncate flex-1">{task.title}</span>
                      {task.priority === 'high' && <Badge variant="destructive" className="text-[8px] px-1 py-0">!</Badge>}
                    </div>
                  ))}
                  {pendingTasks.length > 8 && (
                    <p className="text-[10px] text-muted-foreground text-center">+{pendingTasks.length - 8} more</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => navigate(`/jobs/${job.id}`)}>
          Open Job <ExternalLink className="h-3 w-3" />
        </Button>
        {currentProject && (
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => navigate(`/pipeline?project=${currentProject.id}`)}>
            Pipeline
          </Button>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ title, expanded, onToggle }: { title: string; expanded: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border-b"
    >
      {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      <span className="uppercase tracking-wide">{title}</span>
    </button>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-xs flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}
