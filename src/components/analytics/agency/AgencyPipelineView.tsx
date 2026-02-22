/**
 * src/components/analytics/agency/AgencyPipelineView.tsx
 * 
 * Pipeline analytics for agency with click-to-drill-down
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { useAgencyPipelineFunnel, useAgencyOwnWorkflowHealth, useAgencyCandidatesTimeline } from '@/hooks/useAgencyAnalytics';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Users } from 'lucide-react';

export default function AgencyPipelineView() {
  const { data: funnelData } = useAgencyPipelineFunnel();
  const { data: workflowHealth } = useAgencyOwnWorkflowHealth();
  const { data: timeline } = useAgencyCandidatesTimeline('month');
  const [selectedPhase, setSelectedPhase] = useState<any>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<any>(null);

  const phaseColors: Record<string, string> = {
    recruitment: '#3B82F6',
    documentation: '#8B5CF6',
    visa: '#EC4899',
    arrival: '#F59E0B',
    residence_permit: '#10B981',
  };

  const chartData = (Array.isArray(funnelData) ? funnelData : []).map((item: any) => ({
    phase: item.phase
      .replace('_', ' ')
      .split(' ')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' '),
    rawPhase: item.phase,
    count: item.count,
    percentage: item.percentage,
    color: phaseColors[item.phase as keyof typeof phaseColors],
  }));

  const timelineData = (Array.isArray(timeline) ? timeline : []).map((item: any) => ({
    date: new Date(item.period).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    candidates: item.candidate_count,
    raw: item,
  }));

  return (
    <div className="space-y-6">
      {/* Funnel Chart */}
      <Card>
        <CardHeader>
          <CardTitle>My Candidate Pipeline</CardTitle>
          <CardDescription>Click a bar for phase details</CardDescription>
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
                      <div className="bg-popover p-3 rounded-lg shadow-lg border border-border">
                        <p className="font-semibold text-foreground">{payload[0].payload.phase}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{payload[0].value}</p>
                        <p className="text-sm text-muted-foreground">{payload[0].payload.percentage}% of total</p>
                        <p className="text-xs text-muted-foreground mt-1">Click for details</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="count"
                radius={[0, 8, 8, 0]}
                barSize={40}
                style={{ cursor: 'pointer' }}
                onClick={(data) => setSelectedPhase(data)}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Health */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Click a metric for details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {workflowHealth?.map((wf: any, index: number) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-foreground">
                      {wf.workflow_type === 'full_immigration' ? 'Full Immigration' : 'No Visa Required'}
                    </p>
                    <Badge variant="outline">{wf.total_workflows} total</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className="bg-green-50 p-4 rounded-lg cursor-pointer hover:ring-2 hover:ring-green-300 transition-all"
                      onClick={() => setSelectedWorkflow({ ...wf, metric: 'completed' })}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <p className="text-xs text-green-600 font-medium">Completed</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{wf.completed_count}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {wf.total_workflows > 0 ? ((wf.completed_count / wf.total_workflows) * 100).toFixed(1) : 0}% success
                      </p>
                    </div>
                    <div
                      className="bg-blue-50 p-4 rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                      onClick={() => setSelectedWorkflow({ ...wf, metric: 'timing' })}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">Avg Time</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{wf.avg_completion_days || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">days to complete</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Candidates Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Candidates Added Over Time
            </CardTitle>
            <CardDescription>Click a point for monthly details</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover p-3 rounded-lg shadow-lg border border-border">
                          <p className="font-semibold text-foreground">{payload[0].payload.date}</p>
                          <p className="text-2xl font-bold text-blue-600 mt-1">{payload[0].value}</p>
                          <p className="text-sm text-muted-foreground">candidates added</p>
                          <p className="text-xs text-muted-foreground mt-1">Click for details</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="candidates"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', r: 4, cursor: 'pointer' }}
                  activeDot={{
                    r: 6,
                    cursor: 'pointer',
                    onClick: (_: any, payload: any) => setSelectedMonth(payload?.payload),
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Phase Drilldown */}
      <Dialog open={selectedPhase !== null} onOpenChange={() => setSelectedPhase(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedPhase?.phase} Phase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-foreground">{selectedPhase?.count}</p>
                <p className="text-xs text-muted-foreground mt-1">Candidates</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-foreground">{selectedPhase?.percentage}%</p>
                <p className="text-xs text-muted-foreground mt-1">Of Total</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workflow Detail Dialog */}
      <Dialog open={selectedWorkflow !== null} onOpenChange={() => setSelectedWorkflow(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkflow?.metric === 'completed' ? 'Completed Workflows' : 'Workflow Timing'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedWorkflow?.workflow_type === 'full_immigration' ? 'Full Immigration' : 'No Visa Required'}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-foreground">{selectedWorkflow?.total_workflows}</p>
                <p className="text-xs text-muted-foreground mt-1">Total</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">{selectedWorkflow?.completed_count}</p>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-foreground">{selectedWorkflow?.avg_completion_days || 0}d</p>
                <p className="text-xs text-muted-foreground mt-1">Avg Days</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-foreground">
                  {selectedWorkflow?.total_workflows > 0 ? ((selectedWorkflow?.completed_count / selectedWorkflow?.total_workflows) * 100).toFixed(0) : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Success Rate</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Month Detail Dialog */}
      <Dialog open={selectedMonth !== null} onOpenChange={() => setSelectedMonth(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedMonth?.date}</DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-4xl font-bold text-blue-600">{selectedMonth?.candidates}</p>
            <p className="text-sm text-muted-foreground mt-2">candidates added this month</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
