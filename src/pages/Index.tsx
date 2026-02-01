import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentCandidates } from '@/components/dashboard/RecentCandidates';
import { StageChart } from '@/components/dashboard/StageChart';
import { useCandidates } from '@/hooks/useCandidates';
import { useJobs } from '@/hooks/useJobs';
import { Users, UserCheck, Clock, Briefcase, AlertTriangle, Loader2 } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { data: candidates, isLoading: candidatesLoading } = useCandidates();
  const { data: jobs, isLoading: jobsLoading } = useJobs({ status: 'open' });
  const navigate = useNavigate();

  const isLoading = candidatesLoading || jobsLoading;

  // Calculate stats
  const totalCandidates = candidates?.length || 0;
  const placedCount = candidates?.filter((c) => c.current_stage === 'placed').length || 0;
  const inProgressCount = candidates?.filter(
    (c) => !['placed', 'closed_not_placed'].includes(c.current_stage)
  ).length || 0;
  const openJobsCount = jobs?.length || 0;

  // Candidates in visa/onboarding stages for more than 30 days
  const longWaitCandidates = candidates?.filter((c) => {
    if (!['visa_processing', 'medical_checks', 'onboarding'].includes(c.current_stage)) {
      return false;
    }
    const daysInStage = differenceInDays(new Date(), new Date(c.updated_at));
    return daysInStage > 30;
  }) || [];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your recruitment pipeline and candidate progress
          </p>
        </div>

        {/* Warning Alert */}
        {longWaitCandidates.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
              <div>
                <p className="font-medium text-foreground">
                  {longWaitCandidates.length} candidate{longWaitCandidates.length > 1 ? 's' : ''} in visa/onboarding for 30+ days
                </p>
                <p className="text-sm text-muted-foreground">
                  Review these candidates to ensure timely processing.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Candidates"
            value={totalCandidates}
            subtitle="All time"
            icon={Users}
          />
          <StatCard
            title="Placed"
            value={placedCount}
            subtitle="Successfully placed"
            icon={UserCheck}
          />
          <StatCard
            title="In Progress"
            value={inProgressCount}
            subtitle="Active candidates"
            icon={Clock}
          />
          <StatCard
            title="Open Jobs"
            value={openJobsCount}
            subtitle="Available positions"
            icon={Briefcase}
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <StageChart candidates={candidates || []} />
          <RecentCandidates candidates={candidates || []} onCandidateClick={(c) => navigate(`/candidates/${c.id}`)} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
