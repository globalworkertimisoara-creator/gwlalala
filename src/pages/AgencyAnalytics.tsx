/**
 * src/pages/AgencyAnalytics.tsx
 * 
 * Analytics dashboard for AGENCIES ONLY - shows only their own data
 */

import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AgencyOverviewCards from '@/components/analytics/agency/AgencyOverviewCards';
import AgencyPipelineView from '@/components/analytics/agency/AgencyPipelineView';
import AgencyProjectsView from '@/components/analytics/agency/AgencyProjectsView';
import { BarChart3 } from 'lucide-react';

const AgencyAnalytics = () => {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">My Analytics</h1>
          </div>
          <p className="text-muted-foreground">
            Your performance statistics and insights
          </p>
        </div>

        <AgencyOverviewCards />

        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pipeline">My Pipeline</TabsTrigger>
            <TabsTrigger value="projects">My Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline">
            <AgencyPipelineView />
          </TabsContent>

          <TabsContent value="projects">
            <AgencyProjectsView />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AgencyAnalytics;
