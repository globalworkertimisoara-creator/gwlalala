import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import { STAGES, RecruitmentStage, DocType } from '@/types/database';
import { useCreateCandidate, useUpdateCandidate } from '@/hooks/useCandidates';
import { useDocumentExtraction, ExtractedData } from '@/hooks/useDocumentExtraction';
import {
  useSaveCandidateEducation,
  useSaveCandidateWorkExperience,
  useSaveCandidateLanguages,
  useSaveCandidateSkills,
  useSaveCandidateReferences,
} from '@/hooks/useCandidateCV';
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
        Drag & drop or browse to upload a resume, passport, or other documents to automatically extract candidate information including education, work experience, languages and skills
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

// Preview of extracted CV structured data
function ExtractedCVPreview({ data }: { data: ExtractedData }) {
  const sections: { label: string; icon: string; count: number }[] = [];
  if (data.education?.length) sections.push({ label: 'Education', icon: '🎓', count: data.education.length });
  if (data.work_experience?.length) sections.push({ label: 'Work Experience', icon: '💼', count: data.work_experience.length });
  if (data.languages?.length) sections.push({ label: 'Languages', icon: '🗣️', count: data.languages.length });
  if (data.skills_list?.length) sections.push({ label: 'Skills', icon: '🛠️', count: data.skills_list.length });
  if (data.references?.length) sections.push({ label: 'References', icon: '📋', count: data.references.length });

  if (sections.length === 0) return null;

  return (
    <div className="border rounded-lg p-3 bg-primary/5 border-primary/30 space-y-2">
      <p className="text-xs font-medium text-primary flex items-center gap-1">
        <Sparkles className="h-3 w-3" />
        CV data extracted — will be saved to profile automatically
      </p>
      <div className="flex flex-wrap gap-2">
        {sections.map(s => (
          <Badge key={s.label} variant="secondary" className="text-xs gap-1">
            {s.icon} {s.count} {s.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function AddCandidateDialog({ open, onOpenChange }: AddCandidateDialogProps) {
  const createCandidate = useCreateCandidate();
  const updateCandidate = useUpdateCandidate();
  const { extractData, isExtracting } = useDocumentExtraction();
  const saveEducation = useSaveCandidateEducation();
  const saveWorkExp = useSaveCandidateWorkExperience();
  const saveLanguages = useSaveCandidateLanguages();
  const saveSkills = useSaveCandidateSkills();
  const saveReferences = useSaveCandidateReferences();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    nationality: '',
    current_country: '',
    current_city: '',
    linkedin: '',
    current_stage: 'sourced' as RecruitmentStage,
    expected_start_date: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    whatsapp: '',
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
  // Store full extracted data for structured CV fields
  const [fullExtractedData, setFullExtractedData] = useState<ExtractedData | null>(null);

  const resetForm = () => {
    setFormData({
      full_name: '', email: '', phone: '', nationality: '', current_country: '',
      current_city: '', linkedin: '', current_stage: 'sourced', expected_start_date: '',
      date_of_birth: '', gender: '', marital_status: '', whatsapp: '',
      passport_number: '', passport_expiry: '', passport_issue_date: '',
      passport_issued_by: '', parents_names: '',
    });
    setPendingDocuments([]);
    setExtractedFields(new Set());
    setFullExtractedData(null);
    setUploadProgress(0);
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      const apply = (field: keyof typeof prev, value?: string | null) => {
        if (value && !prev[field]) { updated[field] = value; newExtracted.add(field); }
      };

      apply('full_name', data.full_name);
      apply('email', data.email);
      apply('phone', data.phone);
      apply('nationality', data.nationality);
      apply('current_country', data.current_country);
      apply('current_city', data.current_city);
      apply('linkedin', data.linkedin);
      apply('date_of_birth', data.date_of_birth);
      apply('gender', data.gender);
      apply('marital_status', data.marital_status);
      apply('whatsapp', data.whatsapp);
      apply('passport_number', data.passport_number);
      apply('passport_expiry', data.passport_expiry);
      apply('passport_issue_date', data.passport_issue_date);
      apply('passport_issued_by', data.passport_issued_by);
      apply('parents_names', data.parents_names);

      return updated;
    });

    setExtractedFields(prev => new Set([...prev, ...newExtracted]));

    // Store full data for structured CV fields
    if (data.education?.length || data.work_experience?.length || data.languages?.length ||
        data.skills_list?.length || data.references?.length) {
      setFullExtractedData(prev => ({
        ...prev,
        ...data,
        // Merge arrays rather than replace
        education: data.education || prev?.education,
        work_experience: data.work_experience || prev?.work_experience,
        languages: data.languages || prev?.languages,
        skills_list: data.skills_list || prev?.skills_list,
        references: data.references || prev?.references,
        driver_license: data.driver_license || prev?.driver_license,
        salary_expectations: data.salary_expectations || prev?.salary_expectations,
        availability: data.availability || prev?.availability,
        job_preferences: data.job_preferences || prev?.job_preferences,
      }));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Maximum file size is 10MB' });
      return;
    }

    const newDoc: PendingDocument = { file, docType: selectedDocType };
    setPendingDocuments(prev => [...prev, newDoc]);
    await uploadAndExtract(newDoc, pendingDocuments.length);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadAndExtract = async (doc: PendingDocument, index: number) => {
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const fileExt = doc.file.name.split('.').pop();
      const tempPath = `temp/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      setUploadProgress(30);

      const { error: uploadError } = await supabase.storage
        .from('candidate-documents')
        .upload(tempPath, doc.file);

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      setPendingDocuments(prev => 
        prev.map((d, i) => i === index ? { ...d, storagePath: tempPath, uploaded: true } : d)
      );

      setUploadProgress(80);

      // Use cv_profile extraction for resume/cv to get full structured data
      const extractionType = (doc.docType === 'resume' || doc.docType === 'cv' as any) 
        ? 'cv_profile' 
        : doc.docType;
      const extracted = await extractData(tempPath, extractionType, 'candidate-documents');
      
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

  const removeDocument = async (index: number) => {
    const doc = pendingDocuments[index];
    if (doc.storagePath) {
      await supabase.storage.from('candidate-documents').remove([doc.storagePath]);
    }
    setPendingDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const saveStructuredCVData = async (candidateId: string) => {
    if (!fullExtractedData) return;

    const promises: Promise<any>[] = [];

    // Save additional candidate fields (JSON fields)
    const extraUpdates: Record<string, any> = {};
    if (fullExtractedData.driver_license) extraUpdates.driver_license = fullExtractedData.driver_license;
    if (fullExtractedData.salary_expectations) extraUpdates.salary_expectations = fullExtractedData.salary_expectations;
    if (fullExtractedData.availability) extraUpdates.availability = fullExtractedData.availability;
    if (fullExtractedData.job_preferences) extraUpdates.job_preferences = fullExtractedData.job_preferences;
    if (Object.keys(extraUpdates).length > 0) {
      promises.push(updateCandidate.mutateAsync({ id: candidateId, ...extraUpdates }));
    }

    if (fullExtractedData.education?.length) {
      promises.push(saveEducation.mutateAsync({
        candidateId,
        entries: fullExtractedData.education.map(e => ({
          education_level: e.education_level || '',
          field_of_study: e.field_of_study || '',
          institution_name: e.institution_name || '',
          graduation_year: e.graduation_year || null,
          degree_obtained: e.degree_obtained || '',
        })),
      }));
    }

    if (fullExtractedData.work_experience?.length) {
      promises.push(saveWorkExp.mutateAsync({
        candidateId,
        entries: fullExtractedData.work_experience.map(e => ({
          job_title: e.job_title || '',
          company_name: e.company_name || '',
          country: e.country || '',
          start_date: e.start_date || '',
          end_date: e.end_date || '',
          job_description: e.job_description || '',
        })),
      }));
    }

    if (fullExtractedData.languages?.length) {
      promises.push(saveLanguages.mutateAsync({
        candidateId,
        entries: fullExtractedData.languages.map(l => ({
          language_name: l.language_name || '',
          proficiency_level: l.proficiency_level || 'basic',
        })),
      }));
    }

    if (fullExtractedData.skills_list?.length) {
      promises.push(saveSkills.mutateAsync({
        candidateId,
        entries: fullExtractedData.skills_list.map(s => ({
          skill_name: s.skill_name || '',
          years_experience: s.years_experience || null,
        })),
      }));
    }

    if (fullExtractedData.references?.length) {
      promises.push(saveReferences.mutateAsync({
        candidateId,
        entries: fullExtractedData.references.map(r => ({
          reference_name: r.reference_name || '',
          position_title: r.position_title || '',
          phone: r.phone || '',
          email: r.email || '',
          relationship: r.relationship || '',
        })),
      }));
    }

    await Promise.all(promises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.email) {
      toast({ variant: 'destructive', title: 'Required fields missing', description: 'Please provide at least name and email' });
      return;
    }

    try {
      const candidate = await createCandidate.mutateAsync({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || undefined,
        nationality: formData.nationality || undefined,
        current_country: formData.current_country || undefined,
        current_city: formData.current_city || undefined,
        linkedin: formData.linkedin || undefined,
        current_stage: formData.current_stage,
        expected_start_date: formData.expected_start_date || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        marital_status: formData.marital_status || undefined,
        whatsapp: formData.whatsapp || undefined,
        passport_number: formData.passport_number || undefined,
        passport_expiry: formData.passport_expiry || undefined,
        passport_issue_date: formData.passport_issue_date || undefined,
        passport_issued_by: formData.passport_issued_by || undefined,
        parents_names: formData.parents_names || undefined,
      });

      // Save structured CV data (education, work experience, languages, skills, references)
      await saveStructuredCVData(candidate.id);

      // Move documents to candidate folder and create records
      for (const doc of pendingDocuments) {
        if (doc.storagePath && doc.uploaded) {
          const newPath = `${candidate.id}/${Date.now()}-${doc.file.name}`;
          const { error: moveError } = await supabase.storage
            .from('candidate-documents')
            .move(doc.storagePath, newPath);

          if (moveError) {
            console.error('Failed to move document:', moveError);
            continue;
          }

          await supabase.from('documents').insert({
            candidate_id: candidate.id,
            file_name: doc.file.name,
            storage_path: newPath,
            doc_type: doc.docType,
          });
        }
      }

      if (fullExtractedData) {
        toast({ title: 'Candidate created with CV data', description: 'All extracted information has been saved to the profile.' });
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Create candidate error:', error);
    }
  };

  const isFieldExtracted = (field: string) => extractedFields.has(field);

  const fieldInput = (field: keyof typeof formData, label: string, props?: Record<string, any>) => (
    <div className="space-y-2">
      <Label htmlFor={field} className="flex items-center gap-1">
        {label}
        {props?.required && ' *'}
        {isFieldExtracted(field) && <Sparkles className="h-3 w-3 text-primary" />}
      </Label>
      <Input
        id={field}
        value={formData[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        className={isFieldExtracted(field) ? 'border-primary/50 bg-primary/5' : ''}
        {...props}
      />
    </div>
  );

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

          {/* Extracted CV Data Preview */}
          {fullExtractedData && <ExtractedCVPreview data={fullExtractedData} />}

          {/* Form Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            {fieldInput('full_name', 'Full Name', { required: true })}
            {fieldInput('email', 'Email', { required: true, type: 'email' })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {fieldInput('phone', 'Phone')}
            {fieldInput('nationality', 'Nationality', { placeholder: 'e.g., Romanian' })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {fieldInput('current_country', 'Current Country')}
            {fieldInput('current_city', 'Current City')}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {fieldInput('date_of_birth', 'Date of Birth', { type: 'date' })}
            <div className="space-y-2">
              <Label htmlFor="gender" className="flex items-center gap-1">
                Gender
                {isFieldExtracted('gender') && <Sparkles className="h-3 w-3 text-primary" />}
              </Label>
              <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                <SelectTrigger className={isFieldExtracted('gender') ? 'border-primary/50 bg-primary/5' : ''}>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="marital_status" className="flex items-center gap-1">
                Marital Status
                {isFieldExtracted('marital_status') && <Sparkles className="h-3 w-3 text-primary" />}
              </Label>
              <Select value={formData.marital_status} onValueChange={(v) => handleChange('marital_status', v)}>
                <SelectTrigger className={isFieldExtracted('marital_status') ? 'border-primary/50 bg-primary/5' : ''}>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {fieldInput('whatsapp', 'WhatsApp')}
            {fieldInput('linkedin', 'LinkedIn URL', { type: 'url', placeholder: 'https://linkedin.com/in/...' })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {fieldInput('expected_start_date', 'Expected Start Date', { type: 'date' })}
            <div className="space-y-2">
              <Label htmlFor="current_stage">Stage</Label>
              <Select value={formData.current_stage} onValueChange={(v) => handleChange('current_stage', v)}>
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

          {/* Passport Section */}
          <div className="border rounded-lg p-4 space-y-4">
            <p className="text-sm font-medium text-foreground">Passport & Identity Information</p>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {fieldInput('passport_number', 'Passport Number', { placeholder: 'e.g., AB1234567' })}
              {fieldInput('passport_issued_by', 'Issued By', { placeholder: 'e.g., Government of Romania' })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {fieldInput('passport_issue_date', 'Issue Date', { type: 'date' })}
              {fieldInput('passport_expiry', 'Expiry Date', { type: 'date' })}
            </div>

            {fieldInput('parents_names', 'Parents Names', { placeholder: 'Father: John Doe, Mother: Jane Doe' })}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCandidate.isPending || isUploading || isExtracting}>
              {createCandidate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Candidate
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
