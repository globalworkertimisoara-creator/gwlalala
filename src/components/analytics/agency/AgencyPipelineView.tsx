/**
 * src/components/analytics/agency/AgencyPipelineView.tsx
 * 
 * Pipeline analytics for agency (shows ONLY their own candidates)
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { useAgencyPipelineFunnel, useAgencyOwnWorkflowHealth, useAgencyCandidatesTimeline } from '@/hooks/useAgencyAnalytics';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Users } from 'lucide-react';

export default function AgencyPipelineView() {
  const { data: funnelData } = useAgencyPipelineFunnel();
  const { data: workflowHealth } = useAgencyOwnWorkflowHealth();
  const { data: timeline } = useAgencyCandidatesTimeline('month');

  const phaseColors = {
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
    count: item.count,
    percentage: item.percentage,
    color: phaseColors[item.phase as keyof typeof phaseColors],
  }));

  const timelineData = (Array.isArray(timeline) ? timeline : []).map((item: any) => ({
    date: new Date(item.period).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    candidates: item.candidate_count,
  }));

  return (
    <div className="space-y-6">
      {/* Funnel Chart */}
      <Card>
        <CardHeader>
          <CardTitle>My Candidate Pipeline</CardTitle>
          <CardDescription>Your candidates at each workflow phase</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="phase" 
                width={150}
                tick={{ fontSize: 14 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover p-3 rounded-lg shadow-lg border border-border">
                        <p className="font-semibold text-foreground">{payload[0].payload.phase}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {payload[0].value}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payload[0].payload.percentage}% of total
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={40}>
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
            <CardDescription>Your workflow completion statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {workflowHealth?.map((wf: any, index: number) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-foreground">
                      {wf.workflow_type === 'full_immigration'
                        ? 'Full Immigration'
                        : 'No Visa Required'}
                    </p>
                    <Badge variant="outline">{wf.total_workflows} total</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <p className="text-xs text-green-600 font-medium">Completed</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {wf.completed_count}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((wf.completed_count / wf.total_workflows) * 100).toFixed(1)}% success
                      </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <p className="text-xs text-blue-600 font-medium">Avg Time</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {wf.avg_completion_days || 0}
                      </p>
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
            <CardDescription>Monthly trend of candidates submitted</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover p-3 rounded-lg shadow-lg border border-border">
                          <p className="font-semibold text-foreground">{payload[0].payload.date}</p>
                          <p className="text-2xl font-bold text-blue-600 mt-1">
                            {payload[0].value}
                          </p>
                          <p className="text-sm text-muted-foreground">candidates added</p>
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
                  dot={{ fill: '#3B82F6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
