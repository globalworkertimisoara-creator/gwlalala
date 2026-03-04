import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Loader2,
  Sparkles,
  Download
} from 'lucide-react';
import { useDocuments, useUploadDocumentWithOCR, useDeleteDocument } from '@/hooks/useDocuments';
import { supabase } from '@/integrations/supabase/client';
import { DocType } from '@/types/database';
import { ExtractedData } from '@/hooks/useDocumentExtraction';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const DOC_TYPE_LABELS: Record<DocType, string> = {
  resume: 'Resume',
  passport: 'Passport',
  visa: 'Visa',
  contract: 'Contract',
  residence_permit: 'Residence Permit',
  other: 'Other',
};

const DOC_TYPE_COLORS: Record<DocType, string> = {
  resume: 'bg-blue-100 text-blue-800',
  passport: 'bg-green-100 text-green-800',
  visa: 'bg-purple-100 text-purple-800',
  contract: 'bg-amber-100 text-amber-800',
  residence_permit: 'bg-teal-100 text-teal-800',
  other: 'bg-gray-100 text-gray-800',
};

interface CandidateDocumentUploadProps {
  candidateId: string;
  onDataExtracted?: (data: ExtractedData) => void;
}

export function CandidateDocumentUpload({ 
  candidateId, 
  onDataExtracted 
}: CandidateDocumentUploadProps) {
  const [uploadDocType, setUploadDocType] = useState<DocType>('other');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: documents, isLoading: docsLoading } = useDocuments(candidateId);
  const uploadDoc = useUploadDocumentWithOCR();
  const deleteDoc = useDeleteDocument();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !candidateId) return;
    
    const result = await uploadDoc.mutateAsync({ 
      candidateId, 
      file, 
      docType: uploadDocType 
    });
    
    if (result.extractedData && onDataExtracted) {
      onDataExtracted(result.extractedData);
    }
    
    e.target.value = '';
  };

  const handleDeleteDoc = async (docId: string, storagePath: string) => {
    if (!candidateId) return;
    await deleteDoc.mutateAsync({ id: docId, storagePath, candidateId });
  };

  const handleDownload = async (storagePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from('candidate-documents').download(storagePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const isUploading = uploadDoc.isPending || uploadDoc.isExtracting;

  return (
    <div className="space-y-4">
      {/* Upload Row */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <Label>Document Type</Label>
                {onDataExtracted && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <Sparkles className="h-3 w-3" />
                    OCR
                  </Badge>
                )}
              </div>
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
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploadDoc.isExtracting ? 'Extracting data…' : isUploading ? 'Uploading…' : 'Upload Document'}
              </Button>
            </div>
          </div>
          
          {/* Extraction indicator */}
          {uploadDoc.isExtracting && (
            <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium">Extracting data from document...</p>
                <p className="text-xs text-muted-foreground">AI is reading the document to auto-fill fields</p>
              </div>
            </div>
          )}
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
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => handleDownload(doc.storage_path, doc.file_name)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteDoc(doc.id, doc.storage_path)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
    </div>
  );
}
