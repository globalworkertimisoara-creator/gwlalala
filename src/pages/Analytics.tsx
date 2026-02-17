import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OverviewCards from '@/components/analytics/OverviewCards';
import PipelineAnalytics from '@/components/analytics/PipelineAnalytics';
import ProjectAnalytics from '@/components/analytics/ProjectAnalytics';
import { BarChart3 } from 'lucide-react';

const Analytics = () => {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Analytics</h1>
          </div>
          <p className="text-muted-foreground">
            Comprehensive statistics across your recruitment pipeline
          </p>
        </div>

        <OverviewCards />

        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline">
            <PipelineAnalytics />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Analytics;
