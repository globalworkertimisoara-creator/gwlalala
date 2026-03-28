import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, ExternalLink, ChevronDown, ChevronRight, Mail, Phone, MapPin, Linkedin, FileText, Loader2, FolderKanban } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Candidate, STAGES, getStageLabel, getStageColor, RecruitmentStage } from '@/types/database';
import { useUpdateCandidateStage } from '@/hooks/useCandidates';
import { useNotes } from '@/hooks/useNotes';
import { useDocuments } from '@/hooks/useDocuments';
import { usePipelineCandidates } from '@/hooks/usePipelineCandidates';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CandidateDetailPanelProps {
  candidate: Candidate;
  onClose: () => void;
}

export function CandidateDetailPanel({ candidate, onClose }: CandidateDetailPanelProps) {
  const navigate = useNavigate();
  const updateStage = useUpdateCandidateStage();
  const { toast } = useToast();
  const { data: notes = [] } = useNotes(candidate.id);
  const { data: documents = [] } = useDocuments(candidate.id);
  const { data: pipelineEntries = [] } = usePipelineCandidates(undefined);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    contact: true,
    stage: true,
    projects: true,
    notes: false,
    documents: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const daysInStage = differenceInDays(new Date(), new Date(candidate.updated_at));
  const initials = candidate.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Find projects this candidate is linked to
  const linkedProjects = pipelineEntries.filter((p: any) => p.candidate_id === candidate.id);

  const handleStageChange = async (newStage: string) => {
    try {
      await updateStage.mutateAsync({ id: candidate.id, stage: newStage as RecruitmentStage });
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="flex flex-col h-full border-l bg-card">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b bg-muted/30">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base truncate">{candidate.full_name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={cn('text-[10px]', getStageColor(candidate.current_stage))}>
              {getStageLabel(candidate.current_stage).split(' / ')[0]}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{daysInStage}d in stage</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/candidates/${candidate.id}`)} title="Open full profile">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {/* Contact Info */}
          <SectionHeader title="Contact Info" expanded={expandedSections.contact} onToggle={() => toggleSection('contact')} />
          {expandedSections.contact && (
            <div className="pb-3 space-y-2 text-sm">
              <ContactRow icon={Mail} label="Email" value={candidate.email} href={`mailto:${candidate.email}`} />
              <ContactRow icon={Phone} label="Phone" value={candidate.phone || '—'} href={candidate.phone ? `tel:${candidate.phone}` : undefined} />
              <ContactRow icon={MapPin} label="Country" value={candidate.current_country || '—'} />
              {candidate.nationality && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Nationality</span>
                  <span className="text-xs font-medium">{candidate.nationality}</span>
                </div>
              )}
              {candidate.linkedin && (
                <ContactRow icon={Linkedin} label="LinkedIn" value="Profile" href={candidate.linkedin} external />
              )}
              {candidate.passport_number && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Passport</span>
                  <span className="text-xs font-medium font-mono">{candidate.passport_number}</span>
                </div>
              )}
              {candidate.expected_start_date && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Expected Start</span>
                  <span className="text-xs font-medium">{format(new Date(candidate.expected_start_date), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
          )}

          {/* Stage */}
          <SectionHeader title="Stage" expanded={expandedSections.stage} onToggle={() => toggleSection('stage')} />
          {expandedSections.stage && (
            <div className="pb-3 space-y-2">
              <Select value={candidate.current_stage} onValueChange={handleStageChange} disabled={updateStage.isPending}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map(s => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label.split(' / ')[0]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{daysInStage} days in current stage</span>
                {daysInStage > 14 && <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300">Long wait</Badge>}
              </div>
              {candidate.rejection_reason && (
                <div className="text-xs text-destructive bg-destructive/5 rounded px-2 py-1">
                  Rejection: {candidate.rejection_reason}
                </div>
              )}
            </div>
          )}

          {/* Projects */}
          <SectionHeader title={`Projects (${linkedProjects.length})`} expanded={expandedSections.projects} onToggle={() => toggleSection('projects')} />
          {expandedSections.projects && (
            <div className="pb-3">
              {linkedProjects.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-1">Not linked to any project</p>
              ) : (
                <div className="space-y-1">
                  {linkedProjects.map((entry: any) => (
                    <button
                      key={entry.id}
                      className="flex items-center gap-2 w-full rounded-md border px-2 py-1.5 text-left hover:bg-muted/50 transition-colors"
                      onClick={() => { onClose(); navigate(`/projects/${entry.project_id}`); }}
                    >
                      <FolderKanban className="h-3 w-3 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-primary truncate">{entry.project?.name || 'Project'}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {entry.current_stage ? getStageLabel(entry.current_stage).split(' / ')[0] : 'Pipeline'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <SectionHeader title={`Notes (${notes.length})`} expanded={expandedSections.notes} onToggle={() => toggleSection('notes')} />
          {expandedSections.notes && (
            <div className="pb-3">
              {notes.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-1">No notes</p>
              ) : (
                <div className="space-y-1.5">
                  {notes.slice(0, 5).map((note: any) => (
                    <div key={note.id} className="text-[11px] rounded border px-2 py-1.5">
                      <p className="text-foreground/80 line-clamp-2">{note.content}</p>
                      <p className="text-muted-foreground mt-0.5">{format(new Date(note.created_at), 'MMM d, HH:mm')}</p>
                    </div>
                  ))}
                  {notes.length > 5 && (
                    <p className="text-[10px] text-muted-foreground text-center">+{notes.length - 5} more</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Documents */}
          <SectionHeader title={`Documents (${documents.length})`} expanded={expandedSections.documents} onToggle={() => toggleSection('documents')} />
          {expandedSections.documents && (
            <div className="pb-3">
              {documents.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-1">No documents</p>
              ) : (
                <div className="space-y-1">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-1.5 rounded border px-2 py-1.5">
                      <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[11px] truncate flex-1">{doc.file_name || doc.doc_type}</span>
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 capitalize">{doc.doc_type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer: Open full profile */}
      <div className="p-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={() => navigate(`/candidates/${candidate.id}`)}
        >
          Open Full Profile
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

function SectionHeader({ title, expanded, onToggle }: { title: string; expanded: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border-b"
    >
      {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      <span className="uppercase tracking-wide">{title}</span>
    </button>
  );
}

function ContactRow({ icon: Icon, label, value, href, external }: { icon: any; label: string; value: string; href?: string; external?: boolean }) {
  // Validate href to prevent javascript: XSS — only allow http(s), mailto, and tel protocols
  const safeHref = href && /^(https?:\/\/|mailto:|tel:)/i.test(href) ? href : undefined;
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-xs flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </span>
      {safeHref ? (
        <a href={safeHref} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className="text-xs font-medium text-primary hover:underline">{value}</a>
      ) : (
        <span className="text-xs font-medium">{value}</span>
      )}
    </div>
  );
}