import { useState } from 'react';
import { useReviewWorker, useWorkerDocuments } from '@/hooks/useAgency';
import { AgencyWorker, ApprovalStatus, APPROVAL_STATUS_CONFIG, INITIAL_REQUIRED_DOCS, getDocTypeLabel } from '@/types/agency';
import { STAGES } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, XCircle, AlertTriangle, FileWarning, Loader2 } from 'lucide-react';

interface WorkerReviewDialogProps {
  worker: AgencyWorker;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkerReviewDialog({ worker, open, onOpenChange }: WorkerReviewDialogProps) {
  const [action, setAction] = useState<ApprovalStatus | ''>('');
  const [notes, setNotes] = useState(worker.review_notes || '');
  const [advanceToStage, setAdvanceToStage] = useState<string>('');
  
  const { data: documents } = useWorkerDocuments(worker.id);
  const reviewWorker = useReviewWorker();
  
  // Check document completeness
  const uploadedDocTypes = documents?.map(d => d.doc_type) || [];
  const missingDocs = INITIAL_REQUIRED_DOCS.filter(doc => !uploadedDocTypes.includes(doc));
  const hasAllRequiredDocs = missingDocs.length === 0;
  
  // Get current stage index for advancement options
  const currentStageIndex = STAGES.findIndex(s => s.value === worker.current_stage);
  const nextStages = STAGES.slice(currentStageIndex + 1).filter(s => s.value !== 'closed_not_placed');
  
  const handleSubmit = async () => {
    if (!action) return;
    
    await reviewWorker.mutateAsync({
      workerId: worker.id,
      status: action,
      notes: notes || undefined,
      newStage: action === 'approved' && advanceToStage ? advanceToStage : undefined,
    });
    
    onOpenChange(false);
    setAction('');
    setNotes('');
    setAdvanceToStage('');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Worker Application</DialogTitle>
          <DialogDescription>
            Review {worker.full_name}'s application and documents before making a decision.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Document Status */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Document Status</span>
              {hasAllRequiredDocs ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800">
                  <FileWarning className="h-3 w-3 mr-1" />
                  Missing {missingDocs.length} document(s)
                </Badge>
              )}
            </div>
            
            {!hasAllRequiredDocs && (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-orange-600 mb-1">Missing required documents:</p>
                <ul className="list-disc list-inside space-y-1">
                  {missingDocs.map(doc => (
                    <li key={doc}>{getDocTypeLabel(doc)}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              {documents?.length || 0} document(s) uploaded
            </div>
          </div>
          
          {/* Current Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current Status:</span>
            <Badge className={APPROVAL_STATUS_CONFIG.find(s => s.value === worker.approval_status)?.color}>
              {APPROVAL_STATUS_CONFIG.find(s => s.value === worker.approval_status)?.label}
            </Badge>
          </div>
          
          {/* Action Selection */}
          <div className="space-y-2">
            <Label>Decision</Label>
            <div className="grid grid-cols-1 gap-2">
              <Button
                type="button"
                variant={action === 'approved' ? 'default' : 'outline'}
                className={action === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                onClick={() => setAction('approved')}
                disabled={!hasAllRequiredDocs}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                type="button"
                variant={action === 'needs_documents' ? 'default' : 'outline'}
                className={action === 'needs_documents' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                onClick={() => setAction('needs_documents')}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Request Documents
              </Button>
              <Button
                type="button"
                variant={action === 'rejected' ? 'default' : 'outline'}
                className={action === 'rejected' ? 'bg-red-600 hover:bg-red-700' : ''}
                onClick={() => setAction('rejected')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
            {!hasAllRequiredDocs && (
              <p className="text-sm text-orange-600">
                Cannot approve until all required documents are uploaded.
              </p>
            )}
          </div>
          
          {/* Stage Advancement (only for approval) */}
          {action === 'approved' && nextStages.length > 0 && (
            <div className="space-y-2">
              <Label>Advance to Stage (Optional)</Label>
              <Select value={advanceToStage} onValueChange={setAdvanceToStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Keep current stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep">Keep current stage</SelectItem>
                  {nextStages.map(stage => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes {action === 'rejected' && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                action === 'rejected' 
                  ? 'Please provide a reason for rejection...' 
                  : action === 'needs_documents'
                  ? 'Specify which documents are needed...'
                  : 'Add any notes about this decision...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!action || (action === 'rejected' && !notes) || reviewWorker.isPending}
          >
            {reviewWorker.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}