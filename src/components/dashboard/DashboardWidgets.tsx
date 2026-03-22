import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import {
  GitBranch, FolderOpen, Clock, ArrowRight, TrendingUp, FileText, DollarSign, MapPin,
} from 'lucide-react';
import { useCandidates } from '@/hooks/useCandidates';
import { useExpiringContracts } from '@/hooks/useContracts';
import { usePermissions } from '@/hooks/usePermissions';
import { format, differenceInDays } from 'date-fns';
import { STAGES, getStageLabel, getStageColor, type RecruitmentStage } from '@/types/database';
import { cn } from '@/lib/utils';
import type { DashboardDetailItem } from './DashboardDetailPanel';

interface DashboardWidgetsProps {
  onOpenDetail?: (item: DashboardDetailItem) => void;
}

// Phase definitions matching the pipeline
const PHASES = [
  { name: 'Sourcing', stages: ['sourced', 'contacted', 'application_received'], color: 'hsl(210, 50%, 70%)' },
  { name: 'Evaluation', stages: ['screening', 'shortlisted', 'submitted_to_client', 'client_feedback', 'interview_completed'], color: 'hsl(221, 83%, 53%)' },
  { name: 'Closing', stages: ['offer_extended', 'offer_accepted'], color: 'hsl(45, 80%, 50%)' },
  { name: 'Post-Hire', stages: ['visa_processing', 'medical_checks', 'onboarding', 'placed'], color: 'hsl(142, 71%, 45%)' },
];

export function DashboardWidgets({ onOpenDetail }: DashboardWidgetsProps) {
  const { role, can } = usePermissions();
  const navigate = useNavigate();
  const { data: candidates = [] } = useCandidates();
  const { data: expiringContracts = [] } = useExpiringContracts(30);

  // Mini pipeline funnel data
  const funnelData = useMemo(() => {
    return PHASES.map(phase => {
      const count = candidates.filter(c => phase.stages.includes(c.current_stage)).length;
      return { name: phase.name, count, color: phase.color };
    }).filter(d => d.count > 0);
  }, [candidates]);

  // Recent stage changes (candidates updated in last 7 days)
  const recentChanges = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return candidates
      .filter(c => new Date(c.updated_at) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
  }, [candidates]);

  // Role-based widget selection
  const showPipeline = can('viewAllCandidates');
  const showContracts = can('viewSalesAnalytics') || role === 'admin';
  const showRecentChanges = can('viewAllCandidates');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Mini Pipeline Funnel */}
      {showPipeline && (
        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate('/pipeline')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-primary" />
              Pipeline Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {funnelData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No pipeline data</p>
            ) : (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={funnelData} layout="vertical" margin={{ left: 5, right: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 10 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background p-2 rounded-lg shadow-lg border text-xs">
                            <p className="font-semibold">{data.name}</p>
                            <p>{data.count} candidates</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {funnelData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Stage Changes */}
      {showRecentChanges && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              Recent Changes
              <Badge variant="secondary" className="text-[10px] ml-auto">{recentChanges.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {recentChanges.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No recent changes</p>
            ) : (
              <div className="space-y-1.5">
                {recentChanges.map(c => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onOpenDetail?.({
                      type: 'candidate',
                      id: c.id,
                      title: c.full_name,
                      backLabel: 'Recent Changes',
                      data: c,
                    })}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{c.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {differenceInDays(new Date(), new Date(c.updated_at)) === 0
                          ? 'Today'
                          : `${differenceInDays(new Date(), new Date(c.updated_at))}d ago`}
                      </p>
                    </div>
                    <Badge className={cn('text-[10px] shrink-0', getStageColor(c.current_stage))}>
                      {getStageLabel(c.current_stage).split(' / ')[0]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Expiring Contracts */}
      {showContracts && (
        <Card className={cn(expiringContracts.length > 0 && 'border-orange-200 dark:border-orange-800')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Clock className={cn('h-3.5 w-3.5', expiringContracts.length > 0 ? 'text-orange-600' : 'text-muted-foreground')} />
              Expiring Contracts
              {expiringContracts.length > 0 && (
                <Badge className="text-[10px] ml-auto bg-orange-100 text-orange-800">{expiringContracts.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {expiringContracts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No contracts expiring soon</p>
            ) : (
              <div className="space-y-1.5">
                {expiringContracts.slice(0, 5).map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onOpenDetail?.({
                      type: 'contract',
                      id: c.id,
                      title: c.title,
                      backLabel: 'Expiring Contracts',
                      data: c,
                    })}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{c.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.end_date ? format(new Date(c.end_date), 'MMM d, yyyy') : 'No end date'}
                      </p>
                    </div>
                    {c.total_value && (
                      <span className="text-xs font-semibold text-muted-foreground shrink-0">
                        €{c.total_value.toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* For roles without sales access — show a stage distribution mini card */}
      {!showContracts && showPipeline && (
        <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => navigate('/analytics')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-purple-600" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Active</span>
              <span className="text-sm font-bold">
                {candidates.filter(c => !['placed', 'closed_not_placed'].includes(c.current_stage)).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Placed</span>
              <span className="text-sm font-bold text-green-600">
                {candidates.filter(c => c.current_stage === 'placed').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">In Visa/Onboarding</span>
              <span className="text-sm font-bold text-amber-600">
                {candidates.filter(c => ['visa_processing', 'medical_checks', 'onboarding'].includes(c.current_stage)).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Closed</span>
              <span className="text-sm font-bold text-red-600">
                {candidates.filter(c => c.current_stage === 'closed_not_placed').length}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}