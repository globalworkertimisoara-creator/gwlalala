import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useProjectStatistics, useProjectsByStatus, useProjectsByCountry } from '@/hooks/useAnalytics';
import { Badge } from '@/components/ui/badge';
import { Trophy, MapPin, Users, Clock } from 'lucide-react';
import type { AnalyticsDetailItem } from '@/pages/Analytics';

interface ProjectAnalyticsProps {
  compact?: boolean;
  onOpenDetail?: (item: AnalyticsDetailItem) => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',
  completed: '#3B82F6',
  on_hold: '#F59E0B',
  cancelled: '#EF4444',
};

export default function ProjectAnalytics({ compact = false, onOpenDetail }: ProjectAnalyticsProps) {
  const { data: projects } = useProjectStatistics();
  const { data: byStatus } = useProjectsByStatus();
  const { data: byCountry } = useProjectsByCountry();

  const handleProjectClick = (project: any) => {
    onOpenDetail?.({
      type: 'project',
      id: project.id,
      title: project.name,
      backLabel: 'Project Analytics',
      data: project,
    });
  };

  const handleStatusClick = (status: string) => {
    const filtered = (projects as any[])?.filter((p: any) => p.status === status) || [];
    if (filtered.length === 1) {
      handleProjectClick(filtered[0]);
    } else {
      onOpenDetail?.({
        type: 'phase',
        title: `${status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')} Projects`,
        backLabel: 'Project Analytics',
        data: {
          candidates: filtered.map((p: any) => ({
            full_name: p.name,
            email: `${p.country} · ${p.employer_name || ''}`,
            current_stage: `${p.total_candidates} candidates`,
          })),
        },
      });
    }
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
              style={{ cursor: 'pointer' }}
              onClick={(data) => handleStatusClick(data.status)}
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
            <div
              key={project.id}
              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded p-1"
              onClick={() => handleProjectClick(project)}
            >
              <span className="text-sm">{index === 0 ? '#1' : index === 1 ? '#2' : '#3'}</span>
              <span className="flex-1 truncate font-medium">{project.name}</span>
              <Badge variant="secondary" className="text-xs">{project.fill_percentage?.toFixed(0)}%</Badge>
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Projects by Status</CardTitle>
            <p className="text-xs text-muted-foreground">Click a segment for details</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={byStatus as any[]}
                  dataKey="project_count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={(entry) => `${entry.project_count}`}
                  labelLine={false}
                  style={{ cursor: 'pointer' }}
                  onClick={(data) => handleStatusClick(data.status)}
                >
                  {(byStatus as any[])?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background p-2.5 rounded-lg shadow-lg border text-sm">
                          <p className="font-semibold capitalize">{data.status}</p>
                          <p className="text-lg font-bold mt-0.5">{data.project_count}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend formatter={(v) => String(v).charAt(0).toUpperCase() + String(v).slice(1).replace('_', ' ')} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Projects by Country</CardTitle>
            <p className="text-xs text-muted-foreground">Click a bar for details</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={(byCountry as any[])?.slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="country" width={90} tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background p-2.5 rounded-lg shadow-lg border text-sm">
                          <div className="flex items-center gap-1.5 mb-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <p className="font-semibold">{data.country}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {data.project_count} projects ({data.active_projects} active)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="project_count"
                  fill="hsl(var(--chart-1))"
                  radius={[0, 4, 4, 0]}
                  style={{ cursor: 'pointer' }}
                  onClick={(data) => {
                    const filtered = (projects as any[])?.filter((p: any) => p.country === data.country) || [];
                    if (filtered.length === 1) {
                      handleProjectClick(filtered[0]);
                    } else {
                      onOpenDetail?.({
                        type: 'phase',
                        title: `Projects in ${data.country}`,
                        backLabel: 'By Country',
                        data: {
                          candidates: filtered.map((p: any) => ({
                            full_name: p.name,
                            email: `${p.status} · ${p.employer_name || ''}`,
                            current_stage: `${p.total_candidates} candidates`,
                          })),
                        },
                      });
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-500" /> Top Performing Projects
          </CardTitle>
          <p className="text-xs text-muted-foreground">Click a project for details in the panel</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">#</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Project</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Country</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Candidates</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Completion</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Agencies</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Avg Days</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {(projects as any[])?.slice(0, 10).map((project: any, index: number) => (
                  <tr
                    key={project.id}
                    className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleProjectClick(project)}
                  >
                    <td className="py-2.5 px-3 text-sm font-medium text-muted-foreground">{index + 1}</td>
                    <td className="py-2.5 px-3">
                      <p className="text-sm font-medium">{project.name}</p>
                      {project.employer_name && (
                        <p className="text-xs text-muted-foreground">{project.employer_name}</p>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {project.country}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-sm">
                      <span className="font-semibold">{project.completed_candidates}</span>
                      <span className="text-muted-foreground">/{project.total_candidates}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${Math.min(project.fill_percentage || 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold">{project.fill_percentage?.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {project.agencies_involved}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {project.avg_days_to_completion && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {project.avg_days_to_completion}d
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={project.status === 'active' ? 'default' : project.status === 'completed' ? 'secondary' : 'outline'}
                        className="text-xs"
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