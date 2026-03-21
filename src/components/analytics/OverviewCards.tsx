import { useMemo } from 'react';
import { Users, Briefcase, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import { useSystemOverview } from '@/hooks/useAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function OverviewCards() {
  const { data: overview, isLoading } = useSystemOverview();

  const cards = useMemo(() => [
    {
      label: 'Total Candidates',
      value: overview?.total_candidates || 0,
      sub: overview?.candidates_last_30_days ? `+${overview.candidates_last_30_days} this month` : undefined,
      icon: Users,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      label: 'Active Projects',
      value: overview?.active_projects || 0,
      sub: `${overview?.open_jobs || 0} open jobs`,
      icon: Briefcase,
      iconBg: 'bg-green-100 dark:bg-green-950/30',
      iconColor: 'text-green-700',
    },
    {
      label: 'Completed',
      value: overview?.completed_workflows || 0,
      sub: 'Successfully placed',
      icon: FileText,
      iconBg: 'bg-purple-100 dark:bg-purple-950/30',
      iconColor: 'text-purple-700',
    },
    {
      label: 'Stalled',
      value: overview?.stalled_workflows || 0,
      sub: 'Needs attention',
      icon: AlertTriangle,
      iconBg: overview?.stalled_workflows > 0
        ? 'bg-red-100 dark:bg-red-950/30'
        : 'bg-muted',
      iconColor: overview?.stalled_workflows > 0
        ? 'text-red-700'
        : 'text-muted-foreground',
      alert: overview?.stalled_workflows > 0,
    },
  ], [overview]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-12 flex-1 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg border bg-card',
              card.alert && 'border-red-200 dark:border-red-800'
            )}
          >
            <div className={cn('p-1.5 rounded-md', card.iconBg)}>
              <Icon className={cn('h-3.5 w-3.5', card.iconColor)} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold leading-none">{card.value}</span>
                <span className="text-xs text-muted-foreground">{card.label}</span>
              </div>
              {card.sub && (
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  {card.sub}
                </p>
              )}
            </div>
            {i === 0 && overview?.candidates_last_30_days > 0 && (
              <TrendingUp className="h-3 w-3 text-green-600 ml-auto" />
            )}
          </div>
        );
      })}
    </div>
  );
}