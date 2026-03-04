import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployerNotes, useCreateEmployerNote, useDeleteEmployerNote } from '@/hooks/useEmployerNotes';
import { useLogEmployerAction, useEmployerAuditLog } from '@/hooks/useEmployerAuditLog';
import { useCandidateActivityLog, useLogCandidateActivity } from '@/hooks/useCandidateActivityLog';
import { CandidateActivityLog } from '@/components/candidates/CandidateActivityLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft, Loader2, Mail, Phone, MapPin, Users, CalendarDays, FileText,
  MessageSquare, Download, Clock, Trash2, Send, Activity,
} from 'lucide-react';
import { format } from 'date-fns';

const PHASE_LABELS: Record<string, string> = {
  recruitment: 'Recruitment',
  documentation: 'Documentation',
  visa: 'Visa',
  arrival: 'Arrival',
  residence_permit: 'Residence Permit',
};

const PHASE_ORDER = ['recruitment', 'documentation', 'visa', 'arrival', 'residence_permit'];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function EmployerCandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [noteContent, setNoteContent] = useState('');
  const hasLoggedView = useRef(false);
  const { data: workflowData, isLoading } = useQuery({
    queryKey: ['employer-candidate-detail', id],
    queryFn: async () => {
      const { data: candidate, error: cErr } = await supabase
        .from('candidates')
        .select('id, full_name, email, phone, nationality, current_country')
        .eq('id', id!)
        .single();
      if (cErr) throw cErr;

      const { data: workflows } = await supabase
        .from('candidate_workflow')
        .select('id, current_phase, workflow_type, project_id, projects(name)')
        .eq('candidate_id', id!);

      const { data: interviews } = await supabase
        .from('candidate_interviews')
        .select('id, interview_type, scheduled_date, status, interviewer_name')
        .eq('candidate_id', id!)
        .order('scheduled_date', { ascending: true });

      const { data: offers } = await supabase
        .from('candidate_offers')
        .select('id, position_title, salary_amount, salary_currency, salary_period, status, start_date')
        .eq('candidate_id', id!);

      const { data: documents } = await supabase
        .from('documents')
        .select('id, file_name, doc_type, uploaded_at, storage_path')
        .eq('candidate_id', id!)
        .order('uploaded_at', { ascending: false });

      // Get company_id for notes
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user?.id ?? '')
        .single();

      return {
        candidate,
        workflows: workflows || [],
        interviews: interviews || [],
        offers: offers || [],
        documents: documents || [],
        companyId: profile?.company_id,
      };
    },
    enabled: !!id,
  });

  const { data: notes = [], isLoading: notesLoading } = useEmployerNotes(id);
  const { data: auditLog = [] } = useEmployerAuditLog(id);
  const { data: activityLog = [], isLoading: activityLoading } = useCandidateActivityLog(id);
  const createNote = useCreateEmployerNote();
  const deleteNote = useDeleteEmployerNote();
  const logAction = useLogEmployerAction();
  const logCandidateActivity = useLogCandidateActivity();

  // Log profile view once
  useEffect(() => {
    if (id && workflowData?.companyId && !hasLoggedView.current) {
      hasLoggedView.current = true;
      logAction.mutate({
        candidate_id: id,
        company_id: workflowData.companyId,
        action_type: 'profile_view',
      });
      logCandidateActivity.mutate({
        candidate_id: id,
        event_type: 'profile_view',
        summary: 'Employer viewed candidate profile',
        company_id: workflowData.companyId,
      });
    }
  }, [id, workflowData?.companyId]);

  const handleAddNote = () => {
    if (!noteContent.trim() || !id || !workflowData?.companyId) return;
    createNote.mutate(
      { candidate_id: id, content: noteContent.trim(), company_id: workflowData.companyId },
      {
        onSuccess: () => {
          setNoteContent('');
          logAction.mutate({
            candidate_id: id!,
            company_id: workflowData!.companyId!,
            action_type: 'note_added',
          });
        },
      }
    );
  };

  const handleDownload = async (storagePath: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from('candidate-documents')
      .download(storagePath);
    if (error || !data) return;

    // Log download
    if (id && workflowData?.companyId) {
      logAction.mutate({
        candidate_id: id,
        company_id: workflowData.companyId,
        action_type: 'document_download',
        details: { file_name: fileName },
      });
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  const { workflows, interviews, offers, documents } = workflowData!;

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

      {/* Workflow Timeline */}
      {workflows.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Workflow Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workflows.map((wf: any) => {
              const currentIdx = PHASE_ORDER.indexOf(wf.current_phase);
              return (
                <div key={wf.id} className="mb-4 last:mb-0">
                  <p className="font-medium mb-3">{(wf.projects as any)?.name || 'Project'}</p>
                  <div className="flex items-center gap-1">
                    {PHASE_ORDER.map((phase, idx) => {
                      const isNoVisa = wf.workflow_type === 'no_visa' && phase === 'visa';
                      if (isNoVisa) return null;
                      const isCompleted = idx < currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <div key={phase} className="flex-1 flex flex-col items-center">
                          <div
                            className={`w-full h-2 rounded-full ${
                              isCompleted
                                ? 'bg-primary'
                                : isCurrent
                                ? 'bg-primary/50'
                                : 'bg-muted'
                            }`}
                          />
                          <span className={`text-xs mt-1 ${isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                            {PHASE_LABELS[phase]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
        <Card className="mb-6">
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

      {/* Documents */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {doc.doc_type?.replace('_', ' ')} • {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc.storage_path, doc.file_name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employer Notes (separate from internal notes) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Textarea
              placeholder="Add a note about this candidate..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              onClick={handleAddNote}
              disabled={!noteContent.trim() || createNote.isPending}
              size="icon"
              className="shrink-0 self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {notesLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="p-3 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    {note.created_by === user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteNote.mutate({ id: note.id, candidateId: candidate.id })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {note.author_name && <span className="font-medium text-foreground">{note.author_name}</span>}
                    {note.author_name && ' · '}
                    {format(new Date(note.created_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unified Activity Log */}
      <div className="mt-6">
        <CandidateActivityLog
          entries={activityLog}
          isLoading={activityLoading}
          showActorType={false}
          title="Activity Log"
        />
      </div>
    </div>
  );
}
