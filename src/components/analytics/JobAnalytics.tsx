/**
 * src/components/analytics/JobAnalytics.tsx
 * 
 * Job market statistics component with clickable pie chart segments
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useJobsByStatus, useJobsByCountry, useTopPositions, useJobStatistics } from '@/hooks/useAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, TrendingUp } from 'lucide-react';

export default function JobAnalytics() {
  const { data: byStatus, isLoading: loadingStatus } = useJobsByStatus();
  const { data: byCountry, isLoading: loadingCountry } = useJobsByCountry();
  const { data: topPositions, isLoading: loadingPositions } = useTopPositions();
  const { data: allJobs } = useJobStatistics();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const STATUS_COLORS: Record<string, string> = {
    open: '#10B981',
    filled: '#3B82F6',
    closed: '#6B7280',
  };

  const STATUS_LABELS: Record<string, string> = {
    open: 'Open',
    filled: 'Filled',
    closed: 'Closed',
  };

  if (loadingStatus || loadingCountry || loadingPositions) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredJobs = selectedStatus
    ? allJobs?.filter((j: any) => j.status === selectedStatus)
    : [];

  return (
    <div className="space-y-6">
      {/* Jobs by Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Jobs by Status
          </CardTitle>
          <CardDescription>Click a segment for details</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={byStatus}
                dataKey="job_count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                label={(entry) => `${entry.job_count}`}
                style={{ cursor: 'pointer' }}
                onClick={(data) => setSelectedStatus(data.status)}
              >
                {byStatus?.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={STATUS_COLORS[entry.status as string] || '#6B7280'} 
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border">
                        <p className="font-semibold capitalize">{data.status} Jobs</p>
                        <p className="text-2xl font-bold mt-1">{data.job_count}</p>
                        <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top In-Demand Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Top In-Demand Positions
          </CardTitle>
          <CardDescription>Most requested job positions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPositions?.map((position: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{position.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {position.total_applications} applications
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {position.job_postings}
                  </p>
                  <p className="text-xs text-muted-foreground">openings</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Jobs by Country */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-600" />
            Jobs by Country
          </CardTitle>
          <CardDescription>Geographic distribution of job openings</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byCountry?.slice(0, 10)} layout="vertical">
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="country" 
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover text-popover-foreground p-3 rounded-lg shadow-lg border">
                        <p className="font-semibold">{data.country}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Total: {data.job_count} jobs
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Open: {data.open_jobs} jobs
                        </p>
                        {data.avg_days_open && (
                          <p className="text-sm text-muted-foreground">
                            Avg open: {data.avg_days_open} days
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="job_count" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Jobs by Status Drilldown Dialog */}
      <Dialog open={selectedStatus !== null} onOpenChange={() => setSelectedStatus(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[selectedStatus || ''] }}
              />
              {STATUS_LABELS[selectedStatus || ''] || selectedStatus} Jobs
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {filteredJobs?.length || 0} jobs with status "{selectedStatus}"
            </p>
            {filteredJobs?.map((job: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{job.title}</p>
                  <p className="text-xs text-muted-foreground">{job.client_company} · {job.country}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="text-xs">{job.total_applications} apps</Badge>
                </div>
              </div>
            ))}
            {(!filteredJobs || filteredJobs.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No jobs found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
