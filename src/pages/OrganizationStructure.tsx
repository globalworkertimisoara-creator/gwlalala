import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationOverview } from '@/components/account/OrganizationOverview';
import { TeamsDashboard } from '@/components/account/TeamsDashboard';
import { UserManagementCard } from '@/components/settings/UserManagementCard';
import { AgencyListCard } from '@/components/account/AgencyListCard';
import { AgencyWorkersCard } from '@/components/account/AgencyWorkersCard';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Network, Users, Handshake } from 'lucide-react';

const OrganizationStructure = () => {
  const { isAgency, isAdmin } = useAuth();

  // Agency users shouldn't see internal organization structure
  if (isAgency) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8">
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Organization View</h2>
            <p className="text-muted-foreground">
              This section is for internal staff only.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Organization Structure</h1>
          <p className="text-muted-foreground">
            View organization structure, roles, teams, and staff
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="roles" className="space-y-6">
          <TabsList>
            <TabsTrigger value="roles" className="gap-2">
              <Building2 className="h-4 w-4" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Network className="h-4 w-4" />
              Teams
            </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Staff
            </TabsTrigger>
          )}
            <TabsTrigger value="agencies" className="gap-2">
              <Handshake className="h-4 w-4" />
              Agencies
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-6">
            <OrganizationOverview />
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            <TeamsDashboard />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users" className="space-y-6">
              <UserManagementCard />
            </TabsContent>
          )}

          <TabsContent value="agencies" className="space-y-6">
            <AgencyListCard />
            <AgencyWorkersCard />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default OrganizationStructure;
