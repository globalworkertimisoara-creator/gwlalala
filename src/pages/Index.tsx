import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentCandidates } from '@/components/dashboard/RecentCandidates';
import { StageChart } from '@/components/dashboard/StageChart';
import { mockCandidates } from '@/data/mockCandidates';
import { Users, UserCheck, Clock, TrendingUp } from 'lucide-react';

const Index = () => {
  const totalCandidates = mockCandidates.length;
  const hiredCount = mockCandidates.filter((c) => c.stage === 'hired').length;
  const inProgress = mockCandidates.filter(
    (c) => !['hired', 'rejected'].includes(c.stage)
  ).length;
  const interviewRate = Math.round(
    (mockCandidates.filter((c) => ['interview', 'technical', 'offer', 'hired'].includes(c.stage)).length / 
    totalCandidates) * 100
  );

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

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Candidates"
            value={totalCandidates}
            subtitle="All time"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Hired"
            value={hiredCount}
            subtitle="This quarter"
            icon={UserCheck}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="In Progress"
            value={inProgress}
            subtitle="Active candidates"
            icon={Clock}
          />
          <StatCard
            title="Interview Rate"
            value={`${interviewRate}%`}
            subtitle="Screening to interview"
            icon={TrendingUp}
            trend={{ value: 5, isPositive: true }}
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <StageChart candidates={mockCandidates} />
          <RecentCandidates candidates={mockCandidates} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
