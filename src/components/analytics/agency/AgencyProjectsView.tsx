/**
 * src/components/analytics/agency/AgencyProjectsView.tsx
 * 
 * Project performance for agency (shows ONLY their projects)
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAgencyOwnProjects, useAgencyOwnCandidatesByCountry } from '@/hooks/useAgencyAnalytics';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, Users } from 'lucide-react';

export default function AgencyProjectsView() {
  const { data: projects } = useAgencyOwnProjects();
  const { data: byCountry } = useAgencyOwnCandidatesByCountry();

  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Candidates by Nationality */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              My Candidates by Nationality
            </CardTitle>
            <CardDescription>Distribution of candidate nationalities</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={byCountry?.slice(0, 10)}
                  dataKey="candidate_count"
                  nameKey="country"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.country}: ${entry.candidate_count}`}
                >
                  {byCountry?.slice(0, 10).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover p-3 rounded-lg shadow-lg border border-border">
                          <p className="font-semibold text-foreground">{data.country}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {data.candidate_count} candidates
                          </p>
                          <p className="text-sm text-green-600">
                            {data.placed_count} placed
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              My Top Projects
            </CardTitle>
            <CardDescription>Your best performing projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects?.slice(0, 5).map((project: any, index: number) => (
                <div
                  key={project.project_id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">
                        {project.project_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {project.country} • {project.candidates_submitted} submitted
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge 
                      variant={project.placement_rate >= 50 ? 'default' : 'secondary'}
                      className="whitespace-nowrap"
                    >
                      {project.placement_rate?.toFixed(0)}% placed
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Projects Performance</CardTitle>
          <CardDescription>Detailed performance across all your projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Project</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Country</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Submitted</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Placed</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Placement Rate</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Avg Days</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {projects?.map((project: any) => (
                  <tr key={project.project_id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground">{project.project_name}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {project.country}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {project.candidates_submitted}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold text-green-600">
                        {project.candidates_placed}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${Math.min(project.placement_rate || 0, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {project.placement_rate?.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-muted-foreground">
                        {project.avg_days_to_placement || '-'}d
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
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
