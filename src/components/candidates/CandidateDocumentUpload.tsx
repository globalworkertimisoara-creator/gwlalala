import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Download,
  Eye,
  Check,
  X,
  Globe,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { useDocuments, useDeleteDocument } from '@/hooks/useDocuments';
import { useUpdateCandidate } from '@/hooks/useCandidates';
import { useLogCandidateActivity } from '@/hooks/useCandidateActivityLog';
import {
  useSaveCandidateEducation,
  useSaveCandidateWorkExperience,
  useSaveCandidateLanguages,
  useSaveCandidateSkills,
  useSaveCandidateReferences,
} from '@/hooks/useCandidateCV';
import { useDocumentExtraction, ExtractedData } from '@/hooks/useDocumentExtraction';
import { supabase } from '@/integrations/supabase/client';
import { DocType } from '@/types/database';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const DOC_TYPE_LABELS: Record<DocType, string> = {
  resume: 'Resume/CV',
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

const FIELD_LABELS: Record<string, string> = {
  full_name: 'Full Name', email: 'Email', phone: 'Phone',
  date_of_birth: 'Date of Birth', nationality: 'Nationality',
  current_country: 'Country', current_city: 'City',
  gender: 'Gender', marital_status: 'Marital Status',
  whatsapp: 'WhatsApp', linkedin: 'LinkedIn',
  passport_number: 'Passport Number', passport_expiry: 'Passport Expiry',
  passport_issue_date: 'Passport Issue Date', passport_issued_by: 'Passport Issued By',
  national_id_number: 'National ID', parents_names: 'Parents Names',
};

interface ConflictItem {
  field: string;
  label: string;
  currentValue: string;
  newValue: string;
  approved: boolean;
}

interface CandidateDocumentUploadProps {
  candidateId: string;
  candidate?: any; // Current candidate data for conflict detection
  onDataApplied?: () => void;
}

export function CandidateDocumentUpload({ 
  candidateId,
  candidate,
  onDataApplied,
}: CandidateDocumentUploadProps) {
  const [uploadDocType, setUploadDocType] = useState<DocType>('resume');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [autoAppliedCount, setAutoAppliedCount] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: documents, isLoading: docsLoading } = useDocuments(candidateId);
  const deleteDoc = useDeleteDocument();
  const { extractData, isExtracting } = useDocumentExtraction();
  const updateCandidate = useUpdateCandidate();
  const saveEducation = useSaveCandidateEducation();
  const saveWorkExp = useSaveCandidateWorkExperience();
  const saveLanguages = useSaveCandidateLanguages();
  const saveSkills = useSaveCandidateSkills();
  const saveReferences = useSaveCandidateReferences();
  const { toast } = useToast();
  const logActivity = useLogCandidateActivity();

  // ── Process extraction: auto-fill empty, queue conflicts ──
  const processExtraction = useCallback(async (data: ExtractedData) => {
    if (!candidate) {
      setExtractedData(data);
      return;
    }

    const personalFields = [
      'full_name', 'email', 'phone', 'date_of_birth', 'nationality',
      'current_country', 'current_city', 'gender', 'marital_status',
      'whatsapp', 'linkedin', 'passport_number', 'passport_expiry',
      'passport_issue_date', 'passport_issued_by', 'national_id_number',
      'parents_names',
    ];

    const autoUpdates: Record<string, any> = {};
    const newConflicts: ConflictItem[] = [];

    for (const field of personalFields) {
      const extractedValue = (data as any)[field];
      if (!extractedValue) continue;

      const currentValue = (candidate as any)[field];
      if (!currentValue || currentValue === '' || currentValue === null) {
        // Empty field → auto-fill
        autoUpdates[field] = extractedValue;
      } else if (String(currentValue).trim().toLowerCase() !== String(extractedValue).trim().toLowerCase()) {
        // Different value → conflict
        newConflicts.push({
          field,
          label: FIELD_LABELS[field] || field,
          currentValue: String(currentValue),
          newValue: String(extractedValue),
          approved: false,
        });
      }
      // Same value → skip silently
    }

    // JSON fields: auto-fill if empty
    if (data.driver_license && !candidate.driver_license) autoUpdates.driver_license = data.driver_license;
    if (data.salary_expectations && !candidate.salary_expectations) autoUpdates.salary_expectations = data.salary_expectations;
    if (data.availability && !candidate.availability) autoUpdates.availability = data.availability;
    if (data.job_preferences && !candidate.job_preferences) autoUpdates.job_preferences = data.job_preferences;
    if (data.family_info && !candidate.family_info) autoUpdates.family_info = data.family_info;

    // Auto-apply empty fields immediately
    if (Object.keys(autoUpdates).length > 0) {
      try {
        await updateCandidate.mutateAsync({ id: candidateId, ...autoUpdates });
        logActivity.mutate({
          candidate_id: candidateId,
          event_type: 'profile_auto_updated',
          summary: `Auto-filled ${Object.keys(autoUpdates).length} empty field(s) from document extraction`,
          is_shared_event: true,
          details: { fields_updated: Object.keys(autoUpdates) },
        });
      } catch (err) {
        console.error('Auto-apply error:', err);
      }
    }

    setAutoAppliedCount(Object.keys(autoUpdates).length);
    setConflicts(newConflicts);
    setExtractedData(data);
  }, [candidate, candidateId, updateCandidate]);

  // ── Drag & Drop ──
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Maximum 10MB' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const storagePath = `${candidateId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('candidate-documents')
        .upload(storagePath, file);
      if (uploadError) throw uploadError;

      // Save document record
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('documents').insert({
        candidate_id: candidateId,
        file_name: file.name,
        doc_type: uploadDocType,
        storage_path: storagePath,
        uploaded_by: user?.id,
      } as any);

      // Log upload activity
      logActivity.mutate({
        candidate_id: candidateId,
        event_type: 'document_uploaded',
        summary: `Uploaded document: ${file.name} (${DOC_TYPE_LABELS[uploadDocType]})`,
        is_shared_event: true,
        details: { file_name: file.name, doc_type: uploadDocType },
      });

      // Extract data via OCR
      const extractionType = uploadDocType === 'resume' ? 'cv_profile' : uploadDocType;
      const data = await extractData(storagePath, extractionType, 'candidate-documents');
      if (data) {
        await processExtraction(data);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload',
      });
    } finally {
      setUploading(false);
    }
  }, [candidateId, uploadDocType, extractData, processExtraction, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: uploading || isExtracting,
  });

  const isProcessing = uploading || isExtracting;

  // ── Apply approved conflicts ──
  const handleApplyConflicts = async () => {
    const approved = conflicts.filter(c => c.approved);
    if (approved.length === 0) {
      toast({ title: 'No changes selected', description: 'Select at least one field to update.' });
      return;
    }

    setIsApplying(true);
    try {
      const updates: Record<string, any> = {};
      for (const c of approved) {
        updates[c.field] = c.newValue;
      }
      await updateCandidate.mutateAsync({ id: candidateId, ...updates });
      logActivity.mutate({
        candidate_id: candidateId,
        event_type: 'profile_updated',
        summary: `Approved and updated ${approved.length} field(s) from document extraction`,
        is_shared_event: true,
        details: { fields_updated: approved.map(c => ({ field: c.field, old: c.currentValue, new: c.newValue })) },
      });
      toast({
        title: 'Profile updated',
        description: `${approved.length} field(s) updated with new data.`,
      });
      setConflicts([]);
      setExtractedData(null);
      setAutoAppliedCount(0);
      onDataApplied?.();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setIsApplying(false);
    }
  };

  // ── Apply structured CV data (education, work, etc.) ──
  const handleApplyStructuredData = async () => {
    if (!extractedData) return;
    setIsApplying(true);
    try {
      const promises: Promise<any>[] = [];

      if (extractedData.education?.length) {
        promises.push(saveEducation.mutateAsync({
          candidateId,
          entries: extractedData.education.map(e => ({
            education_level: e.education_level || '',
            field_of_study: e.field_of_study || '',
            institution_name: e.institution_name || '',
            graduation_year: e.graduation_year || null,
            degree_obtained: e.degree_obtained || '',
          })),
        }));
      }
      if (extractedData.work_experience?.length) {
        promises.push(saveWorkExp.mutateAsync({
          candidateId,
          entries: extractedData.work_experience.map(e => ({
            job_title: e.job_title || '',
            company_name: e.company_name || '',
            country: e.country || '',
            start_date: e.start_date || '',
            end_date: e.end_date || '',
            job_description: e.job_description || '',
          })),
        }));
      }
      if (extractedData.languages?.length) {
        promises.push(saveLanguages.mutateAsync({
          candidateId,
          entries: extractedData.languages.map(l => ({
            language_name: l.language_name || '',
            proficiency_level: l.proficiency_level || 'basic',
          })),
        }));
      }
      if (extractedData.skills_list?.length) {
        promises.push(saveSkills.mutateAsync({
          candidateId,
          entries: extractedData.skills_list.map(s => ({
            skill_name: s.skill_name || '',
            years_experience: s.years_experience || null,
          })),
        }));
      }
      if (extractedData.references?.length) {
        promises.push(saveReferences.mutateAsync({
          candidateId,
          entries: extractedData.references.map(r => ({
            reference_name: r.reference_name || '',
            position_title: r.position_title || '',
            phone: r.phone || '',
            email: r.email || '',
            relationship: r.relationship || '',
          })),
        }));
      }

      await Promise.all(promises);

      const total = (extractedData.education?.length || 0) +
        (extractedData.work_experience?.length || 0) +
        (extractedData.languages?.length || 0) +
        (extractedData.skills_list?.length || 0) +
        (extractedData.references?.length || 0);

      if (total > 0) {
        toast({ title: 'CV data applied', description: `${total} entries saved to profile.` });
        logActivity.mutate({
          candidate_id: candidateId,
          event_type: 'cv_data_applied',
          summary: `Applied structured CV data: ${total} entries (${[
            structuredCounts?.education ? `${structuredCounts.education} education` : '',
            structuredCounts?.work ? `${structuredCounts.work} work exp` : '',
            structuredCounts?.languages ? `${structuredCounts.languages} languages` : '',
            structuredCounts?.skills ? `${structuredCounts.skills} skills` : '',
            structuredCounts?.references ? `${structuredCounts.references} references` : '',
          ].filter(Boolean).join(', ')})`,
          is_shared_event: true,
          details: { counts: structuredCounts },
        });
      }

      setExtractedData(null);
      setConflicts([]);
      setAutoAppliedCount(0);
      onDataApplied?.();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to apply',
        description: err instanceof Error ? err.message : 'An error occurred',
      });
    } finally {
      setIsApplying(false);
    }
  };

  const dismissReview = () => {
    setExtractedData(null);
    setConflicts([]);
    setAutoAppliedCount(0);
  };

  const toggleConflict = (index: number) => {
    setConflicts(prev => prev.map((c, i) => i === index ? { ...c, approved: !c.approved } : c));
  };

  const handleDeleteDoc = async (docId: string, storagePath: string, fileName?: string) => {
    if (!candidateId) return;
    await deleteDoc.mutateAsync({ id: docId, storagePath, candidateId });
    logActivity.mutate({
      candidate_id: candidateId,
      event_type: 'document_deleted',
      summary: `Deleted document: ${fileName || 'Unknown'}`,
      is_shared_event: true,
      details: { file_name: fileName, doc_id: docId },
    });
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
      logActivity.mutate({
        candidate_id: candidateId,
        event_type: 'document_downloaded',
        summary: `Downloaded document: ${fileName}`,
        is_shared_event: false,
        details: { file_name: fileName },
      });
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // ── Structured data counts ──
  const structuredCounts = extractedData ? {
    education: extractedData.education?.length || 0,
    work: extractedData.work_experience?.length || 0,
    languages: extractedData.languages?.length || 0,
    skills: extractedData.skills_list?.length || 0,
    references: extractedData.references?.length || 0,
  } : null;
  const hasStructuredData = structuredCounts && (structuredCounts.education + structuredCounts.work + structuredCounts.languages + structuredCounts.skills + structuredCounts.references) > 0;

  return (
    <div className="space-y-4">
      {/* ── Drag & Drop Upload Area ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Smart Document Upload
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload documents to auto-fill profile data. New information is applied automatically; existing fields require your approval.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Select value={uploadDocType} onValueChange={(v) => setUploadDocType(v as DocType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="gap-1 text-xs self-center">
              <Sparkles className="h-3 w-3" /> OCR Auto-fill
            </Badge>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input {...getInputProps()} />
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">
                  {uploading ? 'Uploading document...' : 'Extracting data with AI...'}
                </p>
                <p className="text-xs text-muted-foreground">
                  This may take a moment for multi-language documents
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Drop a document here or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, images, Word documents • Max 10MB • Supports all languages
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Extraction Results ── */}
      {extractedData && (autoAppliedCount > 0 || conflicts.length > 0 || hasStructuredData) && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Extraction Results
              </CardTitle>
              <div className="flex items-center gap-2">
                {extractedData.original_language && (
                  <Badge variant="outline" className="gap-1">
                    <Globe className="h-3 w-3" /> {extractedData.original_language}
                  </Badge>
                )}
                {extractedData.confidence && (
                  <Badge variant="secondary">{extractedData.confidence}% confidence</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auto-applied summary */}
            {autoAppliedCount > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800">
                <Check className="h-4 w-4 text-green-600 shrink-0" />
                <p className="text-sm text-green-800 dark:text-green-300">
                  <span className="font-medium">{autoAppliedCount} new field(s)</span> auto-filled into the profile
                </p>
              </div>
            )}

            {/* Conflicts requiring approval */}
            {conflicts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <p className="text-sm font-medium">
                    {conflicts.length} field(s) have different existing values — select which to update:
                  </p>
                </div>
                <div className="space-y-2">
                  {conflicts.map((c, i) => (
                    <div key={c.field}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                        c.approved ? 'bg-primary/5 border-primary/30' : 'bg-background border-border'
                      )}
                      onClick={() => toggleConflict(i)}
                    >
                      <Checkbox
                        checked={c.approved}
                        onCheckedChange={() => toggleConflict(i)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{c.label}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="text-muted-foreground line-through truncate max-w-[200px]">{c.currentValue}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-primary font-medium truncate max-w-[200px]">{c.newValue}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleApplyConflicts}
                  disabled={isApplying || conflicts.filter(c => c.approved).length === 0}
                  size="sm"
                  className="gap-2"
                >
                  {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Apply {conflicts.filter(c => c.approved).length} Selected Change(s)
                </Button>
              </div>
            )}

            {/* Structured CV data preview */}
            {hasStructuredData && structuredCounts && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Structured CV Data Extracted:</p>
                <div className="flex flex-wrap gap-2">
                  {structuredCounts.education > 0 && <Badge variant="secondary">🎓 {structuredCounts.education} Education</Badge>}
                  {structuredCounts.work > 0 && <Badge variant="secondary">💼 {structuredCounts.work} Work Experience</Badge>}
                  {structuredCounts.languages > 0 && <Badge variant="secondary">🗣️ {structuredCounts.languages} Languages</Badge>}
                  {structuredCounts.skills > 0 && <Badge variant="secondary">🛠️ {structuredCounts.skills} Skills</Badge>}
                  {structuredCounts.references > 0 && <Badge variant="secondary">📋 {structuredCounts.references} References</Badge>}
                </div>

                {/* Education preview */}
                {extractedData.education && extractedData.education.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {extractedData.education.map((e, i) => (
                      <p key={i}>• {e.education_level} {e.field_of_study ? `in ${e.field_of_study}` : ''} {e.institution_name ? `at ${e.institution_name}` : ''}</p>
                    ))}
                  </div>
                )}

                {/* Work preview */}
                {extractedData.work_experience && extractedData.work_experience.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {extractedData.work_experience.map((e, i) => (
                      <p key={i}>• {e.job_title} {e.company_name ? `at ${e.company_name}` : ''} {e.country ? `(${e.country})` : ''}</p>
                    ))}
                  </div>
                )}

                {/* Languages preview */}
                {extractedData.languages && extractedData.languages.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {extractedData.languages.map((l, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{l.language_name} — {l.proficiency_level}</Badge>
                    ))}
                  </div>
                )}

                <Button
                  onClick={handleApplyStructuredData}
                  disabled={isApplying}
                  size="sm"
                  className="gap-2"
                >
                  {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Apply CV Data to Profile
                </Button>
              </div>
            )}

            {/* Dismiss */}
            {conflicts.length === 0 && !hasStructuredData && (
              <Button variant="outline" size="sm" onClick={dismissReview} className="gap-2">
                <X className="h-4 w-4" /> Dismiss
              </Button>
            )}
            {(conflicts.length > 0 || hasStructuredData) && (
              <Button variant="ghost" size="sm" onClick={dismissReview} className="gap-2 text-muted-foreground">
                <X className="h-4 w-4" /> Dismiss All
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Document List ── */}
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
                      onClick={() => handleDeleteDoc(doc.id, doc.storage_path, doc.file_name)}
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
