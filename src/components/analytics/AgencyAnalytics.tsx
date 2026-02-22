/**
 * src/components/analytics/AgencyAnalytics.tsx
 * 
 * Agency performance metrics and leaderboard with drill-down
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAgencyPerformance, useTopAgencies } from '@/hooks/useAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Clock, TrendingUp, ArrowUpDown } from 'lucide-react';

export default function AgencyAnalytics() {
  const { data: topAgencies, isLoading: loadingTop } = useTopAgencies();
  const { data: allAgencies, isLoading: loadingAll } = useAgencyPerformance();
  const [sortColumn, setSortColumn] = useState<string>('success_rate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedAgency, setSelectedAgency] = useState<any>(null);

  if (loadingTop || loadingAll) {
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

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedAgencies = [...(allAgencies || [])].sort((a, b) => {
    const aValue = a[sortColumn as keyof typeof a];
    const bValue = b[sortColumn as keyof typeof b];
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Top Agencies Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Agencies Leaderboard
          </CardTitle>
          <CardDescription>Click an agency for detailed metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topAgencies?.map((agency: any, index: number) => {
              const medals = ['🥇', '🥈', '🥉'];
              const medal = medals[index];
              return (
                <div
                  key={agency.id}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    index < 3
                      ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
                      : 'border-border bg-muted/30'
                  }`}
                  onClick={() => setSelectedAgency(agency)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{medal || `#${index + 1}`}</span>
                    <div>
                      <p className="font-semibold text-foreground">{agency.agency_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {agency.successful_placements} successful placements
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        {agency.success_rate?.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">success rate</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Agency Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agency Performance Comparison</CardTitle>
          <CardDescription>Click a row for agency details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Agency Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground cursor-pointer hover:bg-muted/50" onClick={() => handleSort('total_candidates_submitted')}>
                    <div className="flex items-center gap-1">Submitted <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground cursor-pointer hover:bg-muted/50" onClick={() => handleSort('successful_placements')}>
                    <div className="flex items-center gap-1">Placed <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground cursor-pointer hover:bg-muted/50" onClick={() => handleSort('success_rate')}>
                    <div className="flex items-center gap-1">Success Rate <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground cursor-pointer hover:bg-muted/50" onClick={() => handleSort('avg_days_to_placement')}>
                    <div className="flex items-center gap-1">Avg Days <ArrowUpDown className="h-3 w-3" /></div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Projects</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedAgencies?.map((agency: any) => (
                  <tr
                    key={agency.id}
                    className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedAgency(agency)}
                  >
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground">{agency.agency_name}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {agency.total_candidates_submitted}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold text-green-600">{agency.successful_placements}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${Math.min(agency.success_rate || 0, 100)}%` }} />
                          </div>
                          <span className="text-sm font-semibold text-foreground">{agency.success_rate?.toFixed(1)}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {agency.avg_days_to_placement && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {agency.avg_days_to_placement}d
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-muted-foreground">{agency.projects_involved}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={agency.agency_status === 'active' ? 'default' : 'secondary'}>{agency.agency_status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Agency Detail Dialog */}
      <Dialog open={selectedAgency !== null} onOpenChange={() => setSelectedAgency(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedAgency?.agency_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-foreground">{selectedAgency?.total_candidates_submitted}</p>
                <p className="text-xs text-muted-foreground mt-1">Candidates Submitted</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">{selectedAgency?.successful_placements}</p>
                <p className="text-xs text-muted-foreground mt-1">Successful Placements</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-foreground">{selectedAgency?.success_rate?.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">Success Rate</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-foreground">{selectedAgency?.avg_days_to_placement || '-'}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg Days to Place</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Projects Involved</span>
              <span className="text-sm font-medium text-foreground">{selectedAgency?.projects_involved}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={selectedAgency?.agency_status === 'active' ? 'default' : 'secondary'}>
                {selectedAgency?.agency_status}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Country</span>
              <span className="text-sm font-medium text-foreground">{selectedAgency?.country}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
