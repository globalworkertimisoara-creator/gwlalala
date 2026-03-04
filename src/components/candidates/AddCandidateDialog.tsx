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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, Upload, FileText, Sparkles, X, CheckCircle2,
  ChevronDown, Plus, Trash2, GraduationCap, Briefcase,
  Car, DollarSign, Target, CalendarDays,
} from 'lucide-react';
import { STAGES, RecruitmentStage, DocType } from '@/types/database';
import { useCreateCandidate, useUpdateCandidate } from '@/hooks/useCandidates';
import { useQueryClient } from '@tanstack/react-query';
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

interface EducationEntry {
  education_level: string;
  field_of_study: string;
  institution_name: string;
  graduation_year: number | null;
  degree_obtained: string;
}

interface WorkEntry {
  job_title: string;
  company_name: string;
  country: string;
  start_date: string;
  end_date: string;
  job_description: string;
}

interface LanguageEntry {
  language_name: string;
  proficiency_level: string;
}

interface SkillEntry {
  skill_name: string;
  years_experience: number | null;
}

interface ReferenceEntry {
  reference_name: string;
  position_title: string;
  phone: string;
  email: string;
  relationship: string;
}

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: 'resume', label: 'Resume/CV' },
  { value: 'passport', label: 'Passport' },
  { value: 'visa', label: 'Visa Document' },
  { value: 'residence_permit', label: 'Residence Permit' },
  { value: 'contract', label: 'Contract' },
  { value: 'other', label: 'Other' },
];

const EDUCATION_LEVELS = ['High School', "Bachelor's", "Master's", 'PhD', 'Vocational', 'Certificate', 'Other'];
const PROFICIENCY_LEVELS = ['basic', 'intermediate', 'advanced', 'fluent', 'native'];

