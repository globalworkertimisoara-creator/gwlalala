import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAgencyPerformance, useTopAgencies } from '@/hooks/useAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Clock, TrendingUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalyticsDetailItem } from '@/pages/Analytics';

interface AgencyAnalyticsProps {
  onOpenDetail?: (item: AnalyticsDetailItem) => void;
}

export default function AgencyAnalytics({ onOpenDetail }: AgencyAnalyticsProps) {
  const { data: topAgencies, isLoading: loadingTop } = useTopAgencies();
  const { data: allAgencies, isLoading: loadingAll } = useAgencyPerformance();
  const [sortColumn, setSortColumn] = useState<string>('success_rate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  if (loadingTop || loadingAll) {
    return (
      <div className="space-y-6">
        <Card><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
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

  const sortedAgencies = [...(allAgencies || [])].sort((a: any, b: any) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  const handleAgencyClick = (agency: any) => {
    onOpenDetail?.({
      type: 'agency',
      title: agency.agency_name,
      backLabel: 'Agency Analytics',
      data: agency,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-500" /> Top Agencies Leaderboard
          </CardTitle>
          <p className="text-xs text-muted-foreground">Click an agency to view details in the panel</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topAgencies?.map((agency: any, index: number) => (
              <div
                key={agency.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm',
                  index < 3
                    ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/10'
                    : 'border-border bg-muted/30'
                )}
                onClick={() => handleAgencyClick(agency)}
              >
                <div className="flex items-center gap-2.5">
                  <span className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                    index === 0 ? 'bg-amber-100 text-amber-800' :
                    index === 1 ? 'bg-slate-200 text-slate-700' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{agency.agency_name}</p>
                    <p className="text-xs text-muted-foreground">{agency.successful_placements} placements</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-lg font-bold text-green-600">{agency.success_rate?.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Agency Performance Comparison</CardTitle>
          <p className="text-xs text-muted-foreground">Click a row for details</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Agency</th>
                  <th
                    className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('total_candidates_submitted')}
                  >
                    <div className="flex items-center gap-1">Submitted <ArrowUpDown className="h-2.5 w-2.5" /></div>
                  </th>
                  <th
                    className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('successful_placements')}
                  >
                    <div className="flex items-center gap-1">Placed <ArrowUpDown className="h-2.5 w-2.5" /></div>
                  </th>
                  <th
                    className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('success_rate')}
                  >
                    <div className="flex items-center gap-1">Rate <ArrowUpDown className="h-2.5 w-2.5" /></div>
                  </th>
                  <th
                    className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('avg_days_to_placement')}
                  >
                    <div className="flex items-center gap-1">Avg Days <ArrowUpDown className="h-2.5 w-2.5" /></div>
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Projects</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedAgencies.map((agency: any) => (
                  <tr
                    key={agency.id}
                    className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleAgencyClick(agency)}
                  >
                    <td className="py-2.5 px-3">
                      <p className="text-sm font-medium">{agency.agency_name}</p>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {agency.total_candidates_submitted}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-sm font-semibold text-green-600">{agency.successful_placements}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${Math.min(agency.success_rate || 0, 100)}%` }} />
                        </div>
                        <span className="text-xs font-semibold">{agency.success_rate?.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {agency.avg_days_to_placement && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {agency.avg_days_to_placement}d
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs text-muted-foreground">{agency.projects_involved}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={agency.agency_status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {agency.agency_status}
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