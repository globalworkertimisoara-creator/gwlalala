import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  X, ExternalLink, ChevronDown, ChevronRight, Mail, Phone, MapPin,
  Building2, Briefcase, Calendar, Clock, FileText, CheckCircle, XCircle,
  AlertTriangle, FileWarning, Loader2, ClipboardCheck, Users,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { STAGES, getStageLabel, getStageColor, RecruitmentStage } from '@/types/database';
import {
  AgencyWorker, ApprovalStatus, APPROVAL_STATUS_CONFIG,
  getApprovalStatusColor, getApprovalStatusLabel,
  INITIAL_REQUIRED_DOCS, getDocTypeLabel,
} from '@/types/agency';
import { useReviewWorker, useWorkerDocuments } from '@/hooks/useAgency';
import { cn } from '@/lib/utils';

interface AgencyWorkerDetailPanelProps {
  worker: AgencyWorker;
  onClose: () => void;
}

export function AgencyWorkerDetailPanel({ worker, onClose }: AgencyWorkerDetailPanelProps) {
  const navigate = useNavigate();
  const reviewWorker = useReviewWorker();
  const { data: documents = [] } = useWorkerDocuments(worker.id);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    job: true,
    documents: true,
    review: true,
    notes: false,
  });

  const [reviewAction, setReviewAction] = useState<ApprovalStatus | ''>('');
  const [reviewNotes, setReviewNotes] = useState(worker.review_notes || '');
  const [advanceToStage, setAdvanceToStage] = useState<string>('');

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const daysSinceSubmission = differenceInDays(new Date(), new Date(worker.submitted_at));

  // Document completeness
  const uploadedDocTypes = documents.map((d: any) => d.doc_type);
  const missingDocs = INITIAL_REQUIRED_DOCS.filter(doc => !uploadedDocTypes.includes(doc));
  const hasAllRequiredDocs = missingDocs.length === 0;
  const docCompletionPct = Math.round(((INITIAL_REQUIRED_DOCS.length - missingDocs.length) / INITIAL_REQUIRED_DOCS.length) * 100);

  // Stage advancement options
  const currentStageIndex = STAGES.findIndex(s => s.value === worker.current_stage);
  const nextStages = STAGES.slice(currentStageIndex + 1).filter(s => s.value !== 'closed_not_placed');

  const handleSubmitReview = async () => {
    if (!reviewAction) return;
    await reviewWorker.mutateAsync({
      workerId: worker.id,
      status: reviewAction,
      notes: reviewNotes || undefined,
      newStage: reviewAction === 'approved' && advanceToStage && advanceToStage !== 'keep' ? advanceToStage : undefined,
    });
    setReviewAction('');
    setReviewNotes('');
    setAdvanceToStage('');
  };

  return (
    <div className="flex flex-col h-full border-l bg-card">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b bg-muted/30">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base truncate">{worker.full_name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge className={cn('text-[10px]', getApprovalStatusColor(worker.approval_status))}>
              {getApprovalStatusLabel(worker.approval_status)}
            </Badge>
            <Badge className={cn('text-[10px]', getStageColor(worker.current_stage))}>
              {getStageLabel(worker.current_stage).split(' / ')[0]}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{daysSinceSubmission}d ago</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/agency-workers/${worker.id}`)} title="Open full view">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Doc completion bar */}
      <div className="px-4 py-2 border-b bg-muted/10">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Documents</span>
          <span className={hasAllRequiredDocs ? 'text-green-600' : 'text-orange-600'}>
            {INITIAL_REQUIRED_DOCS.length - missingDocs.length}/{INITIAL_REQUIRED_DOCS.length} required
          </span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', hasAllRequiredDocs ? 'bg-green-500' : 'bg-orange-400')}
            style={{ width: `${docCompletionPct}%` }}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {/* Details */}
          <SectionHeader title="Contact Details" expanded={expandedSections.details} onToggle={() => toggleSection('details')} />
          {expandedSections.details && (
            <div className="pb-3 space-y-2 text-sm">
              <DetailRow icon={Mail} label="Email" value={worker.email} />
              {worker.phone && <DetailRow icon={Phone} label="Phone" value={worker.phone} />}
              <DetailRow icon={MapPin} label="Nationality" value={worker.nationality} />
              {worker.current_country && <DetailRow icon={MapPin} label="Country" value={worker.current_country} />}
              {worker.date_of_birth && <DetailRow icon={Calendar} label="DOB" value={format(new Date(worker.date_of_birth), 'MMM d, yyyy')} />}
              {worker.experience_years !== null && worker.experience_years !== undefined && (
                <DetailRow icon={Briefcase} label="Experience" value={`${worker.experience_years} years`} />
              )}
              {worker.skills && (
                <div>
                  <span className="text-muted-foreground text-xs">Skills</span>
                  <p className="text-xs mt-0.5 text-foreground/80">{worker.skills}</p>
                </div>
              )}
              {worker.agency && (
                <div className="mt-1 pt-1 border-t">
                  <DetailRow icon={Building2} label="Agency" value={worker.agency.company_name} />
                  {worker.agency.country && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-muted-foreground text-xs ml-4">Country</span>
                      <span className="text-xs font-medium">{worker.agency.country}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Job */}
          <SectionHeader title="Job" expanded={expandedSections.job} onToggle={() => toggleSection('job')} />
          {expandedSections.job && (
            <div className="pb-3">
              {worker.job ? (
                <button
                  className="flex items-center gap-2 w-full rounded-md border px-2 py-1.5 text-left hover:bg-muted/50 transition-colors"
                  onClick={() => { onClose(); navigate(`/jobs/${worker.job!.id}`); }}
                >
                  <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-primary truncate">{worker.job.title}</p>
                    <p className="text-[10px] text-muted-foreground">{worker.job.client_company} · {worker.job.country}</p>
                  </div>
                </button>
              ) : (
                <p className="text-[11px] text-muted-foreground text-center py-1">No job assigned</p>
              )}
            </div>
          )}

          {/* Documents */}
          <SectionHeader title={`Documents (${documents.length})`} expanded={expandedSections.documents} onToggle={() => toggleSection('documents')} />
          {expandedSections.documents && (
            <div className="pb-3 space-y-1.5">
              {/* Missing docs warning */}
              {!hasAllRequiredDocs && (
                <div className="text-[11px] text-orange-600 bg-orange-50 rounded px-2 py-1 border border-orange-200">
                  <FileWarning className="h-3 w-3 inline mr-1" />
                  Missing: {missingDocs.map(d => getDocTypeLabel(d)).join(', ')}
                </div>
              )}
              {documents.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-1">No documents uploaded</p>
              ) : (
                <div className="space-y-1">
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-1.5 rounded border px-2 py-1.5">
                      <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[11px] truncate flex-1">{doc.file_name || doc.doc_type}</span>
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 capitalize shrink-0">
                        {getDocTypeLabel(doc.doc_type)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Review Actions — inline, no dialog */}
          <SectionHeader title="Review" expanded={expandedSections.review} onToggle={() => toggleSection('review')} />
          {expandedSections.review && (
            <div className="pb-3 space-y-3">
              {/* Current status */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Current:</span>
                <Badge className={cn('text-[10px]', getApprovalStatusColor(worker.approval_status))}>
                  {getApprovalStatusLabel(worker.approval_status)}
                </Badge>
              </div>

              {/* Previous review notes */}
              {worker.review_notes && (
                <div className="text-[11px] bg-muted/50 rounded px-2 py-1.5 border">
                  <p className="text-foreground/80">{worker.review_notes}</p>
                  {worker.reviewed_at && (
                    <p className="text-muted-foreground mt-0.5">{format(new Date(worker.reviewed_at), 'MMM d, yyyy')}</p>
                  )}
                </div>
              )}

              {/* Decision buttons */}
              <div className="space-y-1.5">
                <Label className="text-[11px]">Decision</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={reviewAction === 'approved' ? 'default' : 'outline'}
                    className={cn('text-[10px] h-7 gap-1', reviewAction === 'approved' && 'bg-green-600 hover:bg-green-700')}
                    onClick={() => setReviewAction('approved')}
                    disabled={!hasAllRequiredDocs}
                  >
                    <CheckCircle className="h-3 w-3" />
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={reviewAction === 'needs_documents' ? 'default' : 'outline'}
                    className={cn('text-[10px] h-7 gap-1', reviewAction === 'needs_documents' && 'bg-orange-600 hover:bg-orange-700')}
                    onClick={() => setReviewAction('needs_documents')}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Docs
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={reviewAction === 'rejected' ? 'default' : 'outline'}
                    className={cn('text-[10px] h-7 gap-1', reviewAction === 'rejected' && 'bg-red-600 hover:bg-red-700')}
                    onClick={() => setReviewAction('rejected')}
                  >
                    <XCircle className="h-3 w-3" />
                    Reject
                  </Button>
                </div>
                {!hasAllRequiredDocs && (
                  <p className="text-[10px] text-orange-600">Cannot approve until all required docs uploaded.</p>
                )}
              </div>

              {/* Stage advancement (approve only) */}
              {reviewAction === 'approved' && nextStages.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-[11px]">Advance to Stage</Label>
                  <Select value={advanceToStage} onValueChange={setAdvanceToStage}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Keep current stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep" className="text-xs">Keep current stage</SelectItem>
                      {nextStages.map(stage => (
                        <SelectItem key={stage.value} value={stage.value} className="text-xs">
                          {stage.label.split(' / ')[0]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Notes */}
              {reviewAction && (
                <div className="space-y-1">
                  <Label className="text-[11px]">
                    Notes {reviewAction === 'rejected' && <span className="text-destructive">*</span>}
                  </Label>
                  <Textarea
                    placeholder={
                      reviewAction === 'rejected' ? 'Reason for rejection...'
                        : reviewAction === 'needs_documents' ? 'Which documents are needed...'
                        : 'Optional notes...'
                    }
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={2}
                    className="text-xs"
                  />
                </div>
              )}

              {/* Submit */}
              {reviewAction && (
                <Button
                  size="sm"
                  className="w-full text-xs h-8 gap-1.5"
                  disabled={!reviewAction || (reviewAction === 'rejected' && !reviewNotes) || reviewWorker.isPending}
                  onClick={handleSubmitReview}
                >
                  {reviewWorker.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  <ClipboardCheck className="h-3 w-3" />
                  Submit Review
                </Button>
              )}
            </div>
          )}

          {/* Worker Notes */}
          <SectionHeader title="Notes" expanded={expandedSections.notes} onToggle={() => toggleSection('notes')} />
          {expandedSections.notes && (
            <div className="pb-3">
              {worker.notes ? (
                <p className="text-[11px] text-foreground/80 whitespace-pre-wrap">{worker.notes}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground text-center py-1">No notes</p>
              )}
              {worker.rejection_reason && (
                <div className="text-[11px] text-destructive bg-destructive/5 rounded px-2 py-1 mt-1.5">
                  Rejection: {worker.rejection_reason}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={() => navigate(`/agency-workers/${worker.id}`)}
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

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-xs flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}
