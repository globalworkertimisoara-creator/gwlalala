import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Building2, 
  Trash2, 
  Loader2,
  MapPin,
  Users 
} from 'lucide-react';
import { useAgencyInvitations, useCreateInvitation, useDeleteInvitation } from '@/hooks/useAgencyInvitations';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface InviteAgenciesCardProps {
  jobId: string;
}

export function InviteAgenciesCard({ jobId }: InviteAgenciesCardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: invitations, isLoading: invitationsLoading } = useAgencyInvitations(jobId);
  const createInvitation = useCreateInvitation();
  const deleteInvitation = useDeleteInvitation();

  // Fetch all agencies
  const { data: allAgencies } = useQuery({
    queryKey: ['all-agencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agency_profiles')
        .select('id, company_name, country, contact_person')
        .order('company_name');
      if (error) throw error;
      return data;
    },
  });

  // Already invited agency IDs
  const invitedAgencyIds = useMemo(
    () => new Set(invitations?.map((inv) => inv.agency_id) || []),
    [invitations]
  );

  // Filter agencies by search term and exclude already invited
  const availableAgencies = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    return (allAgencies || []).filter(
      (a) =>
        !invitedAgencyIds.has(a.id) &&
        (a.company_name.toLowerCase().includes(q) ||
          a.country.toLowerCase().includes(q) ||
          a.contact_person.toLowerCase().includes(q))
    );
  }, [allAgencies, invitedAgencyIds, searchTerm]);

  const handleInvite = async (agencyId: string) => {
    await createInvitation.mutateAsync({ agencyId, jobId });
    setSearchTerm('');
  };

  const handleRemove = async (invitationId: string) => {
    await deleteInvitation.mutateAsync(invitationId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Invited Agencies
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agencies to invite…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Search results */}
        {searchTerm.trim() && (
          <div className="rounded-lg border border-border/60 overflow-hidden">
            {availableAgencies.length > 0 ? (
              <div className="max-h-48 overflow-y-auto divide-y divide-border/40">
                {availableAgencies.slice(0, 6).map((agency) => (
                  <div
                    key={agency.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {agency.company_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {agency.country}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary"
                      onClick={() => handleInvite(agency.id)}
                      disabled={createInvitation.isPending}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-3">
                No agencies match your search
              </p>
            )}
          </div>
        )}

        {/* Currently invited agencies */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Currently Invited ({invitations?.length || 0})
          </p>
          
          {invitationsLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : invitations && invitations.length > 0 ? (
            <div className="space-y-2">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border/50 bg-muted/20"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {inv.agency_profiles?.company_name || 'Unknown Agency'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {inv.agency_profiles?.country}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(inv.id)}
                    disabled={deleteInvitation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 border border-dashed rounded-lg">
              <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No agencies invited yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Search above to invite agencies
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
