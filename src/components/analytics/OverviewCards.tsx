import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Briefcase, FileText, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useSystemOverview } from '@/hooks/useAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

export default function OverviewCards() {
  const { data: overview, isLoading } = useSystemOverview();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Candidates',
      value: overview?.total_candidates || 0,
      trend: overview?.candidates_last_30_days || 0,
      trendLabel: 'last 30 days',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trendUp: true,
    },
    {
      title: 'Active Projects',
      value: overview?.active_projects || 0,
      subtitle: `${overview?.open_jobs || 0} open jobs`,
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Completed Workflows',
      value: overview?.completed_workflows || 0,
      subtitle: 'Successfully placed',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Stalled Workflows',
      value: overview?.stalled_workflows || 0,
      subtitle: 'Needs attention',
      icon: AlertTriangle,
      color: overview?.stalled_workflows > 0 ? 'text-red-600' : 'text-muted-foreground',
      bgColor: overview?.stalled_workflows > 0 ? 'bg-red-50' : 'bg-muted/50',
      alert: overview?.stalled_workflows > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className={`hover:shadow-lg transition-shadow ${
              card.alert ? 'border-destructive/30' : ''
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={`rounded-lg p-3 ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>

                {card.trend !== undefined && (
                  <div className="flex items-center gap-1 text-sm">
                    {card.trendUp ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={card.trendUp ? 'text-green-600' : 'text-red-600'}>
                      +{card.trend}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <p className="text-4xl font-bold text-foreground">{card.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground mt-2">{card.subtitle}</p>
                )}
                {card.trendLabel && (
                  <p className="text-xs text-muted-foreground mt-2">{card.trendLabel}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