// ─── Quick Fill Drop Zone ────────────────────────────────────────────────────
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

  return (
    <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Quick Fill with Documents</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Upload a CV to auto-fill all fields including education, work experience, languages, skills and more
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
        <Button type="button" variant="outline" className="gap-2 flex-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isExtracting}>
          {isUploading || isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {isExtracting ? 'Extracting...' : isUploading ? 'Uploading...' : 'Browse Files'}
        </Button>
        <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={onFileSelect} />
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={e => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={e => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files?.length) onFileDrop(e.dataTransfer.files); }}
        onClick={() => !(isUploading || isExtracting) && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
      >
        <Upload className={`h-6 w-6 mx-auto mb-1 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
        <p className="text-sm font-medium">{isDragOver ? 'Drop files here' : 'Drag & drop files here'}</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, DOC, DOCX — max 10MB</p>
      </div>

      {uploadProgress > 0 && <Progress value={uploadProgress} className="h-1" />}

      {pendingDocuments.length > 0 && (
        <div className="space-y-1">
          {pendingDocuments.map((doc, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded-md bg-background border">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{doc.file.name}</p>
                <p className="text-xs text-muted-foreground">{DOC_TYPES.find(d => d.value === doc.docType)?.label}</p>
              </div>
              {doc.uploaded ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> : <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onRemoveDocument(idx)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Collapsible Section ─────────────────────────────────────────────────────
function Section({ title, icon, count, children, defaultOpen = false }: {
  title: string; icon: React.ReactNode; count?: number; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button type="button" className="flex items-center gap-2 w-full p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors text-left">
          {icon}
          <span className="text-sm font-medium flex-1">{title}</span>
          {count !== undefined && count > 0 && <Badge variant="secondary" className="text-xs">{count}</Badge>}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Main Dialog ─────────────────────────────────────────────────────────────
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

  // ── Personal & Contact ──
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', nationality: '', current_country: '',
    current_city: '', linkedin: '', current_stage: 'sourced' as RecruitmentStage,
    expected_start_date: '', date_of_birth: '', gender: '', marital_status: '',
    whatsapp: '', number_of_children: 0,
    // Passport
    passport_number: '', passport_expiry: '', passport_issue_date: '',
    passport_issued_by: '', national_id_number: '', parents_names: '',
  });

  // ── Structured CV data ──
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [workExperience, setWorkExperience] = useState<WorkEntry[]>([]);
  const [languages, setLanguages] = useState<LanguageEntry[]>([]);
  const [skills, setSkills] = useState<SkillEntry[]>([]);
  const [references, setReferences] = useState<ReferenceEntry[]>([]);

  // ── JSON fields ──
  const [salary, setSalary] = useState({ current_salary: '', expected_salary: '', currency: '', negotiable: false });
  const [availability, setAvailability] = useState({ available_to_start: '', employment_status: '', notice_period: '', willing_to_relocate: false });
  const [jobPrefs, setJobPrefs] = useState({ preferred_titles: '', preferred_countries: '', preferred_work_type: '' });
  const [driverLicense, setDriverLicense] = useState({ has_license: false, license_type: '', years_experience: null as number | null });
  const [family, setFamily] = useState({ has_spouse: false, children_ages: '', family_willing_to_relocate: false });

  // ── Document state ──
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<DocType>('resume');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedFields, setExtractedFields] = useState<Set<string>>(new Set());

  const resetForm = () => {
    setFormData({
      full_name: '', email: '', phone: '', nationality: '', current_country: '',
      current_city: '', linkedin: '', current_stage: 'sourced' as RecruitmentStage,
      expected_start_date: '', date_of_birth: '', gender: '', marital_status: '',
      whatsapp: '', number_of_children: 0,
      passport_number: '', passport_expiry: '', passport_issue_date: '',
      passport_issued_by: '', national_id_number: '', parents_names: '',
    });
    setEducation([]); setWorkExperience([]); setLanguages([]); setSkills([]); setReferences([]);
    setSalary({ current_salary: '', expected_salary: '', currency: '', negotiable: false });
    setAvailability({ available_to_start: '', employment_status: '', notice_period: '', willing_to_relocate: false });
    setJobPrefs({ preferred_titles: '', preferred_countries: '', preferred_work_type: '' });
    setDriverLicense({ has_license: false, license_type: '', years_experience: null });
    setFamily({ has_spouse: false, children_ages: '', family_willing_to_relocate: false });
    setPendingDocuments([]); setExtractedFields(new Set()); setUploadProgress(0);
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setExtractedFields(prev => { const next = new Set(prev); next.delete(field); return next; });
  };

  const applyExtractedData = (data: ExtractedData) => {
    const newExtracted = new Set<string>();
    setFormData(prev => {
      const updated = { ...prev };
      const apply = (field: keyof typeof prev, value?: string | null) => {
        if (value && !prev[field]) { (updated as any)[field] = value; newExtracted.add(field); }
      };
      apply('full_name', data.full_name); apply('email', data.email); apply('phone', data.phone);
      apply('nationality', data.nationality); apply('current_country', data.current_country);
      apply('current_city', data.current_city); apply('linkedin', data.linkedin);
      apply('date_of_birth', data.date_of_birth); apply('gender', data.gender);
      apply('marital_status', data.marital_status); apply('whatsapp', data.whatsapp);
      apply('passport_number', data.passport_number); apply('passport_expiry', data.passport_expiry);
      apply('passport_issue_date', data.passport_issue_date); apply('passport_issued_by', data.passport_issued_by);
      apply('national_id_number', data.national_id_number); apply('parents_names', data.parents_names);
      return updated;
    });
    setExtractedFields(prev => new Set([...prev, ...newExtracted]));

    // Structured data
    if (data.education?.length) setEducation(data.education.map(e => ({
      education_level: e.education_level || '', field_of_study: e.field_of_study || '',
      institution_name: e.institution_name || '', graduation_year: e.graduation_year || null,
      degree_obtained: e.degree_obtained || '',
    })));
    if (data.work_experience?.length) setWorkExperience(data.work_experience.map(e => ({
      job_title: e.job_title || '', company_name: e.company_name || '', country: e.country || '',
      start_date: e.start_date || '', end_date: e.end_date || '', job_description: e.job_description || '',
    })));
    if (data.languages?.length) setLanguages(data.languages.map(l => ({
      language_name: l.language_name || '', proficiency_level: l.proficiency_level || 'basic',
    })));
    if (data.skills_list?.length) setSkills(data.skills_list.map(s => ({
      skill_name: s.skill_name || '', years_experience: s.years_experience || null,
    })));
    if (data.references?.length) setReferences(data.references.map(r => ({
      reference_name: r.reference_name || '', position_title: r.position_title || '',
      phone: r.phone || '', email: r.email || '', relationship: r.relationship || '',
    })));
    if (data.salary_expectations) setSalary(s => ({
      current_salary: data.salary_expectations?.current_salary || s.current_salary,
      expected_salary: data.salary_expectations?.expected_salary || s.expected_salary,
      currency: data.salary_expectations?.currency || s.currency,
      negotiable: data.salary_expectations?.negotiable ?? s.negotiable,
    }));
    if (data.availability) setAvailability(a => ({
      available_to_start: data.availability?.available_to_start || a.available_to_start,
      employment_status: data.availability?.employment_status || a.employment_status,
      notice_period: data.availability?.notice_period || a.notice_period,
      willing_to_relocate: data.availability?.willing_to_relocate ?? a.willing_to_relocate,
    }));
    if (data.job_preferences) setJobPrefs(j => ({
      preferred_titles: data.job_preferences?.preferred_titles || j.preferred_titles,
      preferred_countries: data.job_preferences?.preferred_countries || j.preferred_countries,
      preferred_work_type: data.job_preferences?.preferred_work_type || j.preferred_work_type,
    }));
    if (data.driver_license) setDriverLicense(d => ({
      has_license: data.driver_license?.has_license ?? d.has_license,
      license_type: data.driver_license?.license_type || d.license_type,
      years_experience: data.driver_license?.years_experience ?? d.years_experience,
    }));
    if (data.family_info) setFamily(f => ({
      has_spouse: data.family_info?.has_spouse ?? f.has_spouse,
      children_ages: data.family_info?.children_ages || f.children_ages,
      family_willing_to_relocate: data.family_info?.family_willing_to_relocate ?? f.family_willing_to_relocate,
    }));
  };

  // ── File handling ──
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Maximum 10MB' });
      return;
    }
    const newDoc: PendingDocument = { file, docType: selectedDocType };
    setPendingDocuments(prev => [...prev, newDoc]);
    await uploadAndExtract(newDoc, pendingDocuments.length);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadAndExtract = async (doc: PendingDocument, index: number) => {
    setIsUploading(true); setUploadProgress(10);
    try {
      const fileExt = doc.file.name.split('.').pop();
      const tempPath = `temp/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      setUploadProgress(30);
      const { error: uploadError } = await supabase.storage.from('candidate-documents').upload(tempPath, doc.file);
      if (uploadError) throw uploadError;
      setUploadProgress(60);
      setPendingDocuments(prev => prev.map((d, i) => i === index ? { ...d, storagePath: tempPath, uploaded: true } : d));
      setUploadProgress(80);
      const extractionType = (doc.docType === 'resume') ? 'cv_profile' : doc.docType;
      const extracted = await extractData(tempPath, extractionType, 'candidate-documents');
      if (extracted) applyExtractedData(extracted);
      setUploadProgress(100);
    } catch (error) {
      console.error('Upload/extract error:', error);
      toast({ variant: 'destructive', title: 'Upload failed', description: error instanceof Error ? error.message : 'Failed to upload' });
      setPendingDocuments(prev => prev.filter((_, i) => i !== index));
    } finally {
      setIsUploading(false); setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleFileDrop = useCallback((files: FileList) => {
    const file = files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast({ variant: 'destructive', title: 'File too large', description: 'Max 10MB' }); return; }
    const newDoc: PendingDocument = { file, docType: selectedDocType };
    setPendingDocuments(prev => [...prev, newDoc]);
    uploadAndExtract(newDoc, pendingDocuments.length);
  }, [selectedDocType, pendingDocuments.length]);

  const removeDocument = async (index: number) => {
    const doc = pendingDocuments[index];
    if (doc.storagePath) await supabase.storage.from('candidate-documents').remove([doc.storagePath]);
    setPendingDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name) {
      toast({ variant: 'destructive', title: 'Name required', description: 'Please provide a name' });
      return;
    }

    try {
      const hasSalary = salary.current_salary || salary.expected_salary;
      const hasAvail = availability.available_to_start || availability.employment_status;
      const hasPrefs = jobPrefs.preferred_titles || jobPrefs.preferred_countries;
      const hasFamily = family.has_spouse || family.children_ages;

      const candidate = await createCandidate.mutateAsync({
        full_name: formData.full_name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        nationality: formData.nationality || undefined,
        current_country: formData.current_country || undefined,
        current_city: formData.current_city || undefined,
        linkedin: formData.linkedin || undefined,
        current_stage: formData.current_stage as RecruitmentStage,
        expected_start_date: formData.expected_start_date || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        marital_status: formData.marital_status || undefined,
        whatsapp: formData.whatsapp || undefined,
        number_of_children: formData.number_of_children || undefined,
        passport_number: formData.passport_number || undefined,
        passport_expiry: formData.passport_expiry || undefined,
        passport_issue_date: formData.passport_issue_date || undefined,
        passport_issued_by: formData.passport_issued_by || undefined,
        national_id_number: formData.national_id_number || undefined,
        parents_names: formData.parents_names || undefined,
        driver_license: driverLicense.has_license ? driverLicense : undefined,
        salary_expectations: hasSalary ? salary : undefined,
        availability: hasAvail ? availability : undefined,
        job_preferences: hasPrefs ? jobPrefs : undefined,
        family_info: hasFamily ? family : undefined,
      });

      // Save structured CV data
      const promises: Promise<any>[] = [];
      if (education.length > 0) promises.push(saveEducation.mutateAsync({ candidateId: candidate.id, entries: education }));
      if (workExperience.length > 0) promises.push(saveWorkExp.mutateAsync({ candidateId: candidate.id, entries: workExperience }));
      if (languages.length > 0) promises.push(saveLanguages.mutateAsync({ candidateId: candidate.id, entries: languages }));
      if (skills.length > 0) promises.push(saveSkills.mutateAsync({ candidateId: candidate.id, entries: skills }));
      if (references.length > 0) promises.push(saveReferences.mutateAsync({ candidateId: candidate.id, entries: references }));
      await Promise.all(promises);

      // Explicitly invalidate CV queries so they're fresh when detail page loads
      if (promises.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['candidate-education', candidate.id] });
        queryClient.invalidateQueries({ queryKey: ['candidate-work-experience', candidate.id] });
        queryClient.invalidateQueries({ queryKey: ['candidate-languages', candidate.id] });
        queryClient.invalidateQueries({ queryKey: ['candidate-skills', candidate.id] });
        queryClient.invalidateQueries({ queryKey: ['candidate-references', candidate.id] });
      }

      // Move documents to candidate folder
      for (const doc of pendingDocuments) {
        if (doc.storagePath && doc.uploaded) {
          const newPath = `${candidate.id}/${Date.now()}-${doc.file.name}`;
          const { error: moveError } = await supabase.storage.from('candidate-documents').move(doc.storagePath, newPath);
          if (moveError) { console.error('Move error:', moveError); continue; }
          await supabase.from('documents').insert({ candidate_id: candidate.id, file_name: doc.file.name, storage_path: newPath, doc_type: doc.docType });
        }
      }

      const cvDataCount = education.length + workExperience.length + languages.length + skills.length + references.length;
      if (cvDataCount > 0) {
        toast({ title: 'Candidate created with full CV data', description: `Saved ${cvDataCount} CV entries to profile.` });
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Create candidate error:', error);
    }
  };

  const isFieldExtracted = (field: string) => extractedFields.has(field);
  const ext = (field: string) => isFieldExtracted(field) ? 'border-primary/50 bg-primary/5' : '';
  const extLabel = (field: string) => isFieldExtracted(field) ? <Sparkles className="h-3 w-3 text-primary" /> : null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); onOpenChange(isOpen); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Add New Candidate
            {extractedFields.size > 0 && (
              <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                <Sparkles className="h-3 w-3" /> AI-extracted
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Upload a CV to auto-fill all fields, or fill manually. Only name is required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── Quick Fill ── */}
          <QuickFillDropZone
            selectedDocType={selectedDocType} setSelectedDocType={setSelectedDocType}
            isUploading={isUploading} isExtracting={isExtracting} uploadProgress={uploadProgress}
            pendingDocuments={pendingDocuments} fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect} onFileDrop={handleFileDrop} onRemoveDocument={removeDocument}
          />

          {/* ── Personal Info ── */}
          <Section title="Personal Information" icon={<span>👤</span>} defaultOpen={true}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div><Label className="flex items-center gap-1">Full Name * {extLabel('full_name')}</Label>
                <Input value={formData.full_name} onChange={e => handleChange('full_name', e.target.value)} required className={ext('full_name')} /></div>
              <div><Label className="flex items-center gap-1">Date of Birth {extLabel('date_of_birth')}</Label>
                <Input type="date" value={formData.date_of_birth} onChange={e => handleChange('date_of_birth', e.target.value)} className={ext('date_of_birth')} /></div>
              <div><Label className="flex items-center gap-1">Gender {extLabel('gender')}</Label>
                <Select value={formData.gender || '_none'} onValueChange={v => handleChange('gender', v === '_none' ? '' : v)}>
                  <SelectTrigger className={ext('gender')}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Not specified</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select></div>
              <div><Label className="flex items-center gap-1">Nationality {extLabel('nationality')}</Label>
                <Input value={formData.nationality} onChange={e => handleChange('nationality', e.target.value)} className={ext('nationality')} /></div>
              <div><Label className="flex items-center gap-1">Marital Status {extLabel('marital_status')}</Label>
                <Select value={formData.marital_status || '_none'} onValueChange={v => handleChange('marital_status', v === '_none' ? '' : v)}>
                  <SelectTrigger className={ext('marital_status')}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Not specified</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="divorced">Divorced</SelectItem>
                    <SelectItem value="widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select></div>
              <div><Label>Number of Children</Label>
                <Input type="number" min={0} value={formData.number_of_children} onChange={e => handleChange('number_of_children', parseInt(e.target.value) || 0)} /></div>
            </div>
          </Section>

          {/* ── Contact ── */}
          <Section title="Contact" icon={<span>📞</span>} defaultOpen={true}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div><Label className="flex items-center gap-1">Email {extLabel('email')}</Label>
                <Input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} className={ext('email')} /></div>
              <div><Label className="flex items-center gap-1">Phone {extLabel('phone')}</Label>
                <Input value={formData.phone} onChange={e => handleChange('phone', e.target.value)} className={ext('phone')} /></div>
              <div><Label className="flex items-center gap-1">WhatsApp {extLabel('whatsapp')}</Label>
                <Input value={formData.whatsapp} onChange={e => handleChange('whatsapp', e.target.value)} className={ext('whatsapp')} /></div>
              <div><Label className="flex items-center gap-1">Current Country {extLabel('current_country')}</Label>
                <Input value={formData.current_country} onChange={e => handleChange('current_country', e.target.value)} className={ext('current_country')} /></div>
              <div><Label className="flex items-center gap-1">Current City {extLabel('current_city')}</Label>
                <Input value={formData.current_city} onChange={e => handleChange('current_city', e.target.value)} className={ext('current_city')} /></div>
              <div><Label className="flex items-center gap-1">LinkedIn {extLabel('linkedin')}</Label>
                <Input value={formData.linkedin} onChange={e => handleChange('linkedin', e.target.value)} className={ext('linkedin')} /></div>
            </div>
          </Section>

          {/* ── Recruitment ── */}
          <Section title="Recruitment" icon={<span>📋</span>} defaultOpen={true}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Stage</Label>
                <Select value={formData.current_stage} onValueChange={v => handleChange('current_stage', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label.split(' / ')[0]}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Expected Start Date</Label>
                <Input type="date" value={formData.expected_start_date} onChange={e => handleChange('expected_start_date', e.target.value)} /></div>
            </div>
          </Section>

          {/* ── Education ── */}
          <Section title="Education" icon={<GraduationCap className="h-4 w-4" />} count={education.length}>
            {education.map((entry, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Entry {i + 1}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEducation(e => e.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div><Label className="text-xs">Level</Label>
                    <Select value={entry.education_level || '_none'} onValueChange={v => setEducation(e => e.map((x, idx) => idx === i ? { ...x, education_level: v === '_none' ? '' : v } : x))}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{EDUCATION_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select></div>
                  <div><Label className="text-xs">Field of Study</Label>
                    <Input value={entry.field_of_study} onChange={e => setEducation(ed => ed.map((x, idx) => idx === i ? { ...x, field_of_study: e.target.value } : x))} /></div>
                  <div><Label className="text-xs">Institution</Label>
                    <Input value={entry.institution_name} onChange={e => setEducation(ed => ed.map((x, idx) => idx === i ? { ...x, institution_name: e.target.value } : x))} /></div>
                  <div><Label className="text-xs">Graduation Year</Label>
                    <Input type="number" value={entry.graduation_year ?? ''} onChange={e => setEducation(ed => ed.map((x, idx) => idx === i ? { ...x, graduation_year: parseInt(e.target.value) || null } : x))} /></div>
                </div>
              </div>
            ))}
            {education.length < 3 && (
              <Button type="button" variant="outline" size="sm" className="gap-1"
                onClick={() => setEducation(e => [...e, { education_level: '', field_of_study: '', institution_name: '', graduation_year: null, degree_obtained: '' }])}>
                <Plus className="h-3 w-3" /> Add Education
              </Button>
            )}
          </Section>

          {/* ── Work Experience ── */}
          <Section title="Work Experience" icon={<Briefcase className="h-4 w-4" />} count={workExperience.length}>
            {workExperience.map((entry, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Entry {i + 1}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setWorkExperience(e => e.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div><Label className="text-xs">Job Title</Label>
                    <Input value={entry.job_title} onChange={e => setWorkExperience(w => w.map((x, idx) => idx === i ? { ...x, job_title: e.target.value } : x))} /></div>
                  <div><Label className="text-xs">Company</Label>
                    <Input value={entry.company_name} onChange={e => setWorkExperience(w => w.map((x, idx) => idx === i ? { ...x, company_name: e.target.value } : x))} /></div>
                  <div><Label className="text-xs">Country</Label>
                    <Input value={entry.country} onChange={e => setWorkExperience(w => w.map((x, idx) => idx === i ? { ...x, country: e.target.value } : x))} /></div>
                  <div><Label className="text-xs">Start Date</Label>
                    <Input type="date" value={entry.start_date} onChange={e => setWorkExperience(w => w.map((x, idx) => idx === i ? { ...x, start_date: e.target.value } : x))} /></div>
                  <div><Label className="text-xs">End Date</Label>
                    <Input type="date" value={entry.end_date} onChange={e => setWorkExperience(w => w.map((x, idx) => idx === i ? { ...x, end_date: e.target.value } : x))} /></div>
                </div>
                <div><Label className="text-xs">Description</Label>
                  <Textarea rows={2} value={entry.job_description} onChange={e => setWorkExperience(w => w.map((x, idx) => idx === i ? { ...x, job_description: e.target.value } : x))} /></div>
              </div>
            ))}
            {workExperience.length < 5 && (
              <Button type="button" variant="outline" size="sm" className="gap-1"
                onClick={() => setWorkExperience(w => [...w, { job_title: '', company_name: '', country: '', start_date: '', end_date: '', job_description: '' }])}>
                <Plus className="h-3 w-3" /> Add Work Experience
              </Button>
            )}
          </Section>

          {/* ── Languages ── */}
          <Section title="Languages" icon={<span>🗣️</span>} count={languages.length}>
            {languages.map((entry, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1"><Label className="text-xs">Language</Label>
                  <Input value={entry.language_name} onChange={e => setLanguages(l => l.map((x, idx) => idx === i ? { ...x, language_name: e.target.value } : x))} /></div>
                <div className="w-[140px]"><Label className="text-xs">Level</Label>
                  <Select value={entry.proficiency_level} onValueChange={v => setLanguages(l => l.map((x, idx) => idx === i ? { ...x, proficiency_level: v } : x))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROFICIENCY_LEVELS.map(l => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}</SelectContent>
                  </Select></div>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setLanguages(l => l.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="gap-1"
              onClick={() => setLanguages(l => [...l, { language_name: '', proficiency_level: 'basic' }])}>
              <Plus className="h-3 w-3" /> Add Language
            </Button>
          </Section>

          {/* ── Skills ── */}
          <Section title="Skills" icon={<span>🛠️</span>} count={skills.length}>
            {skills.map((entry, i) => (
              <div key={i} className="flex gap-2 items-end">
                <div className="flex-1"><Label className="text-xs">Skill</Label>
                  <Input value={entry.skill_name} onChange={e => setSkills(s => s.map((x, idx) => idx === i ? { ...x, skill_name: e.target.value } : x))} /></div>
                <div className="w-[100px]"><Label className="text-xs">Years</Label>
                  <Input type="number" min={0} value={entry.years_experience ?? ''} onChange={e => setSkills(s => s.map((x, idx) => idx === i ? { ...x, years_experience: parseInt(e.target.value) || null } : x))} /></div>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setSkills(s => s.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="gap-1"
              onClick={() => setSkills(s => [...s, { skill_name: '', years_experience: null }])}>
              <Plus className="h-3 w-3" /> Add Skill
            </Button>
          </Section>

          {/* ── References ── */}
          <Section title="References" icon={<span>📋</span>} count={references.length}>
            {references.map((entry, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Reference {i + 1}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReferences(r => r.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div><Label className="text-xs">Name</Label>
                    <Input value={entry.reference_name} onChange={e => setReferences(r => r.map((x, idx) => idx === i ? { ...x, reference_name: e.target.value } : x))} /></div>
                  <div><Label className="text-xs">Position</Label>
                    <Input value={entry.position_title} onChange={e => setReferences(r => r.map((x, idx) => idx === i ? { ...x, position_title: e.target.value } : x))} /></div>
                  <div><Label className="text-xs">Phone</Label>
                    <Input value={entry.phone} onChange={e => setReferences(r => r.map((x, idx) => idx === i ? { ...x, phone: e.target.value } : x))} /></div>
                  <div><Label className="text-xs">Email</Label>
                    <Input value={entry.email} onChange={e => setReferences(r => r.map((x, idx) => idx === i ? { ...x, email: e.target.value } : x))} /></div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="gap-1"
              onClick={() => setReferences(r => [...r, { reference_name: '', position_title: '', phone: '', email: '', relationship: '' }])}>
              <Plus className="h-3 w-3" /> Add Reference
            </Button>
          </Section>

          {/* ── Passport & Identity ── */}
          <Section title="Passport & Identity" icon={<span>🛂</span>}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label className="flex items-center gap-1">Passport Number {extLabel('passport_number')}</Label>
                <Input value={formData.passport_number} onChange={e => handleChange('passport_number', e.target.value)} className={ext('passport_number')} /></div>
              <div><Label className="flex items-center gap-1">Issued By {extLabel('passport_issued_by')}</Label>
                <Input value={formData.passport_issued_by} onChange={e => handleChange('passport_issued_by', e.target.value)} className={ext('passport_issued_by')} /></div>
              <div><Label className="flex items-center gap-1">Issue Date {extLabel('passport_issue_date')}</Label>
                <Input type="date" value={formData.passport_issue_date} onChange={e => handleChange('passport_issue_date', e.target.value)} className={ext('passport_issue_date')} /></div>
              <div><Label className="flex items-center gap-1">Expiry Date {extLabel('passport_expiry')}</Label>
                <Input type="date" value={formData.passport_expiry} onChange={e => handleChange('passport_expiry', e.target.value)} className={ext('passport_expiry')} /></div>
              <div><Label className="flex items-center gap-1">National ID {extLabel('national_id_number')}</Label>
                <Input value={formData.national_id_number} onChange={e => handleChange('national_id_number', e.target.value)} className={ext('national_id_number')} /></div>
              <div><Label className="flex items-center gap-1">Parents Names {extLabel('parents_names')}</Label>
                <Input value={formData.parents_names} onChange={e => handleChange('parents_names', e.target.value)} placeholder="Father: ..., Mother: ..." className={ext('parents_names')} /></div>
            </div>
          </Section>

          {/* ── Driver's License ── */}
          <Section title="Driver's License" icon={<Car className="h-4 w-4" />}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><Label>Has License?</Label>
                <Select value={driverLicense.has_license ? 'yes' : 'no'} onValueChange={v => setDriverLicense(d => ({ ...d, has_license: v === 'yes' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent>
                </Select></div>
              {driverLicense.has_license && <>
                <div><Label>Type</Label>
                  <Input value={driverLicense.license_type} onChange={e => setDriverLicense(d => ({ ...d, license_type: e.target.value }))} placeholder="e.g., B, C, CE" /></div>
                <div><Label>Years Driving</Label>
                  <Input type="number" min={0} value={driverLicense.years_experience ?? ''} onChange={e => setDriverLicense(d => ({ ...d, years_experience: parseInt(e.target.value) || null }))} /></div>
              </>}
            </div>
          </Section>

          {/* ── Salary & Availability ── */}
          <Section title="Salary & Availability" icon={<DollarSign className="h-4 w-4" />}>
            <p className="text-xs font-medium text-muted-foreground mb-1">Salary Expectations</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><Label className="text-xs">Current Salary</Label>
                <Input value={salary.current_salary} onChange={e => setSalary(s => ({ ...s, current_salary: e.target.value }))} /></div>
              <div><Label className="text-xs">Expected Salary</Label>
                <Input value={salary.expected_salary} onChange={e => setSalary(s => ({ ...s, expected_salary: e.target.value }))} /></div>
              <div><Label className="text-xs">Currency</Label>
                <Input value={salary.currency} onChange={e => setSalary(s => ({ ...s, currency: e.target.value }))} placeholder="EUR, USD..." /></div>
              <div><Label className="text-xs">Negotiable?</Label>
                <Select value={salary.negotiable ? 'yes' : 'no'} onValueChange={v => setSalary(s => ({ ...s, negotiable: v === 'yes' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select></div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mb-1 mt-3">Availability</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><Label className="text-xs">Available to Start</Label>
                <Select value={availability.available_to_start || '_none'} onValueChange={v => setAvailability(a => ({ ...a, available_to_start: v === '_none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Not specified</SelectItem>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="2_weeks">2 Weeks</SelectItem>
                    <SelectItem value="1_month">1 Month</SelectItem>
                    <SelectItem value="2_months">2 Months</SelectItem>
                    <SelectItem value="3_months">3 Months</SelectItem>
                  </SelectContent>
                </Select></div>
              <div><Label className="text-xs">Employment Status</Label>
                <Select value={availability.employment_status || '_none'} onValueChange={v => setAvailability(a => ({ ...a, employment_status: v === '_none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Not specified</SelectItem>
                    <SelectItem value="employed">Employed</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                  </SelectContent>
                </Select></div>
              <div><Label className="text-xs">Notice Period</Label>
                <Input value={availability.notice_period} onChange={e => setAvailability(a => ({ ...a, notice_period: e.target.value }))} placeholder="e.g. 30 days" /></div>
              <div><Label className="text-xs">Willing to Relocate?</Label>
                <Select value={availability.willing_to_relocate ? 'yes' : 'no'} onValueChange={v => setAvailability(a => ({ ...a, willing_to_relocate: v === 'yes' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select></div>
            </div>
          </Section>

          {/* ── Family ── */}
          <Section title="Family" icon={<span>👨‍👩‍👧‍👦</span>}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><Label className="text-xs">Spouse?</Label>
                <Select value={family.has_spouse ? 'yes' : 'no'} onValueChange={v => setFamily(f => ({ ...f, has_spouse: v === 'yes' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="no">No</SelectItem><SelectItem value="yes">Yes</SelectItem></SelectContent>
                </Select></div>
              <div><Label className="text-xs">Children Ages</Label>
                <Input value={family.children_ages} onChange={e => setFamily(f => ({ ...f, children_ages: e.target.value }))} placeholder="e.g. 5, 8, 12" /></div>
              <div><Label className="text-xs">Family Willing to Relocate?</Label>
                <Select value={family.family_willing_to_relocate ? 'yes' : 'no'} onValueChange={v => setFamily(f => ({ ...f, family_willing_to_relocate: v === 'yes' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent>
                </Select></div>
            </div>
          </Section>

          {/* ── Job Preferences ── */}
          <Section title="Job Preferences" icon={<Target className="h-4 w-4" />}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><Label className="text-xs">Preferred Titles</Label>
                <Input value={jobPrefs.preferred_titles} onChange={e => setJobPrefs(j => ({ ...j, preferred_titles: e.target.value }))} placeholder="e.g. Welder, Electrician" /></div>
              <div><Label className="text-xs">Preferred Countries</Label>
                <Input value={jobPrefs.preferred_countries} onChange={e => setJobPrefs(j => ({ ...j, preferred_countries: e.target.value }))} placeholder="e.g. Germany, Austria" /></div>
              <div><Label className="text-xs">Work Type</Label>
                <Select value={jobPrefs.preferred_work_type || '_none'} onValueChange={v => setJobPrefs(j => ({ ...j, preferred_work_type: v === '_none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Not specified</SelectItem>
                    <SelectItem value="full_time">Full-time</SelectItem>
                    <SelectItem value="part_time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select></div>
            </div>
          </Section>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancel</Button>
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
