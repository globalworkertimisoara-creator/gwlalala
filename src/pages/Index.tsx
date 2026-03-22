import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardTasks } from '@/components/dashboard/DashboardTasks';
import { DashboardAlerts } from '@/components/dashboard/DashboardAlerts';
import { DashboardActivityFeed } from '@/components/dashboard/DashboardActivityFeed';
import { DashboardDetailPanel, type DashboardDetailItem } from '@/components/dashboard/DashboardDetailPanel';
import { DashboardWidgets } from '@/components/dashboard/DashboardWidgets';
import { RecentCandidates } from '@/components/dashboard/RecentCandidates';
import { StageChart } from '@/components/dashboard/StageChart';
import { useCandidates } from '@/hooks/useCandidates';
import { useJobs } from '@/hooks/useJobs';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import {
  Users, UserCheck, Clock, Briefcase, Loader2, Plus, ArrowRight,
  GitBranch, FileText, DollarSign, FolderOpen, ShieldCheck, TrendingUp,
} from 'lucide-react';

// ─── Role descriptions for the welcome subtitle ───
const ROLE_SUBTITLES: Record<string, string> = {
  admin: 'Full system overview',
  recruiter: 'Pipeline & candidate management',
  operations_manager: 'Workflow & document oversight',
  documentation_staff: 'Document processing & compliance',
  documentation_lead: 'Documentation team leadership',
  sales_manager: 'Client relations & contracts',
  sales_agent: 'Sales operations',
  project_manager: 'Project tracking & delivery',
};

// ─── Quick actions per role ───
function getQuickActions(role: string, navigate: (path: string) => void) {
  const actions: Array<{ label: string; icon: any; onClick: () => void; variant?: 'default' | 'outline' }> = [];

  if (['admin', 'recruiter'].includes(role)) {
    actions.push({ label: 'Add Candidate', icon: Plus, onClick: () => navigate('/candidates/new'), variant: 'default' });
    actions.push({ label: 'Pipeline', icon: GitBranch, onClick: () => navigate('/pipeline'), variant: 'outline' });
  }
  if (['admin', 'sales_manager'].includes(role)) {
    actions.push({ label: 'New Contract', icon: FileText, onClick: () => navigate('/contracts/new'), variant: 'default' });
    actions.push({ label: 'Sales Analytics', icon: DollarSign, onClick: () => navigate('/sales-analytics'), variant: 'outline' });
  }
  if (['admin', 'operations_manager'].includes(role)) {
    actions.push({ label: 'Agency Workers', icon: Users, onClick: () => navigate('/agency-workers'), variant: 'outline' });
  }
  if (['admin', 'recruiter', 'operations_manager'].includes(role)) {
    actions.push({ label: 'Projects', icon: FolderOpen, onClick: () => navigate('/projects'), variant: 'outline' });
  }
  if (role === 'documentation_staff' || role === 'documentation_lead') {
    actions.push({ label: 'Candidates', icon: Users, onClick: () => navigate('/candidates'), variant: 'outline' });
    actions.push({ label: 'Pipeline', icon: GitBranch, onClick: () => navigate('/pipeline'), variant: 'outline' });
  }
  if (role === 'sales_agent') {
    actions.push({ label: 'Sales Analytics', icon: DollarSign, onClick: () => navigate('/sales-analytics'), variant: 'outline' });
    actions.push({ label: 'Contracts', icon: FileText, onClick: () => navigate('/contracts'), variant: 'outline' });
  }
  if (role === 'project_manager') {
    actions.push({ label: 'Projects', icon: FolderOpen, onClick: () => navigate('/projects'), variant: 'outline' });
  }

  return actions;
}

