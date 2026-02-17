import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useProjectStatistics, useProjectsByStatus, useProjectsByCountry } from '@/hooks/useAnalytics';
import { Badge } from '@/components/ui/badge';
import { Trophy, MapPin, Users, Clock } from 'lucide-react';

interface ProjectAnalyticsProps {
  compact?: boolean;
}

export default function ProjectAnalytics({ compact = false }: ProjectAnalyticsProps) {
  const { data: projects } = useProjectStatistics();
  const { data: byStatus } = useProjectsByStatus();
  const { data: byCountry } = useProjectsByCountry();

  const STATUS_COLORS: Record<string, string> = {
    active: '#10B981',
    completed: '#3B82F6',
    on_hold: '#F59E0B',
    cancelled: '#EF4444',
  };

  if (compact) {
    return (
      <div className="space-y-4">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={byStatus as any[]}
              dataKey="project_count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={60}
              label={(entry) => `${entry.status}: ${entry.project_count}`}
            >
              {(byStatus as any[])?.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#6B7280'} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <div className="space-y-2">
          {(projects as any[])?.slice(0, 3).map((project: any, index: number) => (
            <div key={project.id} className="flex items-center gap-2 text-sm">
              <span className="text-lg">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </span>
              <span className="flex-1 truncate font-medium">{project.name}</span>
              <Badge variant="secondary">{project.fill_percentage?.toFixed(0)}%</Badge>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Projects by Status</CardTitle>
            <CardDescription>Distribution of project statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={byStatus as any[]}
                  dataKey="project_count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.project_count}`}
                  labelLine={false}
                >
                  {(byStatus as any[])?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background p-3 rounded-lg shadow-lg border">
                          <p className="font-semibold capitalize">{data.status}</p>
                          <p className="text-2xl font-bold mt-1">{data.project_count}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend formatter={(value) => String(value).charAt(0).toUpperCase() + String(value).slice(1).replace('_', ' ')} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects by Country</CardTitle>
            <CardDescription>Geographic distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={(byCountry as any[])?.slice(0, 10)} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="country" width={100} tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background p-3 rounded-lg shadow-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <p className="font-semibold">{data.country}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {data.project_count} projects ({data.active_projects} active)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="project_count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Performing Projects
          </CardTitle>
          <CardDescription>Projects sorted by performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Rank</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Project</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Country</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Candidates</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Completion</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Agencies</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Avg Days</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {(projects as any[])?.slice(0, 10).map((project: any, index: number) => (
                  <tr key={project.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-4 text-sm">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground">{project.name}</p>
                      {project.employer_name && (
                        <p className="text-xs text-muted-foreground">{project.employer_name}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {project.country}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="font-semibold text-foreground">{project.completed_candidates}</span>
                      <span className="text-muted-foreground">/{project.total_candidates}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${Math.min(project.fill_percentage || 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {project.fill_percentage?.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {project.agencies_involved}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {project.avg_days_to_completion && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {project.avg_days_to_completion}d
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          project.status === 'active' ? 'default' : project.status === 'completed' ? 'secondary' : 'outline'
                        }
                      >
                        {project.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
