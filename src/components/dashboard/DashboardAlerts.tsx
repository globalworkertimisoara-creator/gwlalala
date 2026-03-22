import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, FileText, DollarSign, Users, Briefcase, ShieldAlert } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useCandidates } from '@/hooks/useCandidates';
import { useExpiringContracts } from '@/hooks/useContracts';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DashboardDetailItem } from './DashboardDetailPanel';

interface DashboardAlertsProps {
  onOpenDetail?: (item: DashboardDetailItem) => void;
}

export function DashboardAlerts({ onOpenDetail }: DashboardAlertsProps) {
  const { role, can } = usePermissions();
  const navigate = useNavigate();
  const { data: candidates = [] } = useCandidates();
  const { data: expiringContracts = [] } = useExpiringContracts(30);

  const alerts = useMemo(() => {
    const items: Array<{
      id: string;
      icon: any;
      iconColor: string;
      bgColor: string;
      borderColor: string;
      message: string;
      count?: number;
      onClick?: () => void;
    }> = [];

    // Recruiter / Admin / Ops: candidates stuck in visa/onboarding 30+ days
    if (can('viewAllCandidates')) {
      const stuck = candidates.filter(c => {
        if (!['visa_processing', 'medical_checks', 'onboarding'].includes(c.current_stage)) return false;
        return differenceInDays(new Date(), new Date(c.updated_at)) > 30;
      });
      if (stuck.length > 0) {
        items.push({
          id: 'stuck-candidates',
          icon: AlertTriangle,
          iconColor: 'text-amber-700',
          bgColor: 'bg-amber-50 dark:bg-amber-950/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
          message: `${stuck.length} candidate${stuck.length > 1 ? 's' : ''} in visa/onboarding 30+ days`,
          count: stuck.length,
          onClick: () => onOpenDetail?.({
            type: 'list',
            title: 'Stuck Candidates (30+ days)',
            backLabel: 'Alert',
            listItems: stuck.map(c => ({
              id: c.id,
              title: c.full_name,
              subtitle: `${c.current_stage.replace(/_/g, ' ')} · ${differenceInDays(new Date(), new Date(c.updated_at))} days`,
              badge: c.current_stage.replace(/_/g, ' '),
              badgeColor: 'bg-amber-100 text-amber-800',
              route: `/candidates/${c.id}`,
            })),
          }),
        });
      }

      // Candidates needing screening (sourced stage)
      const needsScreening = candidates.filter(c => c.current_stage === 'sourced' || c.current_stage === 'contacted');
      if (needsScreening.length > 0 && (role === 'recruiter' || role === 'admin')) {
        items.push({
          id: 'needs-screening',
          icon: Users,
          iconColor: 'text-blue-700',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          message: `${needsScreening.length} candidate${needsScreening.length > 1 ? 's' : ''} need screening`,
          count: needsScreening.length,
          onClick: () => navigate('/candidates'),
        });
      }
    }

    // Documentation roles: check for doc-related alerts
    if (role === 'documentation_staff' || role === 'documentation_lead' || role === 'operations_manager' || role === 'admin') {
      const pendingDocs = candidates.filter(c =>
        ['screening', 'shortlisted', 'submitted_to_client'].includes(c.current_stage)
      );
      if (pendingDocs.length > 0) {
        items.push({
          id: 'pending-docs',
          icon: FileText,
          iconColor: 'text-purple-700',
          bgColor: 'bg-purple-50 dark:bg-purple-950/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          message: `${pendingDocs.length} candidate${pendingDocs.length > 1 ? 's' : ''} may need document review`,
          count: pendingDocs.length,
          onClick: () => navigate('/candidates'),
        });
      }
    }

    // Sales roles: expiring contracts
    if (can('viewSalesAnalytics') || role === 'admin') {
      if (expiringContracts.length > 0) {
        items.push({
          id: 'expiring-contracts',
          icon: DollarSign,
          iconColor: 'text-orange-700',
          bgColor: 'bg-orange-50 dark:bg-orange-950/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          message: `${expiringContracts.length} contract${expiringContracts.length > 1 ? 's' : ''} expiring within 30 days`,
          count: expiringContracts.length,
          onClick: () => navigate('/contracts'),
        });
      }
    }

    return items;
  }, [role, candidates, expiringContracts, can, navigate, onOpenDetail]);

  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {alerts.map(alert => {
        const Icon = alert.icon;
        return (
          <div
            key={alert.id}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors hover:shadow-sm',
              alert.bgColor,
              alert.borderColor
            )}
            onClick={alert.onClick}
          >
            <Icon className={cn('h-3.5 w-3.5 shrink-0', alert.iconColor)} />
            <span className="text-xs font-medium">{alert.message}</span>
          </div>
        );
      })}
    </div>
  );
}