// ─── Stat chips per role ───
function getRoleStats(
  role: string,
  candidates: any[],
  jobs: any[],
  can: (p: string) => boolean
) {
  const stats: Array<{
    label: string;
    value: number;
    icon: any;
    iconBg: string;
    iconColor: string;
    clickFilter?: string;
    alert?: boolean;
  }> = [];

  const totalCandidates = candidates.length;
  const placed = candidates.filter(c => c.current_stage === 'placed').length;
  const inProgress = candidates.filter(c => !['placed', 'closed_not_placed'].includes(c.current_stage)).length;
  const openJobs = jobs.length;
  const inVisa = candidates.filter(c => ['visa_processing', 'medical_checks', 'onboarding'].includes(c.current_stage)).length;
  const needsScreening = candidates.filter(c => ['sourced', 'contacted'].includes(c.current_stage)).length;

  // Admin: full overview
  if (role === 'admin') {
    stats.push({ label: 'Total Candidates', value: totalCandidates, icon: Users, iconBg: 'bg-primary/10', iconColor: 'text-primary' });
    stats.push({ label: 'Placed', value: placed, icon: UserCheck, iconBg: 'bg-green-100 dark:bg-green-950/30', iconColor: 'text-green-700' });
    stats.push({ label: 'In Progress', value: inProgress, icon: Clock, iconBg: 'bg-blue-100 dark:bg-blue-950/30', iconColor: 'text-blue-700' });
    stats.push({ label: 'Open Jobs', value: openJobs, icon: Briefcase, iconBg: 'bg-amber-100 dark:bg-amber-950/30', iconColor: 'text-amber-700' });
    if (inVisa > 0) stats.push({ label: 'Visa/Onboarding', value: inVisa, icon: ShieldCheck, iconBg: 'bg-orange-100 dark:bg-orange-950/30', iconColor: 'text-orange-700', alert: true });
  }

  // Recruiter: pipeline-focused
  if (role === 'recruiter') {
    stats.push({ label: 'In Progress', value: inProgress, icon: Clock, iconBg: 'bg-blue-100 dark:bg-blue-950/30', iconColor: 'text-blue-700' });
    stats.push({ label: 'Needs Screening', value: needsScreening, icon: Users, iconBg: 'bg-amber-100 dark:bg-amber-950/30', iconColor: 'text-amber-700', alert: needsScreening > 0 });
    stats.push({ label: 'Placed', value: placed, icon: UserCheck, iconBg: 'bg-green-100 dark:bg-green-950/30', iconColor: 'text-green-700' });
    stats.push({ label: 'Open Jobs', value: openJobs, icon: Briefcase, iconBg: 'bg-primary/10', iconColor: 'text-primary' });
  }

  // Operations Manager: workflow-focused
  if (role === 'operations_manager') {
    stats.push({ label: 'Total Active', value: inProgress, icon: Users, iconBg: 'bg-primary/10', iconColor: 'text-primary' });
    stats.push({ label: 'Visa/Onboarding', value: inVisa, icon: ShieldCheck, iconBg: 'bg-orange-100 dark:bg-orange-950/30', iconColor: 'text-orange-700', alert: inVisa > 0 });
    stats.push({ label: 'Placed', value: placed, icon: UserCheck, iconBg: 'bg-green-100 dark:bg-green-950/30', iconColor: 'text-green-700' });
    stats.push({ label: 'Open Jobs', value: openJobs, icon: Briefcase, iconBg: 'bg-amber-100 dark:bg-amber-950/30', iconColor: 'text-amber-700' });
  }

  // Documentation staff/lead: document-focused
  if (role === 'documentation_staff' || role === 'documentation_lead') {
    const inScreening = candidates.filter(c => ['screening', 'shortlisted', 'submitted_to_client'].includes(c.current_stage)).length;
    stats.push({ label: 'In Screening', value: inScreening, icon: FileText, iconBg: 'bg-purple-100 dark:bg-purple-950/30', iconColor: 'text-purple-700' });
    stats.push({ label: 'Visa/Onboarding', value: inVisa, icon: ShieldCheck, iconBg: 'bg-orange-100 dark:bg-orange-950/30', iconColor: 'text-orange-700' });
    stats.push({ label: 'Total Active', value: inProgress, icon: Users, iconBg: 'bg-primary/10', iconColor: 'text-primary' });
    stats.push({ label: 'Placed', value: placed, icon: UserCheck, iconBg: 'bg-green-100 dark:bg-green-950/30', iconColor: 'text-green-700' });
  }

  // Sales Manager/Agent: revenue-focused
  if (role === 'sales_manager' || role === 'sales_agent') {
    stats.push({ label: 'Open Jobs', value: openJobs, icon: Briefcase, iconBg: 'bg-primary/10', iconColor: 'text-primary' });
    stats.push({ label: 'Total Candidates', value: totalCandidates, icon: Users, iconBg: 'bg-blue-100 dark:bg-blue-950/30', iconColor: 'text-blue-700' });
    stats.push({ label: 'Placed', value: placed, icon: UserCheck, iconBg: 'bg-green-100 dark:bg-green-950/30', iconColor: 'text-green-700' });
    stats.push({ label: 'In Progress', value: inProgress, icon: Clock, iconBg: 'bg-amber-100 dark:bg-amber-950/30', iconColor: 'text-amber-700' });
  }

  // Project Manager: project-focused
  if (role === 'project_manager') {
    stats.push({ label: 'Total Candidates', value: totalCandidates, icon: Users, iconBg: 'bg-primary/10', iconColor: 'text-primary' });
    stats.push({ label: 'In Progress', value: inProgress, icon: Clock, iconBg: 'bg-blue-100 dark:bg-blue-950/30', iconColor: 'text-blue-700' });
    stats.push({ label: 'Open Jobs', value: openJobs, icon: Briefcase, iconBg: 'bg-amber-100 dark:bg-amber-950/30', iconColor: 'text-amber-700' });
  }

  return stats;
}

