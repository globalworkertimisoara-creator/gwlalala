import { useState, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TableRow, TableCell } from '@/components/ui/table';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  ChevronRight,
  ChevronDown,
  MapPin,
  Building2,
  Briefcase,
  Clock,
  ExternalLink,
  Users,
  TrendingUp,
} from 'lucide-react';
import { ProjectWithMetrics, getProjectStatusColor, getProjectStatusLabel } from '@/types/project';

interface ProjectTableRowProps {
  project: ProjectWithMetrics;
  agenciesInvolved?: number;
  pendingTasksCount?: number;
}

export const ProjectTableRow = forwardRef<HTMLTableRowElement, ProjectTableRowProps>(function ProjectTableRow({ project, agenciesInvolved, pendingTasksCount }, _ref) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const urgencyDays = project.days_since_contract;
  const isUrgent = urgencyDays !== null && urgencyDays > 60 && project.fill_percentage < 50;

  return (
    <>
      <TableRow
        className="cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Expand indicator */}
        <TableCell className="w-8 pr-0">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </TableCell>

        {/* Project name + employer */}
        <TableCell>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{project.name}</p>
            <p className="text-xs text-muted-foreground truncate">{project.employer_name}</p>
          </div>
        </TableCell>

        {/* Status */}
        <TableCell>
          <Badge className={`${getProjectStatusColor(project.status)} text-xs`}>
            {getProjectStatusLabel(project.status)}
          </Badge>
        </TableCell>

        {/* Location */}
        <TableCell className="hidden md:table-cell">
          <span className="text-sm text-muted-foreground truncate">{project.location}</span>
        </TableCell>

        {/* Sales person */}
        <TableCell className="hidden lg:table-cell">
          <span className="text-sm text-muted-foreground truncate">
            {project.sales_person_name || '—'}
          </span>
        </TableCell>

        {/* Fulfillment */}
        <TableCell>
          <div className="flex items-center gap-2 min-w-[120px]">
            <Progress value={project.fill_percentage} className="h-2 flex-1" />
            <span className="text-xs font-medium tabular-nums w-10 text-right">
              {project.fill_percentage}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {project.filled_positions}/{project.total_positions}
          </p>
        </TableCell>

        {/* Roles */}
        <TableCell className="hidden md:table-cell text-center">
          <span className="text-sm tabular-nums">{project.jobs.length}</span>
        </TableCell>

        {/* Days since contract */}
        <TableCell className="hidden lg:table-cell">
          {urgencyDays !== null ? (
            <span className={`text-sm tabular-nums ${isUrgent ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
              {urgencyDays}d
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </TableCell>

        {/* Pending tasks */}
        <TableCell className="hidden xl:table-cell text-center">
          {pendingTasksCount !== undefined && pendingTasksCount > 0 ? (
            <Badge variant="outline" className="text-xs tabular-nums">
              {pendingTasksCount}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
      </TableRow>

      {/* Expanded inline panel */}
      {expanded && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={9} className="p-0">
            <div className="px-6 py-4 space-y-4">
              {/* Quick stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fill Rate</p>
                    <p className="text-sm font-medium">{project.fill_percentage}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded">
                    <Briefcase className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Active Roles</p>
                    <p className="text-sm font-medium">{project.jobs.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded">
                    <Users className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Agencies</p>
                    <p className="text-sm font-medium">{agenciesInvolved ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Days Active</p>
                    <p className="text-sm font-medium">{project.days_since_contract ?? '—'}</p>
                  </div>
                </div>
              </div>

              {/* Countries */}
              {project.countries_in_contract.length > 0 && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {project.countries_in_contract.map(c => (
                      <Badge key={c} variant="outline" className="text-xs">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Jobs list */}
              {project.jobs.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Roles</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {project.jobs.map(job => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-2 rounded-md border bg-background text-sm"
                      >
                        <span className="truncate font-medium">{job.title}</span>
                        <span className="text-xs text-muted-foreground tabular-nums ml-2 shrink-0">
                          {job.placed_candidates}/{job.total_candidates}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="default"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${project.id}`);
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Open Project
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/pipeline?project=${project.id}`);
                  }}
                >
                  Pipeline
                </Button>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
});
