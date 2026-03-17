import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2,
  MapPin,
  Users,
  Clock,
  Calendar,
  Route,
  Briefcase,
  FileText,
  GitBranchPlus,
  CheckSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import { PROJECT_STATUS_CONFIG, WORKFLOW_TYPE_CONFIG, WorkflowType } from '@/types/project';
import type { ProjectWithMetrics } from '@/types/project';

interface ProjectOverviewTabProps {
  project: ProjectWithMetrics;
  onUpdateProject: (updates: any) => void;
  pipelineCount: number;
  contractCount: number;
  taskCount: number;
  onTabChange: (tab: string) => void;
}

export function ProjectOverviewTab({
  project,
  onUpdateProject,
  pipelineCount,
  contractCount,
  taskCount,
  onTabChange,
}: ProjectOverviewTabProps) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left Column - Project Details */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Employer</p>
                <p className="font-medium">{project.employer_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-medium">{project.location}</p>
              </div>
            </div>
            {project.sales_person_name && (
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Sales Person</p>
                  <p className="font-medium">{project.sales_person_name}</p>
                </div>
              </div>
            )}
            {project.contract_signed_at && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Contract Signed</p>
                  <p className="font-medium">
                    {format(new Date(project.contract_signed_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}
            {project.days_since_contract !== null && (
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Time Since Contract</p>
                  <p className="font-medium">{project.days_since_contract} days</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Route className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Workflow Type</p>
                <Select
                  value={project.default_workflow_type || 'full_immigration'}
                  onValueChange={(v) => onUpdateProject({ id: project.id, default_workflow_type: v })}
                >
                  <SelectTrigger className="h-8 w-[180px] mt-0.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(WORKFLOW_TYPE_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contract Countries</CardTitle>
          </CardHeader>
          <CardContent>
            {project.countries_in_contract.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {project.countries_in_contract.map(country => (
                  <Badge key={country} variant="outline">
                    {country}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No countries specified</p>
            )}
          </CardContent>
        </Card>

        {project.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{project.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column - Summary Cards */}
      <div className="lg:col-span-2 space-y-6">
        {/* Fulfillment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contract Fulfillment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{project.fill_percentage}%</span>
              <span className="text-muted-foreground">
                {project.filled_positions} of {project.total_positions} positions filled
              </span>
            </div>
            <Progress value={project.fill_percentage} className="h-3" />
          </CardContent>
        </Card>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onTabChange('business')}
            className="text-left"
          >
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-xs">Jobs</span>
                </div>
                <p className="text-2xl font-bold">{project.jobs.length}</p>
              </CardContent>
            </Card>
          </button>

          <button
            onClick={() => onTabChange('people')}
            className="text-left"
          >
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <GitBranchPlus className="h-4 w-4" />
                  <span className="text-xs">Pipeline</span>
                </div>
                <p className="text-2xl font-bold">{pipelineCount}</p>
              </CardContent>
            </Card>
          </button>

          <button
            onClick={() => onTabChange('business')}
            className="text-left"
          >
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FileText className="h-4 w-4" />
                  <span className="text-xs">Contracts</span>
                </div>
                <p className="text-2xl font-bold">{contractCount}</p>
              </CardContent>
            </Card>
          </button>

          <button
            onClick={() => onTabChange('activity')}
            className="text-left"
          >
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CheckSquare className="h-4 w-4" />
                  <span className="text-xs">Tasks</span>
                </div>
                <p className="text-2xl font-bold">{taskCount}</p>
              </CardContent>
            </Card>
          </button>
        </div>
      </div>
    </div>
  );
}
