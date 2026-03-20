import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, ExternalLink, ChevronDown, ChevronRight, MapPin, Building2, Briefcase, Clock, Users, TrendingUp, CheckSquare } from 'lucide-react';
import { ProjectWithMetrics, getProjectStatusColor, getProjectStatusLabel, ProjectStatus } from '@/types/project';
import { useTasks } from '@/hooks/useTasks';
import { useState } from 'react';

interface ProjectDetailPanelProps {
  project: ProjectWithMetrics;
  onClose: () => void;
}

export function ProjectDetailPanel({ project, onClose }: ProjectDetailPanelProps) {
  const navigate = useNavigate();
  const { data: tasks = [] } = useTasks({ entity_type: 'project', entity_id: project.id });
  const pendingTasks = tasks.filter(t => t.status !== 'done');

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    fulfillment: true,
    jobs: true,
    tasks: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-full border-l bg-card">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b bg-muted/30">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base truncate pr-2">{project.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{project.employer_name}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={`text-[10px] ${getProjectStatusColor(project.status)}`}>
              {getProjectStatusLabel(project.status)}
            </Badge>
            {project.days_since_contract !== null && (
              <span className="text-[10px] text-muted-foreground">{project.days_since_contract}d active</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/projects/${project.id}`)} title="Open full view">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Fulfillment bar */}
      <div className="px-4 py-2 border-b bg-muted/10">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Fulfillment</span>
          <span>{project.fill_percentage}% ({project.filled_positions}/{project.total_positions})</span>
        </div>
        <Progress value={project.fill_percentage} className="h-1.5" />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {/* Details */}
          <SectionHeader title="Details" expanded={expandedSections.details} onToggle={() => toggleSection('details')} />
          {expandedSections.details && (
            <div className="pb-3 space-y-2 text-sm">
              <DetailRow icon={Building2} label="Employer" value={project.employer_name} />
              <DetailRow icon={MapPin} label="Location" value={project.location} />
              {project.sales_person_name && (
                <DetailRow icon={Users} label="Sales" value={project.sales_person_name} />
              )}
              <DetailRow icon={Briefcase} label="Roles" value={`${project.jobs.length}`} />
              <DetailRow icon={TrendingUp} label="Fill Rate" value={`${project.fill_percentage}%`} />
              {project.days_since_contract !== null && (
                <DetailRow icon={Clock} label="Days Active" value={`${project.days_since_contract}d`} />
              )}
              {project.countries_in_contract.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-xs">Countries</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.countries_in_contract.map(c => (
                      <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {project.notes && (
                <div>
                  <span className="text-muted-foreground text-xs">Notes</span>
                  <p className="text-xs mt-0.5 text-foreground/80">{project.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Jobs / Roles */}
          <SectionHeader title={`Roles (${project.jobs.length})`} expanded={expandedSections.jobs} onToggle={() => toggleSection('jobs')} />
          {expandedSections.jobs && (
            <div className="pb-3">
              {project.jobs.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-1">No roles</p>
              ) : (
                <div className="space-y-1">
                  {project.jobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between rounded-md border px-2 py-1.5">
                      <span className="text-xs font-medium truncate flex-1">{job.title}</span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-[10px] text-muted-foreground">{job.placed_candidates}/{job.total_candidates}</span>
                        <Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="text-[9px] px-1 py-0">
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tasks */}
          <SectionHeader title={`Tasks (${pendingTasks.length})`} expanded={expandedSections.tasks} onToggle={() => toggleSection('tasks')} />
          {expandedSections.tasks && (
            <div className="pb-3">
              {pendingTasks.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-1">No pending tasks</p>
              ) : (
                <div className="space-y-1">
                  {pendingTasks.slice(0, 8).map(task => (
                    <div key={task.id} className="flex items-center gap-1.5 text-[11px] px-1">
                      <CheckSquare className="h-3 w-3 text-muted-foreground shrink-0" />
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
        <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => navigate(`/projects/${project.id}`)}>
          Open Project <ExternalLink className="h-3 w-3" />
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => navigate(`/pipeline?project=${project.id}`)}>
          Pipeline
        </Button>
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
