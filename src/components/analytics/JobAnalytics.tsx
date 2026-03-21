import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useJobsByStatus, useJobsByCountry, useTopPositions, useJobStatistics } from '@/hooks/useAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, TrendingUp } from 'lucide-react';
import type { AnalyticsDetailItem } from '@/pages/Analytics';

interface JobAnalyticsProps {
  onOpenDetail?: (item: AnalyticsDetailItem) => void;
}

const STATUS_COLORS: Record<string, string> = {
  open: '#10B981',
  filled: '#3B82F6',
  closed: '#6B7280',
};

export default function JobAnalytics({ onOpenDetail }: JobAnalyticsProps) {
  const { data: byStatus, isLoading: loadingStatus } = useJobsByStatus();
  const { data: byCountry, isLoading: loadingCountry } = useJobsByCountry();
  const { data: topPositions, isLoading: loadingPositions } = useTopPositions();
  const { data: allJobs } = useJobStatistics();

  if (loadingStatus || loadingCountry || loadingPositions) {
    return (
      <div className="space-y-6">
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
      </div>
    );
  }

  const handleStatusClick = (status: string) => {
    const filtered = (allJobs as any[])?.filter((j: any) => j.status === status) || [];
    if (filtered.length === 1 && filtered[0].id) {
      onOpenDetail?.({
        type: 'job',
        id: filtered[0].id,
        title: filtered[0].title,
        backLabel: 'Job Analytics',
        data: filtered[0],
      });
    } else {
      onOpenDetail?.({
        type: 'phase',
        title: `${status.charAt(0).toUpperCase() + status.slice(1)} Jobs`,
        backLabel: 'Job Analytics',
        data: {
          candidates: filtered.map((j: any) => ({
            full_name: j.title,
            email: `${j.client_company || ''} · ${j.country || ''}`,
            current_stage: `${j.total_applications || 0} applications`,
          })),
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Jobs by Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-blue-600" /> Jobs by Status
          </CardTitle>
          <p className="text-xs text-muted-foreground">Click a segment to view in panel</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={byStatus}
                dataKey="job_count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                label={(entry) => `${entry.job_count}`}
                style={{ cursor: 'pointer' }}
                onClick={(data) => handleStatusClick(data.status)}
              >
                {byStatus?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#6B7280'} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover text-popover-foreground p-2.5 rounded-lg shadow-lg border text-sm">
                        <p className="font-semibold capitalize">{data.status} Jobs</p>
                        <p className="text-lg font-bold mt-0.5">{data.job_count}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Positions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-green-600" /> Top In-Demand Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topPositions?.map((position: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                onClick={() => {
                  onOpenDetail?.({
                    type: 'job',
                    title: position.title,
                    backLabel: 'Top Positions',
                    data: { ...position, client_company: `${position.job_postings} openings`, country: `${position.total_applications} applications`, status: 'open', total_applications: position.total_applications },
                  });
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{position.title}</p>
                    <p className="text-xs text-muted-foreground">{position.total_applications} apps</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{position.job_postings}</p>
                  <p className="text-xs text-muted-foreground">openings</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Jobs by Country */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-purple-600" /> Jobs by Country
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byCountry?.slice(0, 8)} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="country" width={90} tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover text-popover-foreground p-2.5 rounded-lg shadow-lg border text-sm">
                        <p className="font-semibold">{data.country}</p>
                        <p className="text-xs text-muted-foreground">Total: {data.job_count} · Open: {data.open_jobs}</p>
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
    </div>
  );
}