// ─── Main Dashboard ───
const Index = () => {
  const { data: candidates = [], isLoading: candidatesLoading } = useCandidates();
  const { data: jobs = [], isLoading: jobsLoading } = useJobs({ status: 'open' });
  const { role, can, loading: permLoading } = usePermissions();
  const navigate = useNavigate();
  const [detailItem, setDetailItem] = useState<DashboardDetailItem | null>(null);

  const isLoading = candidatesLoading || jobsLoading || permLoading;

  const stats = useMemo(() => getRoleStats(role, candidates, jobs, can), [role, candidates, jobs, can]);
  const quickActions = useMemo(() => getQuickActions(role, navigate), [role, navigate]);
  const subtitle = ROLE_SUBTITLES[role] || 'Welcome back';

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const hasPanel = detailItem !== null;

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] flex overflow-hidden">
        {/* Main content */}
        <div className={cn('flex-1 overflow-y-auto', hasPanel && 'hidden lg:block lg:w-[65%]')}>
          <div className="p-4 lg:p-6 space-y-5">
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
              {/* Quick actions */}
              {quickActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {quickActions.slice(0, 4).map((action, i) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={i}
                        size="sm"
                        variant={action.variant || 'outline'}
                        className="h-7 text-xs gap-1"
                        onClick={action.onClick}
                      >
                        <Icon className="h-3 w-3" />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Compact stat chips */}
            <div className="flex flex-wrap items-center gap-2">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card cursor-pointer hover:shadow-sm transition-shadow',
                      stat.alert && 'border-orange-200 dark:border-orange-800'
                    )}
                    onClick={() => {
                      // Navigate to relevant filtered page
                      if (stat.label.includes('Job')) navigate('/jobs');
                      else if (stat.label.includes('Placed')) {
                        setDetailItem({
                          type: 'list',
                          title: 'Placed Candidates',
                          backLabel: 'Dashboard',
                          listItems: candidates
                            .filter(c => c.current_stage === 'placed')
                            .slice(0, 20)
                            .map(c => ({
                              id: c.id,
                              title: c.full_name,
                              subtitle: c.nationality || c.email,
                              badge: 'Placed',
                              badgeColor: 'bg-green-100 text-green-800',
                              route: `/candidates/${c.id}`,
                            })),
                        });
                      } else if (stat.label.includes('Progress') || stat.label.includes('Active')) {
                        setDetailItem({
                          type: 'list',
                          title: 'In Progress Candidates',
                          backLabel: 'Dashboard',
                          listItems: candidates
                            .filter(c => !['placed', 'closed_not_placed'].includes(c.current_stage))
                            .slice(0, 20)
                            .map(c => ({
                              id: c.id,
                              title: c.full_name,
                              subtitle: c.current_stage.replace(/_/g, ' '),
                              route: `/candidates/${c.id}`,
                            })),
                        });
                      } else {
                        navigate('/candidates');
                      }
                    }}
                  >
                    <div className={cn('p-1 rounded-md', stat.iconBg)}>
                      <Icon className={cn('h-3 w-3', stat.iconColor)} />
                    </div>
                    <span className="text-lg font-bold leading-none">{stat.value}</span>
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Alerts */}
            <DashboardAlerts onOpenDetail={setDetailItem} />

            {/* Tasks + Activity row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DashboardTasks />
              <DashboardActivityFeed />
            </div>

            {/* Mini widgets */}
            <DashboardWidgets onOpenDetail={setDetailItem} />

            {/* Charts & Recent Activity (role-gated) */}
            {can('viewAllCandidates') && (
              <div className="grid gap-4 lg:grid-cols-2">
                <RecentCandidates
                  candidates={candidates}
                  onCandidateClick={(c) => setDetailItem({
                    type: 'candidate',
                    id: c.id,
                    title: c.full_name,
                    backLabel: 'Recent Activity',
                    data: c,
                  })}
                />
                <StageChart candidates={candidates} />
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {hasPanel && (
          <div className={cn('w-full lg:w-[35%] h-full', !hasPanel && 'hidden')}>
            <DashboardDetailPanel item={detailItem} onClose={() => setDetailItem(null)} />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Index;