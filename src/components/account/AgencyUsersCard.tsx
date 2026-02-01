import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Users, Building2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface AgencyUser {
  user_id: string;
  created_at: string;
  profile: {
    full_name: string | null;
  } | null;
  agency_profile: {
    id: string;
    company_name: string;
    country: string;
  } | null;
}

export function AgencyUsersCard() {
  const { data: agencyUsers, isLoading } = useQuery({
    queryKey: ['agency-users-org-view'],
    queryFn: async () => {
      // Get all users with agency role
      const { data: agencyRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, created_at')
        .eq('role', 'agency')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;
      if (!agencyRoles || agencyRoles.length === 0) return [];

      const userIds = agencyRoles.map(r => r.user_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      // Get agency profiles (company info)
      const { data: agencies } = await supabase
        .rpc('get_agency_profiles_limited');

      // Match agency profiles to users
      // Agency profiles have user_id linking to the agency user
      const { data: allAgencyProfiles } = await supabase
        .from('agency_profiles')
        .select('id, company_name, country, user_id')
        .in('user_id', userIds);

      return agencyRoles.map(role => ({
        user_id: role.user_id,
        created_at: role.created_at,
        profile: profiles?.find(p => p.user_id === role.user_id) || null,
        agency_profile: allAgencyProfiles?.find(a => a.user_id === role.user_id) || null,
      })) as AgencyUser[];
    },
  });

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle>Agency Users</CardTitle>
        </div>
        <CardDescription>
          User accounts registered as agency staff. {agencyUsers?.length || 0} agency users total.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Agency Company</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agencyUsers?.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(user.profile?.full_name || null)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {user.profile?.full_name || 'Unknown User'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {user.agency_profile ? (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{user.agency_profile.company_name}</p>
                        <p className="text-xs text-muted-foreground">{user.agency_profile.country}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm italic">No agency profile</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(new Date(user.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={user.agency_profile ? 'default' : 'secondary'}
                    className={user.agency_profile ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
                  >
                    {user.agency_profile ? 'Profile Complete' : 'Pending Setup'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {(!agencyUsers || agencyUsers.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No agency users registered yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
