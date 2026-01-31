import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCandidate, useUpdateCandidateStage } from '@/hooks/useCandidates';
import { useNotes, useCreateNote, useDeleteNote } from '@/hooks/useNotes';
import { useDocuments, useUploadDocument, useDeleteDocument } from '@/hooks/useDocuments';
import { useStageHistory } from '@/hooks/useStageHistory';
import { STAGES, getStageLabel, getStageColor, RecruitmentStage, DocType } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  FileText,
  Trash2,
  Plus,
  Clock,
  Upload,
  MessageSquare,
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

// ─── Constants ───────────────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<DocType, string> = {
  resume: 'Resume',
  passport: 'Passport',
  visa: 'Visa',
  contract: 'Contract',
  other: 'Other',
};

const DOC_TYPE_COLORS: Record<DocType, string> = {
  resume: 'bg-blue-100 text-blue-800',
  passport: 'bg-green-100 text-green-800',
  visa: 'bg-purple-100 text-purple-800',
  contract: 'bg-amber-100 text-amber-800',
  other: 'bg-gray-100 text-gray-800',
};

const NATIONALITY_FLAGS: Record<string, string> = {
  Romanian: '🇷🇴', Polish: '🇵🇱', German: '🇩🇪', British: '🇬🇧',
  American: '🇺🇸', French: '🇫🇷', Italian: '🇮🇹', Spanish: '🇪🇸',
  Indian: '🇮🇳', Chinese: '🇨🇳', Filipino: '🇵🇭', Ukrainian: '🇺🇦',
  Bulgarian: '🇧🇬', Hungarian: '🇭🇺', Czech: '🇨🇿', Slovak: '🇸🇰',
  Greek: '🇬🇷', Turkish: '🇹🇷', Dutch: '🇳🇱', Belgian: '🇧🇪',
  Portuguese: '🇵🇹', Brazilian: '🇧🇷', Mexican: '🇲🇽', Canadian: '🇨🇦',
  Australian: '🇦🇺', Japanese: '🇯🇵', Korean: '🇰🇷', Vietnamese: '🇻🇳',
  Indonesian: '🇮🇩', Pakistani: '🇵🇰', Bangladeshi: '🇧🇩', Egyptian: '🇪🇬',
  Moroccan: '🇲🇦', Nigerian: '🇳🇬', 'South African': '🇿🇦', Moldovan: '🇲🇩',
  Serbian: '🇷🇸', Croatian: '🇭🇷', Slovenian: '🇸🇮', Austrian: '🇦🇹',
  Swiss: '🇨🇭', Irish: '🇮🇪', Swedish: '🇸🇪', Norwegian: '🇳🇴',
  Danish: '🇩🇰', Finnish: '🇫🇮',
};

function getFlag(nationality: string | null): string {
  if (!nationality) return '🌍';
  return NATIONALITY_FLAGS[nationality] || '🌍';
}

