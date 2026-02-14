import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  useProjectWorkflowSummary,
  WORKFLOW_PHASES,
  WorkflowPhase,
} from '@/hooks/useProjectWorkflows';
import { FileText, Award, Plane, Home, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const PHASE_ICONS: Record<WorkflowPhase, React.ElementType> = {
  recruitment: FileText,
  documentation: FileText,
  visa: Award,
  arrival: Plane,
  residence_permit: Home,
};

const PHASE_COLORS: Record<WorkflowPhase, string> = {
  recruitment: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  documentation: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
  visa: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  arrival: 'bg-teal-100 text-teal-700 hover:bg-teal-200',
  residence_permit: 'bg-green-100 text-green-700 hover:bg-green-200',
};

interface WorkflowPhaseTrackerProps {
  projectId: string;
}

export default function WorkflowPhaseTracker({ projectId }: WorkflowPhaseTrackerProps) {
  const navigate = useNavigate();
  const { data: summary, isLoading } = useProjectWorkflowSummary(projectId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (summary.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Workflow Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No workflows started yet</p>
            <p className="text-sm">Workflows are created from individual candidate pages</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Workflow Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Overall completion */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Completion</span>
            <span className="font-semibold">
              {summary.completed}/{summary.total} completed ({summary.completedPercentage}%)
            </span>
          </div>
          <Progress value={summary.completedPercentage} className="h-3" />
        </div>

        {/* Per-phase breakdown */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Current Phase Distribution</p>
          <div className="grid gap-2">
            {WORKFLOW_PHASES.map(phase => {
              const phaseData = summary.byPhase[phase.id];
              const Icon = PHASE_ICONS[phase.id];
              const colorClass = PHASE_COLORS[phase.id];

              return (
                <button
                  key={phase.id}
                  onClick={() => navigate(`/projects/${projectId}/workflow/${phase.id}`)}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors text-left',
                    colorClass,
                    'cursor-pointer'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{phase.label}</span>
                  </div>
                  <Badge variant="secondary" className="bg-white/60 text-inherit">
                    {phaseData.count} ({phaseData.percentage}%)
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
