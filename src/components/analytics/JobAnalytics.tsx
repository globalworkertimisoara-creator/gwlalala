/**
 * src/components/analytics/JobAnalytics.tsx
 * 
 * Job market statistics component
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useJobsByStatus, useJobsByCountry, useTopPositions } from '@/hooks/useAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, MapPin, TrendingUp } from 'lucide-react';

export default function JobAnalytics() {
  const { data: byStatus, isLoading: loadingStatus } = useJobsByStatus();
  const { data: byCountry, isLoading: loadingCountry } = useJobsByCountry();
  const { data: topPositions, isLoading: loadingPositions } = useTopPositions();

  const STATUS_COLORS = {
    open: '#10B981',
    filled: '#3B82F6',
    closed: '#6B7280',
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

  return (
    <div className="space-y-6">
      {/* Jobs by Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Jobs by Status
          </CardTitle>
          <CardDescription>Distribution of job openings</CardDescription>
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
              >
                {byStatus?.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#6B7280'} 
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                        <p className="font-semibold capitalize">{data.status} Jobs</p>
                        <p className="text-2xl font-bold mt-1">{data.job_count}</p>
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
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{position.title}</p>
                    <p className="text-xs text-gray-500">
                      {position.total_applications} applications
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {position.job_postings}
                  </p>
                  <p className="text-xs text-gray-500">openings</p>
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
                      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                        <p className="font-semibold">{data.country}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Total: {data.job_count} jobs
                        </p>
                        <p className="text-sm text-gray-600">
                          Open: {data.open_jobs} jobs
                        </p>
                        {data.avg_days_open && (
                          <p className="text-sm text-gray-600">
                            Avg open: {data.avg_days_open} days
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="job_count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}