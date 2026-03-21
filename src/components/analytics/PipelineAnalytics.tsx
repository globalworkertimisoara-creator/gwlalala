import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { usePipelineFunnel, useConversionRates, useWorkflowCompletion } from '@/hooks/useAnalytics';
import { TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { AnalyticsDetailItem } from '@/pages/Analytics';

// Aligned with the new pipeline phase groups
const PHASE_CONFIG: Record<string, { label: string; color: string; stages: string[] }> = {
  sourcing: {
    label: 'Sourcing',
    color: '#3B82F6',
    stages: ['sourced', 'contacted', 'application_received'],
  },
  evaluation: {
    label: 'Evaluation',
    color: '#8B5CF6',
    stages: ['screening', 'shortlisted', 'submitted_to_client', 'client_feedback', 'interview_completed'],
  },
  closing: {
    label: 'Closing',
    color: '#F59E0B',
    stages: ['offer_extended', 'offer_accepted'],
  },
  post_hire: {
    label: 'Post-Hire',
    color: '#EC4899',
    stages: ['visa_processing', 'medical_checks', 'onboarding', 'placed'],
  },
  closed: {
    label: 'Closed',
    color: '#6B7280',
    stages: ['closed_not_placed'],
  },
};

// Legacy phase name mapping to new phases
const LEGACY_PHASE_MAP: Record<string, string> = {
  recruitment: 'sourcing',
  documentation: 'evaluation',
  visa: 'post_hire',
  arrival: 'post_hire',
  residence_permit: 'closing',
};

function useCandidatesByPhase(phase: string | null) {
  return useQuery({
    queryKey: ['analytics', 'candidates-by-phase', phase],
    queryFn: async () => {
      if (!phase) return [];
      const config = PHASE_CONFIG[phase];
      if (config) {
        const { data, error } = await supabase
          .from('candidate_workflow')
          .select('candidate_id, current_phase, pipeline_stage, candidates!candidate_workflow_candidate_id_fkey(full_name, email, current_stage)')
          .in('pipeline_stage', config.stages as any);
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from('candidate_workflow')
        .select('candidate_id, current_phase, candidates!candidate_workflow_candidate_id_fkey(full_name, email, current_stage)')
        .eq('current_phase', phase as any);
      if (error) throw error;
      return data;
    },
    enabled: !!phase,
  });
}

interface PipelineAnalyticsProps {
  compact?: boolean;
  onOpenDetail?: (item: AnalyticsDetailItem) => void;
}

export default function PipelineAnalytics({ compact = false, onOpenDetail }: PipelineAnalyticsProps) {
  const { data: funnelData } = usePipelineFunnel();
  const { data: conversionRates } = useConversionRates();
  const { data: workflowCompletion } = useWorkflowCompletion();
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  const { data: phaseCandidates } = useCandidatesByPhase(selectedPhase);

  const chartData = Object.entries(PHASE_CONFIG)
    .filter(([key]) => key !== 'closed')
    .map(([key, config]) => {
      const matchingFunnelItems = (funnelData as any[])?.filter((item: any) => {
        const mapped = LEGACY_PHASE_MAP[item.phase] || item.phase;
        return mapped === key || item.phase === key;
      }) || [];
      const count = matchingFunnelItems.reduce((sum: number, item: any) => sum + (item.count || item.candidate_count || 0), 0);
      const totalCount = (funnelData as any[])?.reduce((sum: number, item: any) => sum + (item.count || item.candidate_count || 0), 0) || 1;
      return {
        phase: config.label,
        rawPhase: key,
        count,
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
        color: config.color,
      };
    });

  const handleBarClick = (data: any) => {
    if (data?.rawPhase) {
      setSelectedPhase(data.rawPhase);
    }
  };

  React.useEffect(() => {
    if (selectedPhase && phaseCandidates && onOpenDetail) {
      const config = PHASE_CONFIG[selectedPhase];
      onOpenDetail({
        type: 'phase',
        title: `${config?.label || selectedPhase} Phase`,
        backLabel: 'Pipeline Analytics',
        data: { candidates: phaseCandidates },
      });
      setSelectedPhase(null);
    }
  }, [phaseCandidates, selectedPhase]);

  if (compact) {
    return (
      <div className="space-y-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="phase" width={100} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} style={{ cursor: 'pointer' }} onClick={handleBarClick}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xl font-bold">{(workflowCompletion as any)?.[0]?.completed_count || 0}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-xl font-bold">{(workflowCompletion as any)?.[0]?.avg_completion_days || 0}d</p>
            <p className="text-xs text-muted-foreground">Avg Time</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Candidate Flow by Phase</CardTitle>
          <p className="text-xs text-muted-foreground">Click a bar to view candidates — aligned with pipeline phases</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="phase" width={90} tick={{ fontSize: 12 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background p-2.5 rounded-lg shadow-lg border text-sm">
                        <p className="font-semibold">{payload[0].payload.phase}</p>
                        <p className="text-lg font-bold mt-0.5">{payload[0].value}</p>
                        <p className="text-xs text-muted-foreground">{payload[0].payload.percentage}% of total</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={32} style={{ cursor: 'pointer' }} onClick={handleBarClick}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Phase Conversion Rates</CardTitle>
            <p className="text-xs text-muted-foreground">Click for details</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(conversionRates as any[])?.map((rate: any, index: number) => {
                const isGood = rate.conversion_rate >= 70;
                const isWarning = rate.conversion_rate >= 60 && rate.conversion_rate < 70;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                    onClick={() => onOpenDetail?.({
                      type: 'conversion',
                      title: `${rate.from_phase} → ${rate.to_phase}`,
                      backLabel: 'Conversion Rate',
                      data: rate,
                    })}
                  >
                    <div className="flex-1">
                      <p className="text-xs font-medium">
                        {rate.from_phase} → {rate.to_phase}
                      </p>
                      <div className="mt-1.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isGood ? 'bg-green-500' : isWarning ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${rate.conversion_rate}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-3 flex items-center gap-1.5">
                      {isGood ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <Badge
                        variant={isGood ? 'default' : isWarning ? 'secondary' : 'destructive'}
                        className="text-xs font-semibold"
                      >
                        {rate.conversion_rate}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Workflow Health</CardTitle>
            <p className="text-xs text-muted-foreground">Click a metric for details</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {(workflowCompletion as any[])?.map((wf: any, index: number) => (
                <div key={index}>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {wf.workflow_type === 'full_immigration' ? 'Full Immigration' : 'No Visa'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg cursor-pointer hover:ring-2 hover:ring-green-300 transition-all"
                      onClick={() => onOpenDetail?.({
                        type: 'workflow',
                        title: 'Completed Workflows',
                        backLabel: 'Workflow Health',
                        data: { ...wf, metric: 'completed' },
                      })}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <p className="text-[10px] text-green-600 font-medium">Completed</p>
                      </div>
                      <p className="text-xl font-bold">{wf.completed_count}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {wf.total_workflows > 0 ? ((wf.completed_count / wf.total_workflows) * 100).toFixed(1) : 0}% rate
                      </p>
                    </div>
                    <div
                      className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                      onClick={() => onOpenDetail?.({
                        type: 'workflow',
                        title: 'Workflow Timing',
                        backLabel: 'Workflow Health',
                        data: { ...wf, metric: 'timing' },
                      })}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="h-3 w-3 text-blue-600" />
                        <p className="text-[10px] text-blue-600 font-medium">Avg Time</p>
                      </div>
                      <p className="text-xl font-bold">{wf.avg_completion_days || '-'}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">days to complete</p>
                    </div>
                  </div>
                  {wf.stalled_count > 0 && (
                    <div
                      className="mt-2 p-2.5 bg-red-50 dark:bg-red-950/20 border border-destructive/30 rounded-lg cursor-pointer hover:ring-2 hover:ring-red-300 transition-all"
                      onClick={() => onOpenDetail?.({
                        type: 'workflow',
                        title: 'Stalled Workflows',
                        backLabel: 'Workflow Health',
                        data: { ...wf, metric: 'stalled' },
                      })}
                    >
                      <p className="text-xs text-destructive">
                        <strong>{wf.stalled_count}</strong> workflows stalled (&gt;30 days)
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}