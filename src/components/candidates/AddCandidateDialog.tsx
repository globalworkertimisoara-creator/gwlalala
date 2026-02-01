import { useState, useRef } from 'react';
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
  { value: 'contract', label: 'Contract' },
  { value: 'other', label: 'Other' },
];

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

  const removeDocument = async (index: number) => {
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
          <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Quick Fill with Documents</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a resume, passport, or other documents to automatically extract candidate information
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
                {isExtracting ? 'Extracting data...' : isUploading ? 'Uploading...' : 'Upload & Extract'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileSelect}
              />
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
                      onClick={() => removeDocument(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
