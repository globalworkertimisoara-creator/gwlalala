import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  Upload, 
  FileText, 
  Sparkles, 
  X, 
  CheckCircle2,
  AlertCircle 
} from 'lucide-react';
import { STAGES, RecruitmentStage, DocType } from '@/types/database';
import { useCreateCandidate } from '@/hooks/useCandidates';
import { useDocumentExtraction, ExtractedData } from '@/hooks/useDocumentExtraction';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PendingDocument {
  file: File;
  docType: DocType;
  storagePath?: string;
  uploaded?: boolean;
}

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: 'resume', label: 'Resume/CV' },
  { value: 'passport', label: 'Passport' },
  { value: 'visa', label: 'Visa Document' },
  { value: 'residence_permit', label: 'Residence Permit' },
  { value: 'contract', label: 'Contract' },
  { value: 'other', label: 'Other' },
];

function QuickFillDropZone({
  selectedDocType, setSelectedDocType, isUploading, isExtracting, uploadProgress,
  pendingDocuments, fileInputRef, onFileSelect, onFileDrop, onRemoveDocument,
}: {
  selectedDocType: DocType;
  setSelectedDocType: (v: DocType) => void;
  isUploading: boolean;
  isExtracting: boolean;
  uploadProgress: number;
  pendingDocuments: PendingDocument[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop: (files: FileList) => void;
  onRemoveDocument: (index: number) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) {
      onFileDrop(e.dataTransfer.files);
    }
  }, [onFileDrop]);

  return (
    <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Quick Fill with Documents</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag & drop or browse to upload a resume, passport, or other documents to automatically extract candidate information
      </p>

      <div className="flex gap-2">
        <Select value={selectedDocType} onValueChange={(v) => setSelectedDocType(v as DocType)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOC_TYPES.map(dt => (
              <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          className="gap-2 flex-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isExtracting}
        >
          {isUploading || isExtracting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {isExtracting ? 'Extracting data...' : isUploading ? 'Uploading...' : 'Browse Files'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={onFileSelect}
        />
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !(isUploading || isExtracting) && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
        }`}
      >
        <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
        <p className="text-sm font-medium">
          {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, DOC, DOCX — max 10MB</p>
      </div>

      {uploadProgress > 0 && (
        <Progress value={uploadProgress} className="h-1" />
      )}

      {/* Pending documents list */}
      {pendingDocuments.length > 0 && (
        <div className="space-y-2">
          {pendingDocuments.map((doc, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 rounded-md bg-background border"
            >
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{doc.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {DOC_TYPES.find(d => d.value === doc.docType)?.label}
                </p>
              </div>
              {doc.uploaded ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => onRemoveDocument(idx)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AddCandidateDialog({ open, onOpenChange }: AddCandidateDialogProps) {
  const createCandidate = useCreateCandidate();
  const { extractData, isExtracting } = useDocumentExtraction();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    nationality: '',
    current_country: '',
    linkedin: '',
    current_stage: 'sourced' as RecruitmentStage,
    expected_start_date: '',
    // Passport fields
    passport_number: '',
    passport_expiry: '',
    passport_issue_date: '',
    passport_issued_by: '',
    parents_names: '',
  });

  // Document state
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<DocType>('resume');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedFields, setExtractedFields] = useState<Set<string>>(new Set());

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      nationality: '',
      current_country: '',
      linkedin: '',
      current_stage: 'sourced',
      expected_start_date: '',
      passport_number: '',
      passport_expiry: '',
      passport_issue_date: '',
      passport_issued_by: '',
      parents_names: '',
    });
    setPendingDocuments([]);
    setExtractedFields(new Set());
    setUploadProgress(0);
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Remove from extracted fields if user manually edits
    setExtractedFields(prev => {
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  };

  const applyExtractedData = (data: ExtractedData) => {
    const newExtracted = new Set<string>();

    setFormData(prev => {
      const updated = { ...prev };

      if (data.full_name && !prev.full_name) {
        updated.full_name = data.full_name;
        newExtracted.add('full_name');
      }
      if (data.email && !prev.email) {
        updated.email = data.email;
        newExtracted.add('email');
      }
      if (data.phone && !prev.phone) {
        updated.phone = data.phone;
        newExtracted.add('phone');
      }
      if (data.nationality && !prev.nationality) {
        updated.nationality = data.nationality;
        newExtracted.add('nationality');
      }
      if (data.current_country && !prev.current_country) {
        updated.current_country = data.current_country;
        newExtracted.add('current_country');
      }
      if (data.linkedin && !prev.linkedin) {
        updated.linkedin = data.linkedin;
        newExtracted.add('linkedin');
      }
      // Passport fields
      if (data.passport_number && !prev.passport_number) {
        updated.passport_number = data.passport_number;
        newExtracted.add('passport_number');
      }
      if (data.passport_expiry && !prev.passport_expiry) {
        updated.passport_expiry = data.passport_expiry;
        newExtracted.add('passport_expiry');
      }
      if (data.passport_issue_date && !prev.passport_issue_date) {
        updated.passport_issue_date = data.passport_issue_date;
        newExtracted.add('passport_issue_date');
      }
      if (data.passport_issued_by && !prev.passport_issued_by) {
        updated.passport_issued_by = data.passport_issued_by;
        newExtracted.add('passport_issued_by');
      }
      if (data.parents_names && !prev.parents_names) {
        updated.parents_names = data.parents_names;
        newExtracted.add('parents_names');
      }

      return updated;
    });

    setExtractedFields(prev => new Set([...prev, ...newExtracted]));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum file size is 10MB',
      });
      return;
    }

    // Add to pending documents
    const newDoc: PendingDocument = {
      file,
      docType: selectedDocType,
    };

    setPendingDocuments(prev => [...prev, newDoc]);

    // Upload immediately and run OCR
    await uploadAndExtract(newDoc, pendingDocuments.length);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadAndExtract = async (doc: PendingDocument, index: number) => {
    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Generate unique path (will be moved to candidate folder after creation)
      const fileExt = doc.file.name.split('.').pop();
      const tempPath = `temp/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      setUploadProgress(30);

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('candidate-documents')
        .upload(tempPath, doc.file);

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      // Update pending document with storage path
      setPendingDocuments(prev => 
        prev.map((d, i) => i === index ? { ...d, storagePath: tempPath, uploaded: true } : d)
      );

      setUploadProgress(80);

      // Run OCR extraction
      const extracted = await extractData(tempPath, doc.docType, 'candidate-documents');
      
      if (extracted) {
        applyExtractedData(extracted);
      }

      setUploadProgress(100);

    } catch (error) {
      console.error('Upload/extract error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload document',
      });
      // Remove failed document
      setPendingDocuments(prev => prev.filter((_, i) => i !== index));
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleFileDrop = useCallback((files: FileList) => {
    const file = files[0];
    if (!file) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Maximum file size is 10MB' });
      return;
    }
    const newDoc: PendingDocument = { file, docType: selectedDocType };
    setPendingDocuments(prev => [...prev, newDoc]);
    uploadAndExtract(newDoc, pendingDocuments.length);
  }, [selectedDocType, pendingDocuments.length]);


    const doc = pendingDocuments[index];
    
    // Clean up uploaded file
    if (doc.storagePath) {
      await supabase.storage
        .from('candidate-documents')
        .remove([doc.storagePath]);
    }

    setPendingDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.email) {
      toast({
        variant: 'destructive',
        title: 'Required fields missing',
        description: 'Please provide at least name and email',
      });
      return;
    }

    try {
      // Create candidate
      const candidate = await createCandidate.mutateAsync({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || undefined,
        nationality: formData.nationality || undefined,
        current_country: formData.current_country || undefined,
        linkedin: formData.linkedin || undefined,
        current_stage: formData.current_stage,
        expected_start_date: formData.expected_start_date || undefined,
        passport_number: formData.passport_number || undefined,
        passport_expiry: formData.passport_expiry || undefined,
        passport_issue_date: formData.passport_issue_date || undefined,
        passport_issued_by: formData.passport_issued_by || undefined,
        parents_names: formData.parents_names || undefined,
      });

      // Move documents to candidate folder and create records
      for (const doc of pendingDocuments) {
        if (doc.storagePath && doc.uploaded) {
          const fileExt = doc.file.name.split('.').pop();
          const newPath = `${candidate.id}/${Date.now()}-${doc.file.name}`;

          // Move file
          const { error: moveError } = await supabase.storage
            .from('candidate-documents')
            .move(doc.storagePath, newPath);

          if (moveError) {
            console.error('Failed to move document:', moveError);
            continue;
          }

          // Create document record
          await supabase.from('documents').insert({
            candidate_id: candidate.id,
            file_name: doc.file.name,
            storage_path: newPath,
            doc_type: doc.docType,
          });
        }
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Create candidate error:', error);
    }
  };

  const isFieldExtracted = (field: string) => extractedFields.has(field);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Add New Candidate
            {extractedFields.size > 0 && (
              <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                <Sparkles className="h-3 w-3" />
                AI-extracted data
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Upload Section */}
          <QuickFillDropZone
            selectedDocType={selectedDocType}
            setSelectedDocType={setSelectedDocType}
            isUploading={isUploading}
            isExtracting={isExtracting}
            uploadProgress={uploadProgress}
            pendingDocuments={pendingDocuments}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onFileDrop={handleFileDrop}
            onRemoveDocument={removeDocument}
          />

          {/* Form Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="flex items-center gap-1">
                Full Name *
                {isFieldExtracted('full_name') && (
                  <Sparkles className="h-3 w-3 text-primary" />
                )}
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                required
                className={isFieldExtracted('full_name') ? 'border-primary/50 bg-primary/5' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                Email *
                {isFieldExtracted('email') && (
                  <Sparkles className="h-3 w-3 text-primary" />
                )}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                className={isFieldExtracted('email') ? 'border-primary/50 bg-primary/5' : ''}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                Phone
                {isFieldExtracted('phone') && (
                  <Sparkles className="h-3 w-3 text-primary" />
                )}
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={isFieldExtracted('phone') ? 'border-primary/50 bg-primary/5' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nationality" className="flex items-center gap-1">
                Nationality
                {isFieldExtracted('nationality') && (
                  <Sparkles className="h-3 w-3 text-primary" />
                )}
              </Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => handleChange('nationality', e.target.value)}
                placeholder="e.g., Romanian"
                className={isFieldExtracted('nationality') ? 'border-primary/50 bg-primary/5' : ''}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="current_country" className="flex items-center gap-1">
                Current Country
                {isFieldExtracted('current_country') && (
                  <Sparkles className="h-3 w-3 text-primary" />
                )}
              </Label>
              <Input
                id="current_country"
                value={formData.current_country}
                onChange={(e) => handleChange('current_country', e.target.value)}
                className={isFieldExtracted('current_country') ? 'border-primary/50 bg-primary/5' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_stage">Stage</Label>
              <Select 
                value={formData.current_stage} 
                onValueChange={(v) => handleChange('current_stage', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map(stage => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label.split(' / ')[0]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="linkedin" className="flex items-center gap-1">
                LinkedIn URL
                {isFieldExtracted('linkedin') && (
                  <Sparkles className="h-3 w-3 text-primary" />
                )}
              </Label>
              <Input
                id="linkedin"
                type="url"
                value={formData.linkedin}
                onChange={(e) => handleChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className={isFieldExtracted('linkedin') ? 'border-primary/50 bg-primary/5' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected_start_date">Expected Start Date</Label>
              <Input
                id="expected_start_date"
                type="date"
                value={formData.expected_start_date}
                onChange={(e) => handleChange('expected_start_date', e.target.value)}
              />
            </div>
          </div>

          {/* Passport Section */}
          <div className="border rounded-lg p-4 space-y-4">
            <p className="text-sm font-medium text-foreground">Passport & Identity Information</p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="passport_number" className="flex items-center gap-1">
                  Passport Number
                  {isFieldExtracted('passport_number') && (
                    <Sparkles className="h-3 w-3 text-primary" />
                  )}
                </Label>
                <Input
                  id="passport_number"
                  value={formData.passport_number}
                  onChange={(e) => handleChange('passport_number', e.target.value)}
                  placeholder="e.g., AB1234567"
                  className={isFieldExtracted('passport_number') ? 'border-primary/50 bg-primary/5' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passport_issued_by" className="flex items-center gap-1">
                  Issued By
                  {isFieldExtracted('passport_issued_by') && (
                    <Sparkles className="h-3 w-3 text-primary" />
                  )}
                </Label>
                <Input
                  id="passport_issued_by"
                  value={formData.passport_issued_by}
                  onChange={(e) => handleChange('passport_issued_by', e.target.value)}
                  placeholder="e.g., Government of Romania"
                  className={isFieldExtracted('passport_issued_by') ? 'border-primary/50 bg-primary/5' : ''}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="passport_issue_date" className="flex items-center gap-1">
                  Issue Date
                  {isFieldExtracted('passport_issue_date') && (
                    <Sparkles className="h-3 w-3 text-primary" />
                  )}
                </Label>
                <Input
                  id="passport_issue_date"
                  type="date"
                  value={formData.passport_issue_date}
                  onChange={(e) => handleChange('passport_issue_date', e.target.value)}
                  className={isFieldExtracted('passport_issue_date') ? 'border-primary/50 bg-primary/5' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passport_expiry" className="flex items-center gap-1">
                  Expiry Date
                  {isFieldExtracted('passport_expiry') && (
                    <Sparkles className="h-3 w-3 text-primary" />
                  )}
                </Label>
                <Input
                  id="passport_expiry"
                  type="date"
                  value={formData.passport_expiry}
                  onChange={(e) => handleChange('passport_expiry', e.target.value)}
                  className={isFieldExtracted('passport_expiry') ? 'border-primary/50 bg-primary/5' : ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parents_names" className="flex items-center gap-1">
                Parents Names
                {isFieldExtracted('parents_names') && (
                  <Sparkles className="h-3 w-3 text-primary" />
                )}
              </Label>
              <Input
                id="parents_names"
                value={formData.parents_names}
                onChange={(e) => handleChange('parents_names', e.target.value)}
                placeholder="Father: John Doe, Mother: Jane Doe"
                className={isFieldExtracted('parents_names') ? 'border-primary/50 bg-primary/5' : ''}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createCandidate.isPending || isUploading || isExtracting}
            >
              {createCandidate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Candidate
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
