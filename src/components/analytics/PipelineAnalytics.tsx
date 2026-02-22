import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { usePipelineFunnel, useConversionRates, useWorkflowCompletion } from '@/hooks/useAnalytics';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useCandidatesByPhase(phase: string | null) {
  return useQuery({
    queryKey: ['analytics', 'candidates-by-phase', phase],
    queryFn: async () => {
      if (!phase) return [];
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
}

export default function PipelineAnalytics({ compact = false }: PipelineAnalyticsProps) {
  const { data: funnelData } = usePipelineFunnel();
  const { data: conversionRates } = useConversionRates();
  const { data: workflowCompletion } = useWorkflowCompletion();
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [selectedConversion, setSelectedConversion] = useState<any>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);

  const { data: phaseCandidates } = useCandidatesByPhase(selectedPhase);

  const phaseColors: Record<string, string> = {
    recruitment: '#3B82F6',
    documentation: '#8B5CF6',
    visa: '#EC4899',
    arrival: '#F59E0B',
    residence_permit: '#10B981',
  };

  const chartData = funnelData?.map((item: any) => ({
    phase: item.phase
      .replace('_', ' ')
      .split(' ')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    rawPhase: item.phase,
    count: item.count,
    percentage: item.percentage,
    color: phaseColors[item.phase] || '#6B7280',
  })) || [];

  const handleBarClick = (data: any) => {
    if (data?.rawPhase) setSelectedPhase(data.rawPhase);
  };

  if (compact) {
    return (
      <div className="space-y-4">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical">
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="phase" width={100} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} style={{ cursor: 'pointer' }} onClick={handleBarClick}>
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-foreground">
              {(workflowCompletion as any)?.[0]?.completed_count || 0}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-foreground">
              {(workflowCompletion as any)?.[0]?.avg_completion_days || 0}d
            </p>
            <p className="text-xs text-muted-foreground">Avg Time</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Candidate Flow Funnel</CardTitle>
          <CardDescription>
            Click a bar to see candidates in that phase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis type="category" dataKey="phase" width={150} tick={{ fontSize: 14 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background p-3 rounded-lg shadow-lg border">
                        <p className="font-semibold text-foreground">{payload[0].payload.phase}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{payload[0].value}</p>
                        <p className="text-sm text-muted-foreground">{payload[0].payload.percentage}% of total</p>
                        <p className="text-xs text-muted-foreground mt-1">Click to view candidates</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={40} style={{ cursor: 'pointer' }} onClick={handleBarClick}>
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Phase Conversion Rates</CardTitle>
            <CardDescription>Click a conversion to see details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(conversionRates as any[])?.map((rate: any, index: number) => {
                const isGood = rate.conversion_rate >= 70;
                const isWarning = rate.conversion_rate >= 60 && rate.conversion_rate < 70;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors"
                    onClick={() => setSelectedConversion(rate)}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {rate.from_phase} → {rate.to_phase}
                      </p>
                      <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isGood ? 'bg-green-500' : isWarning ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${rate.conversion_rate}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      {isGood ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <Badge variant={isGood ? 'default' : isWarning ? 'secondary' : 'destructive'} className="text-sm font-semibold">
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
          <CardHeader>
            <CardTitle>Workflow Health</CardTitle>
            <CardDescription>Click a metric for more details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(workflowCompletion as any[])?.map((wf: any, index: number) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      {wf.workflow_type === 'full_immigration' ? 'Full Immigration Process' : 'No Visa Required'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg cursor-pointer hover:ring-2 hover:ring-green-300 transition-all"
                      onClick={() => setSelectedWorkflow({ ...wf, metric: 'completed' })}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <p className="text-xs text-green-600 font-medium">Completed</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{wf.completed_count}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {wf.total_workflows > 0 ? ((wf.completed_count / wf.total_workflows) * 100).toFixed(1) : 0}% success rate
                      </p>
                    </div>
                    <div
                      className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                      onClick={() => setSelectedWorkflow({ ...wf, metric: 'timing' })}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">Avg Time</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{wf.avg_completion_days || '-'}</p>
                      <p className="text-xs text-muted-foreground mt-1">days to complete</p>
                    </div>
                  </div>
                  {wf.stalled_count > 0 && (
                    <div
                      className="mt-3 p-3 bg-red-50 dark:bg-red-950/20 border border-destructive/30 rounded-lg cursor-pointer hover:ring-2 hover:ring-red-300 transition-all"
                      onClick={() => setSelectedWorkflow({ ...wf, metric: 'stalled' })}
                    >
                      <p className="text-sm text-destructive">
                        ⚠️ <strong>{wf.stalled_count}</strong> workflows stalled (no activity &gt;30 days)
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase Drilldown Dialog */}
      <Dialog open={selectedPhase !== null} onOpenChange={() => setSelectedPhase(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {selectedPhase?.replace('_', ' ')} Phase — Candidates
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{phaseCandidates?.length || 0} candidates in this phase</p>
            {phaseCandidates?.map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{(c.candidates as any)?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{(c.candidates as any)?.email}</p>
                </div>
                <Badge variant="secondary" className="text-xs capitalize">
                  {(c.candidates as any)?.current_stage?.replace(/_/g, ' ')}
                </Badge>
              </div>
            ))}
            {(!phaseCandidates || phaseCandidates.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No candidates found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Conversion Rate Dialog */}
      <Dialog open={selectedConversion !== null} onOpenChange={() => setSelectedConversion(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conversion: {selectedConversion?.from_phase} → {selectedConversion?.to_phase}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-foreground">{selectedConversion?.from_count}</p>
                <p className="text-xs text-muted-foreground mt-1">In {selectedConversion?.from_phase}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-foreground">{selectedConversion?.to_count}</p>
                <p className="text-xs text-muted-foreground mt-1">Moved to {selectedConversion?.to_phase}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-4xl font-bold text-foreground">{selectedConversion?.conversion_rate}%</p>
              <p className="text-sm text-muted-foreground mt-1">Conversion Rate</p>
              <div className="mt-3 h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${selectedConversion?.conversion_rate >= 70 ? 'bg-green-500' : selectedConversion?.conversion_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${selectedConversion?.conversion_rate || 0}%` }}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workflow Health Dialog */}
      <Dialog open={selectedWorkflow !== null} onOpenChange={() => setSelectedWorkflow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkflow?.metric === 'completed' && 'Completed Workflows'}
              {selectedWorkflow?.metric === 'timing' && 'Workflow Timing'}
              {selectedWorkflow?.metric === 'stalled' && 'Stalled Workflows'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedWorkflow?.workflow_type === 'full_immigration' ? 'Full Immigration Process' : 'No Visa Required'}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-foreground">{selectedWorkflow?.total_workflows}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Workflows</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-foreground">{selectedWorkflow?.completed_count}</p>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-foreground">{selectedWorkflow?.avg_completion_days || '-'}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg Days</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-destructive">{selectedWorkflow?.stalled_count || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Stalled</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
