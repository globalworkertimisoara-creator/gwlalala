import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const STATUS_COLORS: Record<string, string> = {
    active: '#10B981',
    completed: '#3B82F6',
    on_hold: '#F59E0B',
    cancelled: '#EF4444',
  };

  const filteredByStatus = selectedStatus
    ? (projects as any[])?.filter((p: any) => p.status === selectedStatus)
    : [];

  const filteredByCountry = selectedCountry
    ? (projects as any[])?.filter((p: any) => p.country === selectedCountry)
    : [];

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
              onClick={(data) => setSelectedStatus(data.status)}
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
            <div key={project.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded p-1" onClick={() => setSelectedProject(project)}>
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
            <CardDescription>Click a segment for details</CardDescription>
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
                  style={{ cursor: 'pointer' }}
                  onClick={(data) => setSelectedStatus(data.status)}
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
                          <p className="text-xs text-muted-foreground mt-1">Click to view projects</p>
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
            <CardDescription>Click a bar for details</CardDescription>
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
                          <p className="text-xs text-muted-foreground mt-1">Click to view</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="project_count"
                  fill="#3B82F6"
                  radius={[0, 4, 4, 0]}
                  style={{ cursor: 'pointer' }}
                  onClick={(data) => setSelectedCountry(data.country)}
                />
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
          <CardDescription>Click a project for details</CardDescription>
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
                  <tr
                    key={project.id}
                    className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedProject(project)}
                  >
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

      {/* Status Drilldown */}
      <Dialog open={selectedStatus !== null} onOpenChange={() => setSelectedStatus(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[selectedStatus || ''] }} />
              {selectedStatus?.replace('_', ' ')} Projects
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{filteredByStatus?.length || 0} projects</p>
            {filteredByStatus?.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.country} · {p.employer_name}</p>
                </div>
                <Badge variant="secondary">{p.total_candidates} candidates</Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Country Drilldown */}
      <Dialog open={selectedCountry !== null} onOpenChange={() => setSelectedCountry(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Projects in {selectedCountry}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{filteredByCountry?.length || 0} projects</p>
            {filteredByCountry?.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{p.status}</p>
                </div>
                <Badge variant="secondary">{p.total_candidates} candidates</Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Project Detail Dialog */}
      <Dialog open={selectedProject !== null} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProject?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedProject?.employer_name && (
              <p className="text-sm text-muted-foreground">{selectedProject.employer_name}</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-foreground">{selectedProject?.total_candidates}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Candidates</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-foreground">{selectedProject?.completed_candidates}</p>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-foreground">{selectedProject?.fill_percentage?.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Completion</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-foreground">{selectedProject?.agencies_involved}</p>
                <p className="text-xs text-muted-foreground mt-1">Agencies</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Country</span>
              <span className="text-sm font-medium text-foreground">{selectedProject?.country}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={selectedProject?.status === 'active' ? 'default' : 'secondary'}>{selectedProject?.status}</Badge>
            </div>
            {selectedProject?.avg_days_to_completion && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">Avg Days to Complete</span>
                <span className="text-sm font-medium text-foreground">{selectedProject.avg_days_to_completion}d</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
