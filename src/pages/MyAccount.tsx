import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationOverview } from '@/components/account/OrganizationOverview';
import { TeamsDashboard } from '@/components/account/TeamsDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Users, Network } from 'lucide-react';

const MyAccount = () => {
  const { isAgency } = useAuth();

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
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">My Account</h1>
          <p className="text-muted-foreground">
            View organization structure, roles, and teams
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="organization" className="space-y-6">
          <TabsList>
            <TabsTrigger value="organization" className="gap-2">
              <Building2 className="h-4 w-4" />
              Organization
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Network className="h-4 w-4" />
              Teams
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organization" className="space-y-6">
            <OrganizationOverview />
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            <TeamsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MyAccount;
