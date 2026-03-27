import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OrganizationOverview } from '@/components/account/OrganizationOverview';
import { TeamsDashboard } from '@/components/account/TeamsDashboard';
import { UserManagementCard } from '@/components/settings/UserManagementCard';
import { AgencyListCard } from '@/components/account/AgencyListCard';
import { AgencyUsersCard } from '@/components/account/AgencyUsersCard';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Network, Users, Handshake, Shield, X } from 'lucide-react';

interface OrgDetailItem {
  type: 'user' | 'team' | 'agency' | 'role';
  title: string;
  data?: Record<string, string>;
}

const OrganizationStructure = () => {
  const { isAgency, isAdmin } = useAuth();
  const [detailItem, setDetailItem] = useState<OrgDetailItem | null>(null);

  // Stat counts
  const { data: staffCount = 0 } = useQuery({
    queryKey: ['org-staff-count'],
    queryFn: async () => {
      const { count } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).neq('role', 'agency');
      return count || 0;
    },
  });

  const { data: teamCount = 0 } = useQuery({
    queryKey: ['org-team-count'],
    queryFn: async () => {
      const { count } = await supabase.from('teams').select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: agencyCount = 0 } = useQuery({
    queryKey: ['org-agency-count'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_agency_profiles_limited');
      return data?.length || 0;
    },
  });

  // Agency users shouldn't see internal organization structure
  if (isAgency) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8">
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Organization View</h2>
            <p className="text-muted-foreground">This section is for internal staff only.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] flex overflow-hidden">
        {/* Main Content */}
        <div className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ${detailItem ? 'w-[65%]' : 'w-full'}`}>
          {/* Header with stat chips */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-foreground">Organization</h1>
                <p className="text-xs text-muted-foreground">Structure, roles, teams, and staff</p>
              </div>
            </div>

            {/* Compact stat chips */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-lg font-bold">{staffCount}</span>
                <span className="text-xs text-muted-foreground">Staff</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50">
                <Network className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-lg font-bold">{teamCount}</span>
                <span className="text-xs text-muted-foreground">Teams</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50">
                <Handshake className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-lg font-bold">{agencyCount}</span>
                <span className="text-xs text-muted-foreground">Agencies</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="roles" className="space-y-4">
            <TabsList className="bg-muted/50 h-9">
              <TabsTrigger value="roles" className="gap-1.5 text-xs h-7 px-3">
                <Shield className="h-3.5 w-3.5" /> Roles
              </TabsTrigger>
              <TabsTrigger value="teams" className="gap-1.5 text-xs h-7 px-3">
                <Network className="h-3.5 w-3.5" /> Teams
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="users" className="gap-1.5 text-xs h-7 px-3">
                  <Users className="h-3.5 w-3.5" /> Staff
                </TabsTrigger>
              )}
              <TabsTrigger value="agencies" className="gap-1.5 text-xs h-7 px-3">
                <Handshake className="h-3.5 w-3.5" /> Agencies
              </TabsTrigger>
            </TabsList>

            <TabsContent value="roles" className="space-y-4 mt-0">
              <OrganizationOverview />
            </TabsContent>

            <TabsContent value="teams" className="space-y-4 mt-0">
              <TeamsDashboard />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="users" className="space-y-4 mt-0">
                <UserManagementCard />
              </TabsContent>
            )}

            <TabsContent value="agencies" className="space-y-4 mt-0">
              <AgencyListCard />
              <AgencyUsersCard />
            </TabsContent>
          </Tabs>
        </div>

        {/* Detail panel */}
        {detailItem && (
          <div className="w-[35%] border-l bg-muted/30 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{detailItem.type}</p>
                <h3 className="text-sm font-semibold">{detailItem.title}</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailItem(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {detailItem.data && (
              <div className="space-y-2">
                {Object.entries(detailItem.data).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-medium">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default OrganizationStructure;
