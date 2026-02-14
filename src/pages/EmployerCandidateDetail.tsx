import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft, Loader2, Mail, Phone, MapPin, Users, CalendarDays, FileText,
} from 'lucide-react';
import { format } from 'date-fns';

const PHASE_LABELS: Record<string, string> = {
  recruitment: 'Recruitment',
  documentation: 'Documentation',
  visa: 'Visa',
  arrival: 'Arrival',
  residence_permit: 'Residence Permit',
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function EmployerCandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: workflowData, isLoading } = useQuery({
    queryKey: ['employer-candidate-detail', id],
    queryFn: async () => {
      // Get candidate info
      const { data: candidate, error: cErr } = await supabase
        .from('candidates')
        .select('id, full_name, email, phone, nationality, current_country')
        .eq('id', id!)
        .single();
      if (cErr) throw cErr;

      // Get workflows for this candidate
      const { data: workflows } = await supabase
        .from('candidate_workflow')
        .select('id, current_phase, workflow_type, project_id, projects(name)')
        .eq('candidate_id', id!);

      // Get interviews for this candidate
      const { data: interviews } = await supabase
        .from('candidate_interviews')
        .select('id, interview_type, scheduled_date, status, interviewer_name')
        .eq('candidate_id', id!)
        .order('scheduled_date', { ascending: true });

      // Get offers for this candidate
      const { data: offers } = await supabase
        .from('candidate_offers')
        .select('id, position_title, salary_amount, salary_currency, salary_period, status, start_date')
        .eq('candidate_id', id!);

      return { candidate, workflows: workflows || [], interviews: interviews || [], offers: offers || [] };
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const candidate = workflowData?.candidate;
  if (!candidate) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
        <p className="text-lg font-semibold">Candidate not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/employer')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>
    );
  }

  const { workflows, interviews, offers } = workflowData!;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate('/employer')}>
        <ArrowLeft className="h-4 w-4" /> Back to Employer Portal
      </Button>

      {/* Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {getInitials(candidate.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">{candidate.full_name}</h1>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" /> {candidate.email}
                </span>
                {candidate.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" /> {candidate.phone}
                  </span>
                )}
                {candidate.nationality && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" /> {candidate.nationality}
                  </span>
                )}
                {candidate.current_country && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {candidate.current_country}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Phase */}
      {workflows.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Workflow Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workflows.map((wf: any) => (
              <div key={wf.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{(wf.projects as any)?.name || 'Project'}</p>
                  <p className="text-sm text-muted-foreground capitalize">{wf.workflow_type?.replace('_', ' ')}</p>
                </div>
                <Badge variant="secondary">{PHASE_LABELS[wf.current_phase] || wf.current_phase}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Interviews */}
      {interviews.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Interviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {interviews.map((iv: any) => (
              <div key={iv.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium capitalize">{iv.interview_type} Interview</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(iv.scheduled_date), 'MMM d, yyyy HH:mm')}
                    {iv.interviewer_name && ` • ${iv.interviewer_name}`}
                  </p>
                </div>
                <Badge variant={iv.status === 'completed' ? 'default' : 'secondary'}>
                  {iv.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Offers */}
      {offers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Offers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {offers.map((offer: any) => (
              <div key={offer.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{offer.position_title}</p>
                  <p className="text-sm text-muted-foreground">
                    {offer.salary_amount && `${offer.salary_currency} ${offer.salary_amount}/${offer.salary_period}`}
                    {offer.start_date && ` • Start: ${format(new Date(offer.start_date), 'MMM d, yyyy')}`}
                  </p>
                </div>
                <Badge variant={offer.status === 'accepted' ? 'default' : 'secondary'}>
                  {offer.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
