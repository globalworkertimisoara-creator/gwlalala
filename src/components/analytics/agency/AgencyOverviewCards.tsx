/**
 * src/components/analytics/agency/AgencyOverviewCards.tsx
 * 
 * Overview metrics cards for agencies (shows ONLY their own data)
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Briefcase, CheckCircle, AlertTriangle, TrendingUp, FileText } from 'lucide-react';
import { useAgencyOwnOverview } from '@/hooks/useAgencyAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

export default function AgencyOverviewCards() {
  const { data: overview, isLoading } = useAgencyOwnOverview();

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
      title: 'My Candidates',
      value: overview?.total_candidates || 0,
      trend: overview?.candidates_last_30_days || 0,
      trendLabel: 'added last 30 days',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trendUp: true,
    },
    {
      title: 'My Projects',
      value: overview?.active_projects || 0,
      subtitle: 'Active projects',
      icon: Briefcase,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Successful Placements',
      value: overview?.completed_placements || 0,
      subtitle: 'Candidates placed',
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Pending Documents',
      value: overview?.pending_documents || 0,
      subtitle: overview?.stalled_workflows > 0 ? `${overview.stalled_workflows} stalled workflows` : 'All on track',
      icon: overview?.stalled_workflows > 0 ? AlertTriangle : FileText,
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
              card.alert ? 'border-red-200' : ''
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className={`rounded-lg p-3 ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>

                {card.trend !== undefined && (
                  <div className="flex items-center gap-1 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">
                      +{card.trend}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <p className="text-4xl font-bold text-foreground">{card.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
                {card.subtitle && (
                  <p className="text-xs text-muted-foreground/70 mt-2">{card.subtitle}</p>
                )}
                {card.trendLabel && (
                  <p className="text-xs text-muted-foreground/70 mt-2">{card.trendLabel}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
