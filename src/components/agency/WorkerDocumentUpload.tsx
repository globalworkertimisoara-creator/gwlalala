import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Video, 
  Image, 
  Trash2, 
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  useWorkerDocuments, 
  useUploadWorkerDocument, 
  useDeleteWorkerDocument,
  useWorkerDocumentUrl 
} from '@/hooks/useAgency';
import { 
  AGENCY_DOC_TYPES, 
  INITIAL_REQUIRED_DOCS,
  getDocTypeLabel,
  AgencyDocType,
  AgencyWorkerDocument 
} from '@/types/agency';
import { RecruitmentStage } from '@/types/database';

interface WorkerDocumentUploadProps {
  workerId: string;
  currentStage: RecruitmentStage;
  isAgencyView?: boolean;
}

export function WorkerDocumentUpload({ workerId, currentStage, isAgencyView = true }: WorkerDocumentUploadProps) {
  const [selectedDocType, setSelectedDocType] = useState<AgencyDocType>('cv');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: documents, isLoading } = useWorkerDocuments(workerId);
  const uploadDocument = useUploadWorkerDocument();
  const deleteDocument = useDeleteWorkerDocument();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadDocument.mutateAsync({
      workerId,
      file,
      docType: selectedDocType,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (doc: AgencyWorkerDocument) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    await deleteDocument.mutateAsync({
      id: doc.id,
      storagePath: doc.storage_path,
      workerId,
    });
  };

  const getDocTypeAccept = (docType: AgencyDocType) => {
    return AGENCY_DOC_TYPES.find(d => d.value === docType)?.accept || '*/*';
  };

  const getDocTypeIcon = (docType: AgencyDocType) => {
    if (docType.includes('video')) return Video;
    if (docType === 'photo') return Image;
    return FileText;
  };

  // Check which required docs are uploaded
  const uploadedDocTypes = new Set(documents?.map(d => d.doc_type) || []);
  const missingRequiredDocs = INITIAL_REQUIRED_DOCS.filter(dt => !uploadedDocTypes.has(dt));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents
        </CardTitle>
        <CardDescription>
          {isAgencyView 
            ? 'Upload required documents for this worker'
            : 'Documents submitted by the agency'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Required documents status */}
        {missingRequiredDocs.length > 0 && (
          <div className="rounded-lg border border-warning/50 bg-warning/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Missing Required Documents</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {missingRequiredDocs.map(docType => (
                    <Badge key={docType} variant="outline" className="text-warning border-warning/50">
                      {getDocTypeLabel(docType)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {missingRequiredDocs.length === 0 && documents && documents.length >= INITIAL_REQUIRED_DOCS.length && (
          <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <p className="font-medium text-sm">
                All required documents uploaded
              </p>
            </div>
          </div>
        )}

        {/* Upload section (for agencies) */}
        {isAgencyView && (
          <div className="flex gap-3">
            <Select value={selectedDocType} onValueChange={(v) => setSelectedDocType(v as AgencyDocType)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENCY_DOC_TYPES.map((docType) => (
                  <SelectItem key={docType.value} value={docType.value}>
                    {docType.label}
                    {INITIAL_REQUIRED_DOCS.includes(docType.value) && !uploadedDocTypes.has(docType.value) && (
                      <span className="text-warning ml-1">*</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              ref={fileInputRef}
              type="file"
              accept={getDocTypeAccept(selectedDocType)}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadDocument.isPending}
            >
              {uploadDocument.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload
            </Button>
          </div>
        )}

        {/* Documents list */}
        <div className="space-y-2">
          {documents?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No documents uploaded yet
            </p>
          ) : (
            documents?.map((doc) => (
              <DocumentRow 
                key={doc.id} 
                document={doc} 
                onDelete={isAgencyView ? handleDelete : undefined}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface DocumentRowProps {
  document: AgencyWorkerDocument;
  onDelete?: (doc: AgencyWorkerDocument) => void;
}

function DocumentRow({ document, onDelete }: DocumentRowProps) {
  const { data: signedUrl, isLoading: urlLoading } = useWorkerDocumentUrl(document.storage_path);
  const Icon = document.doc_type.includes('video') ? Video : 
               document.doc_type === 'photo' ? Image : FileText;

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{document.file_name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            {getDocTypeLabel(document.doc_type)}
          </Badge>
          {document.file_size && (
            <span>{formatFileSize(document.file_size)}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {signedUrl && (
          <Button
            variant="ghost"
            size="icon"
            asChild
          >
            <a href={signedUrl} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4" />
            </a>
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(document)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
