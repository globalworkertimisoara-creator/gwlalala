/**
 * src/components/analytics/agency/AgencyOverviewCards.tsx
 * 
 * Overview metrics cards for agencies with click-to-drill-down
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Briefcase, CheckCircle, AlertTriangle, TrendingUp, FileText } from 'lucide-react';
import { useAgencyOwnOverview, useAgencyPipelineFunnel, useAgencyOwnProjects, useAgencyOwnWorkflowHealth } from '@/hooks/useAgencyAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface AgencyOverviewCardsProps {
  agencyId?: string;
}

type DrilldownType = 'candidates' | 'projects' | 'placements' | 'documents' | null;

function CandidatesDrilldown({ agencyId }: { agencyId?: string }) {
  const { data: funnel } = useAgencyPipelineFunnel(agencyId);
  const funnelArr = Array.isArray(funnel) ? funnel : [];
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Your candidates by workflow phase</p>
      {funnelArr.map((stage: any, i: number) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <span className="text-sm font-medium capitalize">{stage.phase?.replace(/_/g, ' ')}</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{stage.count}</span>
            <Badge variant="secondary" className="text-xs">{stage.percentage}%</Badge>
          </div>
        </div>
      ))}
      {funnelArr.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
    </div>
  );
}

function ProjectsDrilldown({ agencyId }: { agencyId?: string }) {
  const { data: projects } = useAgencyOwnProjects(agencyId);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Your active projects</p>
      {projects?.slice(0, 10).map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="text-sm font-medium text-foreground">{p.project_name}</p>
            <p className="text-xs text-muted-foreground">{p.country} · {p.status}</p>
          </div>
          <Badge variant="secondary">{p.candidates_submitted} submitted</Badge>
        </div>
      ))}
      {(!projects || projects.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No projects</p>}
    </div>
  );
}

function WorkflowHealthDrilldown({ agencyId }: { agencyId?: string }) {
  const { data: health } = useAgencyOwnWorkflowHealth(agencyId);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Workflow completion details</p>
      {health?.map((wf: any, i: number) => (
        <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-2">
          <p className="text-sm font-medium text-foreground">
            {wf.workflow_type === 'full_immigration' ? 'Full Immigration' : 'No Visa'}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-foreground">{wf.total_workflows}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">{wf.completed_count}</p>
              <p className="text-xs text-muted-foreground">Done</p>
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{wf.avg_completion_days || 0}d</p>
              <p className="text-xs text-muted-foreground">Avg</p>
            </div>
          </div>
        </div>
      ))}
      {(!health || health.length === 0) && <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
    </div>
  );
}

const DRILLDOWN_TITLES: Record<string, string> = {
  candidates: 'My Candidates Breakdown',
  projects: 'My Projects Details',
  placements: 'Placement & Workflow Details',
  documents: 'Documents & Workflow Health',
};

export default function AgencyOverviewCards({ agencyId }: AgencyOverviewCardsProps = {}) {
  const { data: overview, isLoading } = useAgencyOwnOverview(agencyId);
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

  const cards = [
    {
      title: 'My Candidates',
      value: overview?.total_candidates || 0,
      trend: overview?.candidates_last_30_days || 0,
      trendLabel: 'added last 30 days',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trendUp: true,
      drilldownKey: 'candidates' as DrilldownType,
    },
    {
      title: 'My Projects',
      value: overview?.active_projects || 0,
      subtitle: 'Active projects',
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      drilldownKey: 'projects' as DrilldownType,
    },
    {
      title: 'Successful Placements',
      value: overview?.completed_placements || 0,
      subtitle: 'Candidates placed',
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      drilldownKey: 'placements' as DrilldownType,
    },
    {
      title: 'Pending Documents',
      value: overview?.pending_documents || 0,
      subtitle: overview?.stalled_workflows > 0 ? `${overview.stalled_workflows} stalled workflows` : 'All on track',
      icon: overview?.stalled_workflows > 0 ? AlertTriangle : FileText,
      color: overview?.stalled_workflows > 0 ? 'text-red-600' : 'text-muted-foreground',
      bgColor: overview?.stalled_workflows > 0 ? 'bg-red-50' : 'bg-muted/50',
      alert: overview?.stalled_workflows > 0,
      drilldownKey: 'documents' as DrilldownType,
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
                card.alert ? 'border-red-200' : ''
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
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">+{card.trend}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-4xl font-bold text-foreground">{card.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
                  {card.subtitle && (
                    <p className="text-xs text-muted-foreground/70 mt-2">{card.subtitle}</p>
                  )}
                  {card.trendLabel && (
                    <p className="text-xs text-muted-foreground/70 mt-2">{card.trendLabel}</p>
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
          {drilldown === 'candidates' && <CandidatesDrilldown agencyId={agencyId} />}
          {drilldown === 'projects' && <ProjectsDrilldown agencyId={agencyId} />}
          {drilldown === 'placements' && <WorkflowHealthDrilldown agencyId={agencyId} />}
          {drilldown === 'documents' && <WorkflowHealthDrilldown agencyId={agencyId} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