function getInitials(fullName: string): string {
  return fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Data hooks
  const { data: candidate, isLoading: candidateLoading } = useCandidate(id);
  const { data: notes, isLoading: notesLoading } = useNotes(id);
  const { data: documents, isLoading: docsLoading } = useDocuments(id);
  const { data: stageHistory, isLoading: historyLoading } = useStageHistory(id);

  // Mutation hooks
  const updateStage = useUpdateCandidateStage();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();

  // Local state
  const [noteContent, setNoteContent] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [stageNote, setStageNote] = useState('');
  const [uploadDocType, setUploadDocType] = useState<DocType>('other');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Loading / Not Found ───────────────────────────────────────────────────

  if (candidateLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!candidate) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 text-center max-w-md mx-auto mt-24">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-lg font-semibold text-foreground">Candidate not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This candidate may have been deleted or the link is invalid.
          </p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate('/candidates')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Candidates
          </Button>
        </div>
      </AppLayout>
    );
  }

  // ─── Derived State ─────────────────────────────────────────────────────────

  const currentStageIndex = STAGES.findIndex((s) => s.value === candidate.current_stage);
  const daysInStage = differenceInDays(new Date(), new Date(candidate.updated_at));
  const isClosedNotPlaced = candidate.current_stage === 'closed_not_placed';

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleAddNote = async () => {
    if (!noteContent.trim() || !id) return;
    await createNote.mutateAsync({ candidate_id: id, content: noteContent.trim() });
    setNoteContent('');
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!id) return;
    await deleteNote.mutateAsync({ id: noteId, candidateId: id });
  };

  const handleStageChange = async () => {
    if (!selectedStage || !id) return;
    await updateStage.mutateAsync({
      id,
      stage: selectedStage as RecruitmentStage,
      note: stageNote || undefined,
    });
    setSelectedStage('');
    setStageNote('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    await uploadDoc.mutateAsync({ candidateId: id, file, docType: uploadDocType });
    e.target.value = '';
  };

  const handleDeleteDoc = async (docId: string, storagePath: string) => {
    if (!id) return;
    await deleteDoc.mutateAsync({ id: docId, storagePath, candidateId: id });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">

        {/* Back Button */}
        <Button variant="ghost" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* ── Header Card ──────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              {/* Avatar + Contact Info */}
              <div className="flex items-start gap-4 flex-1">
                <Avatar className="h-16 w-16 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {getInitials(candidate.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-foreground">{candidate.full_name}</h1>
                    <span className="text-xl" title={candidate.nationality || undefined}>
                      {getFlag(candidate.nationality)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <a href={`mailto:${candidate.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                      <Mail className="h-4 w-4" />
                      {candidate.email}
                    </a>
                    {candidate.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4" />
                        {candidate.phone}
                      </span>
                    )}
                    {candidate.current_country && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {candidate.current_country}
                      </span>
                    )}
                    {candidate.linkedin && (
                      <a
                        href={candidate.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Current Stage Badge + Days */}
              <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                <Badge
                  variant="secondary"
                  className={cn('text-sm px-3 py-1', getStageColor(candidate.current_stage))}
                >
                  {getStageLabel(candidate.current_stage)}
                </Badge>
                <span className={cn('text-xs flex items-center gap-1', daysInStage > 14 ? 'text-warning font-medium' : 'text-muted-foreground')}>
                  <Clock className="h-3 w-3" />
                  {daysInStage}d in stage
                </span>
              </div>
            </div>

            {/* Stage Progress Bar */}
            <div className="mt-6">
              <div className="flex gap-1 items-center">
                {STAGES.filter((s) => s.value !== 'closed_not_placed').map((stage, idx) => {
                  const isActive = stage.value === candidate.current_stage;
                  const isPast = !isClosedNotPlaced && idx < currentStageIndex;
                  return (
                    <div
                      key={stage.value}
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-300',
                        isActive
                          ? 'flex-1 bg-primary'
                          : isPast
                            ? 'w-6 bg-primary/35'
                            : 'w-6 bg-border'
                      )}
                      title={stage.label}
                    />
                  );
                })}
                {isClosedNotPlaced && (
                  <div className="w-6 h-1.5 rounded-full bg-destructive" title="Closed — Not Placed" />
                )}
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Sourced</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Placed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Tabbed Content ───────────────────────────────────────────────── */}
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="notes">
              Notes{notes && notes.length > 0 && <span className="ml-1.5 text-xs opacity-60">({notes.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="documents">
              Documents{documents && documents.length > 0 && <span className="ml-1.5 text-xs opacity-60">({documents.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* ── Overview ─────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid gap-4 lg:grid-cols-2">

              {/* Candidate Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Candidate Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  {[
                    { label: 'Nationality', value: candidate.nationality },
                    { label: 'Current Country', value: candidate.current_country },
                    {
                      label: 'Expected Start',
                      value: candidate.expected_start_date
                        ? format(new Date(candidate.expected_start_date + 'T00:00:00'), 'MMM d, yyyy')
                        : null,
                    },
                    { label: 'Added', value: format(new Date(candidate.created_at), 'MMM d, yyyy') },
                    {
                      label: 'Last Updated',
                      value: formatDistanceToNow(new Date(candidate.updated_at), { addSuffix: true }),
                    },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between py-2.5 border-b border-border/40 last:border-0">
                      <span className="text-sm text-muted-foreground">{row.label}</span>
                      <span className="text-sm font-medium text-foreground">{row.value || '—'}</span>
                    </div>
                  ))}

                  {candidate.rejection_reason && (
                    <div className="mt-4 p-3 rounded-lg bg-destructive/8 border border-destructive/20">
                      <p className="text-xs font-semibold text-destructive uppercase tracking-wide">Rejection Reason</p>
                      <p className="text-sm text-destructive mt-1">{candidate.rejection_reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Change Stage */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Change Stage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>New Stage</Label>
                    <Select value={selectedStage} onValueChange={setSelectedStage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a stage…" />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map((stage) => (
                          <SelectItem
                            key={stage.value}
                            value={stage.value}
                            disabled={stage.value === candidate.current_stage}
                          >
                            {stage.label}
                            {stage.value === candidate.current_stage && ' (current)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Textarea
                      placeholder="Reason for this change…"
                      value={stageNote}
                      onChange={(e) => setStageNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={!selectedStage || updateStage.isPending}
                    onClick={handleStageChange}
                  >
                    {updateStage.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Stage
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Notes ────────────────────────────────────────────────────── */}
          <TabsContent value="notes" className="space-y-4 mt-4">
            {/* Compose */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Textarea
                  placeholder="Write a note about this candidate…"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Ctrl + Enter to submit</span>
                  <Button size="sm" disabled={!noteContent.trim() || createNote.isPending} onClick={handleAddNote}>
                    {createNote.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* List */}
            {notesLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : notes && notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note) => (
                  <Card key={note.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-3">
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.content}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-10 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground font-medium">No notes yet</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Add a note above to track your thoughts on this candidate.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Documents ────────────────────────────────────────────────── */}
          <TabsContent value="documents" className="space-y-4 mt-4">
            {/* Upload Row */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label>Document Type</Label>
                    <Select value={uploadDocType} onValueChange={(v) => setUploadDocType(v as DocType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="sr-only"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    />
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadDoc.isPending}
                    >
                      {uploadDoc.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploadDoc.isPending ? 'Uploading…' : 'Upload Document'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* List */}
            {docsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : documents && documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className={cn('text-xs', DOC_TYPE_COLORS[doc.doc_type])}>
                                {DOC_TYPE_LABELS[doc.doc_type]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(doc.uploaded_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => handleDeleteDoc(doc.id, doc.storage_path)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-10 text-center">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground font-medium">No documents yet</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Upload a resume, passport, or other file above.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── History ──────────────────────────────────────────────────── */}
          <TabsContent value="history" className="mt-4">
            {historyLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : stageHistory && stageHistory.length > 0 ? (
              <div className="relative space-y-4">
                {/* Vertical timeline line */}
                <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border" />

                {stageHistory.map((entry) => (
                  <div key={entry.id} className="relative flex gap-4">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card border-2 border-primary shrink-0">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    </div>

                    {/* Card */}
                    <Card className="flex-1">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            {entry.from_stage && (
                              <>
                                <Badge variant="secondary" className={cn('text-xs', getStageColor(entry.from_stage))}>
                                  {getStageLabel(entry.from_stage).split(' / ')[0]}
                                </Badge>
                                <span className="text-xs text-muted-foreground">→</span>
                              </>
                            )}
                            <Badge variant="secondary" className={cn('text-xs', getStageColor(entry.to_stage))}>
                              {getStageLabel(entry.to_stage).split(' / ')[0]}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(entry.changed_at), 'MMM d, yyyy · HH:mm')}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-sm text-muted-foreground mt-2 italic">{entry.note}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-10 text-center">
                  <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground font-medium">No stage history yet</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Stage changes will be logged here automatically.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
