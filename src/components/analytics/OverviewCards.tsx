import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Briefcase, FileText, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useSystemOverview, usePipelineFunnel, useProjectStatistics, useWorkflowCompletion } from '@/hooks/useAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

type DrilldownType = 'candidates' | 'projects' | 'completed' | 'stalled' | null;

function CandidatesDrilldown() {
  const { data: funnel, isLoading } = usePipelineFunnel();
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Candidates by recruitment stage</p>
      {funnel?.map((stage: any, i: number) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <span className="text-sm font-medium capitalize">{stage.stage?.replace(/_/g, ' ')}</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{stage.candidate_count}</span>
            {stage.conversion_rate != null && (
              <Badge variant="secondary" className="text-xs">{stage.conversion_rate}%</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectsDrilldown() {
  const { data: projects, isLoading } = useProjectStatistics();
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">All projects with candidate counts</p>
      {projects?.slice(0, 10).map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm font-medium">{p.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{p.status}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{p.total_candidates}</p>
            <p className="text-xs text-muted-foreground">candidates</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkflowDrilldown({ type }: { type: 'completed' | 'stalled' }) {
  const { data: workflows, isLoading } = useWorkflowCompletion();
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  const filtered = workflows?.filter((w: any) =>
    type === 'completed' ? w.current_phase === 'completed' : w.current_phase !== 'completed'
  );
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {type === 'completed' ? 'Successfully completed workflows' : 'Workflows needing attention'}
      </p>
      {filtered?.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">No workflows found</p>
      )}
      {filtered?.slice(0, 10).map((w: any, i: number) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm font-medium">{w.candidate_name || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground capitalize">{w.current_phase?.replace(/_/g, ' ')}</p>
          </div>
          <Badge variant={type === 'completed' ? 'default' : 'destructive'} className="text-xs">
            {w.current_phase?.replace(/_/g, ' ')}
          </Badge>
        </div>
      ))}
    </div>
  );
}

const DRILLDOWN_TITLES: Record<string, string> = {
  candidates: 'Total Candidates Breakdown',
  projects: 'Active Projects Details',
  completed: 'Completed Workflows',
  stalled: 'Stalled Workflows',
};

export default function OverviewCards() {
  const { data: overview, isLoading } = useSystemOverview();
  const [drilldown, setDrilldown] = useState<DrilldownType>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards: Array<{
    title: string;
    value: number;
    trend?: number;
    trendLabel?: string;
    subtitle?: string;
    icon: any;
    color: string;
    bgColor: string;
    trendUp?: boolean;
    alert?: boolean;
    drilldownKey: DrilldownType;
  }> = [
    {
      title: 'Total Candidates',
      value: overview?.total_candidates || 0,
      trend: overview?.candidates_last_30_days || 0,
      trendLabel: 'last 30 days',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trendUp: true,
      drilldownKey: 'candidates',
    },
    {
      title: 'Active Projects',
      value: overview?.active_projects || 0,
      subtitle: `${overview?.open_jobs || 0} open jobs`,
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      drilldownKey: 'projects',
    },
    {
      title: 'Completed Workflows',
      value: overview?.completed_workflows || 0,
      subtitle: 'Successfully placed',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      drilldownKey: 'completed',
    },
    {
      title: 'Stalled Workflows',
      value: overview?.stalled_workflows || 0,
      subtitle: 'Needs attention',
      icon: AlertTriangle,
      color: overview?.stalled_workflows > 0 ? 'text-red-600' : 'text-muted-foreground',
      bgColor: overview?.stalled_workflows > 0 ? 'bg-red-50' : 'bg-muted/50',
      alert: overview?.stalled_workflows > 0,
      drilldownKey: 'stalled',
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={index}
              className={`hover:shadow-lg transition-shadow cursor-pointer ${
                card.alert ? 'border-destructive/30' : ''
              }`}
              onClick={() => setDrilldown(card.drilldownKey)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`rounded-lg p-3 ${card.bgColor}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  {card.trend !== undefined && (
                    <div className="flex items-center gap-1 text-sm">
                      {card.trendUp ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={card.trendUp ? 'text-green-600' : 'text-red-600'}>
                        +{card.trend}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-4xl font-bold text-foreground">{card.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
                  {card.subtitle && (
                    <p className="text-xs text-muted-foreground mt-2">{card.subtitle}</p>
                  )}
                  {card.trendLabel && (
                    <p className="text-xs text-muted-foreground mt-2">{card.trendLabel}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={drilldown !== null} onOpenChange={() => setDrilldown(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{drilldown ? DRILLDOWN_TITLES[drilldown] : ''}</DialogTitle>
          </DialogHeader>
          {drilldown === 'candidates' && <CandidatesDrilldown />}
          {drilldown === 'projects' && <ProjectsDrilldown />}
          {drilldown === 'completed' && <WorkflowDrilldown type="completed" />}
          {drilldown === 'stalled' && <WorkflowDrilldown type="stalled" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
