/**
 * src/components/workflow/DocumentChecklist.tsx
 *
 * Shows required documents for a workflow phase with upload functionality.
 * Allows agencies to upload and staff to review/approve.
 */

import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Clock, Eye, Loader2, FileVideo, File as FileIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { isVideoFile, formatFileSize } from '@/utils/videoCompressor';

type WorkflowPhase = 
  | 'recruitment' 
  | 'documentation' 
  | 'visa' 
  | 'arrival' 
  | 'residence_permit';

type DocumentStatus = 'pending' | 'uploaded' | 'under_review' | 'approved' | 'rejected';

interface DocumentTemplate {
  id: string;
  documentName: string;
  description: string | null;
  isRequired: boolean;
}

interface WorkflowDocument {
  id: string;
  documentName: string;
  fileUrl: string;
  status: DocumentStatus;
  uploadedAt: string;
  uploadedBy?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

interface DocumentChecklistProps {
  phase: WorkflowPhase;
  templates: DocumentTemplate[];
  documents: WorkflowDocument[];
  canUpload: boolean;
  canReview: boolean;
  onUpload: (templateId: string, file: File) => Promise<void>;
  onReview: (documentId: string, status: 'approved' | 'rejected', notes: string) => Promise<void>;
}

export default function DocumentChecklist({
  phase,
  templates,
  documents,
  canUpload,
  canReview,
  onUpload,
  onReview,
}: DocumentChecklistProps) {
  const [uploadingTemplate, setUploadingTemplate] = useState<string | null>(null);
  const [uploadDialog, setUploadDialog] = useState<{ template: DocumentTemplate; open: boolean } | null>(null);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [reviewDialog, setReviewDialog] = useState<{ doc: WorkflowDocument; open: boolean } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected' | null>(null);

  const handleUploadFromDialog = async () => {
    if (!uploadDialog || droppedFiles.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < droppedFiles.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${droppedFiles.length}…`);
        await onUpload(uploadDialog.template.id, droppedFiles[i]);
      }
      setUploadDialog(null);
      setDroppedFiles([]);
      setUploadProgress('');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setDroppedFiles((prev) => [...prev, ...acceptedFiles]);
    }
  }, []);

  const removeDroppedFile = useCallback((index: number) => {
    setDroppedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleReviewSubmit = async () => {
    if (!reviewDialog || !reviewAction) return;
    
    try {
      await onReview(reviewDialog.doc.id, reviewAction, reviewNotes);
      setReviewDialog(null);
      setReviewNotes('');
      setReviewAction(null);
    } catch (err) {
      // Review error handled silently
    }
  };

  const getDocumentForTemplate = (templateId: string) => {
    return documents.find(d => d.documentName === templates.find(t => t.id === templateId)?.documentName);
  };

  const getStatusBadge = (status: DocumentStatus) => {
    const variants = {
      pending: { color: 'bg-gray-100 text-gray-700', label: 'Pending' },
      uploaded: { color: 'bg-blue-100 text-blue-700', label: 'Uploaded' },
      under_review: { color: 'bg-yellow-100 text-yellow-700', label: 'Under Review' },
      approved: { color: 'bg-green-100 text-green-700', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
    };
    const variant = variants[status];
    return <Badge className={cn('text-xs', variant.color)}>{variant.label}</Badge>;
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'under_review': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'uploaded': return <FileText className="h-5 w-5 text-blue-600" />;
      default: return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 capitalize">
        {phase.replace('_', ' ')} Documents
      </h3>

      <div className="space-y-2">
        {templates.map((template) => {
          const doc = getDocumentForTemplate(template.id);

          return (
            <div
              key={template.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-muted-foreground/30 transition-colors"
            >
              {/* Status icon */}
              <div className="flex-shrink-0">
                {doc ? getStatusIcon(doc.status) : <FileText className="h-5 w-5 text-gray-300" />}
              </div>

              {/* Document info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    {template.documentName}
                    {template.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  {doc && getStatusBadge(doc.status)}
                </div>
                {template.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                )}
                {doc?.uploadedAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* View uploaded doc */}
                {doc && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(doc.fileUrl, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}

                {/* Upload/Replace */}
                {canUpload && (
                  <Button
                    variant={doc ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => {
                      setDroppedFiles([]);
                      setUploadDialog({ template, open: true });
                    }}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {doc ? 'Replace' : 'Upload'}
                  </Button>
                )}

                {/* Review (for staff) */}
                {canReview && doc && doc.status === 'uploaded' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReviewDialog({ doc, open: true })}
                  >
                    Review
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Dialog */}
      {reviewDialog && (
        <Dialog open={reviewDialog.open} onOpenChange={(open) => !open && setReviewDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Document</DialogTitle>
              <DialogDescription>{reviewDialog.doc.documentName}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Document preview link */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(reviewDialog.doc.fileUrl, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Document
              </Button>

              {/* Review notes */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Review Notes
                </label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this document..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => setReviewAction('rejected')}
                  disabled={reviewAction === 'rejected'}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => setReviewAction('approved')}
                  disabled={reviewAction === 'approved'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>

              {reviewAction && (
                <Button
                  className="w-full"
                  onClick={handleReviewSubmit}
                >
                  Submit Review
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Dialog with Dropzone */}
      {uploadDialog && (
        <UploadDropzoneDialog
          open={uploadDialog.open}
          templateName={uploadDialog.template.documentName}
          droppedFiles={droppedFiles}
          uploading={uploading}
          uploadProgress={uploadProgress}
          onDrop={onDrop}
          onRemoveFile={removeDroppedFile}
          onClose={() => { setUploadDialog(null); setDroppedFiles([]); setUploadProgress(''); }}
          onUpload={handleUploadFromDialog}
        />
      )}
    </div>
  );
}

// ─── Upload Dropzone Dialog ───────────────────────────────────────────────────

function UploadDropzoneDialog({
  open,
  templateName,
  droppedFiles,
  uploading,
  uploadProgress,
  onDrop,
  onRemoveFile,
  onClose,
  onUpload,
}: {
  open: boolean;
  templateName: string;
  droppedFiles: File[];
  uploading: boolean;
  uploadProgress: string;
  onDrop: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onClose: () => void;
  onUpload: () => void;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    disabled: uploading,
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>{templateName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              'relative overflow-hidden rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border bg-muted/30 hover:border-muted-foreground/40',
              uploading && 'cursor-not-allowed opacity-60'
            )}
          >
            <input {...getInputProps()} />
            <Upload className={cn('mx-auto h-10 w-10 mb-3 transition-colors', isDragActive ? 'text-primary' : 'text-muted-foreground')} />
            <p className="text-sm font-medium text-foreground mb-1">
              {isDragActive ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="text-xs text-muted-foreground">or click to browse • multiple files supported</p>
          </div>

          {droppedFiles.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {droppedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                  {isVideoFile(file) ? (
                    <FileVideo className="h-5 w-5 text-primary flex-shrink-0" />
                  ) : (
                    <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  {!uploading && (
                    <Button variant="ghost" size="sm" onClick={() => onRemoveFile(idx)}>
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <Button
            className="w-full"
            disabled={droppedFiles.length === 0 || uploading}
            onClick={onUpload}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadProgress}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {droppedFiles.length > 0 ? `${droppedFiles.length} file${droppedFiles.length > 1 ? 's' : ''}` : 'Documents'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
