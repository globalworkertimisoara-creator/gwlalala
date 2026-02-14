/**
 * Page for accepting agency team invitations.
 * Accessed via email link with token parameter.
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAcceptInvitation } from '@/hooks/useAgencyTeam';
import { supabase } from '@/integrations/supabase/client';

const ROLE_LABELS: Record<string, string> = {
  agency_owner: 'Owner',
  agency_recruiter: 'Recruiter',
  agency_document_staff: 'Document Staff',
  agency_viewer: 'Viewer',
};

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { mutate: acceptInvitation, isPending: isAccepting } = useAcceptInvitation();

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('agency_team_invitations')
          .select(`
            *,
            agency_profiles(id, company_name, country)
          `)
          .eq('token', token)
          .single();

        if (fetchError || !data) {
          setError('Invitation not found');
          setLoading(false);
          return;
        }

        if ((data as any).status !== 'pending') {
          setError('This invitation has already been used or cancelled');
          setLoading(false);
          return;
        }

        if (new Date((data as any).expires_at) < new Date()) {
          setError('This invitation has expired');
          setLoading(false);
          return;
        }

        setInvitation(data);
      } catch (err) {
        setError('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleAccept = () => {
    if (!token) return;

    acceptInvitation(token, {
      onSuccess: () => {
        setTimeout(() => navigate('/agency'), 2000);
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="mx-auto mb-4 rounded-full bg-destructive/10 p-3 w-fit">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-center">Invalid Invitation</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/agency-auth')}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) return null;

  const agencyName = invitation.agency_profiles?.company_name || 'an agency';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="mx-auto mb-4 rounded-full bg-primary/10 p-3 w-fit">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-center">You're Invited!</CardTitle>
          <CardDescription className="text-center">
            You've been invited to join a team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Agency</span>
                <span className="font-medium text-foreground">{agencyName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium text-foreground">
                  {ROLE_LABELS[invitation.invited_role] || invitation.invited_role}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expires</span>
                <span className="font-medium text-foreground">
                  {new Date(invitation.expires_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Invitation
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By accepting, you'll join {agencyName} and get access to their
            recruitment platform
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
