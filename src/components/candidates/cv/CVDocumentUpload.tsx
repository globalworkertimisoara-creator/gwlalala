import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentExtraction, ExtractedData } from '@/hooks/useDocumentExtraction';
import { useUpdateCandidate } from '@/hooks/useCandidates';
import {
  useSaveCandidateEducation,
  useSaveCandidateWorkExperience,
  useSaveCandidateLanguages,
  useSaveCandidateSkills,
  useSaveCandidateReferences,
} from '@/hooks/useCandidateCV';
import { useToast } from '@/hooks/use-toast';
import { compressFileForUpload } from '@/utils/fileCompression';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Sparkles, Check, X, FileText, Globe } from 'lucide-react';

interface Props {
  candidateId: string;
  onDataApplied?: () => void;
}

export function CVDocumentUpload({ candidateId, onDataApplied }: Props) {
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [applyingData, setApplyingData] = useState(false);
  const { extractData, isExtracting } = useDocumentExtraction();
  const updateCandidate = useUpdateCandidate();
  const saveEducation = useSaveCandidateEducation();
  const saveWorkExp = useSaveCandidateWorkExperience();
  const saveLanguages = useSaveCandidateLanguages();
  const saveSkills = useSaveCandidateSkills();
  const saveReferences = useSaveCandidateReferences();
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    let file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    try {
      // Compress before upload
      file = await compressFileForUpload(file);

      // Upload to storage
      const ext = file.name.split('.').pop();
      const storagePath = `${candidateId}/cv-upload-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('candidate-documents')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // Also save as a document record
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('documents').insert({
        candidate_id: candidateId,
        file_name: file.name,
        doc_type: 'resume',
        storage_path: storagePath,
        uploaded_by: user?.id,
      } as any);

      // Extract data using OCR with cv_profile type for comprehensive extraction
      const data = await extractData(storagePath, 'cv_profile', 'candidate-documents');
      if (data) {
        setExtractedData(data);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload document',
      });
    } finally {
      setUploading(false);
    }
  }, [candidateId, extractData, toast]);

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

  const handleApplyData = async () => {
    if (!extractedData) return;
    setApplyingData(true);

    try {
      // Apply personal/contact info to candidates table
      const candidateUpdates: Record<string, any> = {};
      const personalFields = [
        'full_name', 'email', 'phone', 'date_of_birth', 'nationality',
        'current_country', 'current_city', 'gender', 'marital_status',
        'whatsapp', 'linkedin', 'passport_number', 'passport_expiry',
        'passport_issue_date', 'passport_issued_by', 'national_id_number',
        'parents_names',
      ];

      for (const field of personalFields) {
        const value = (extractedData as any)[field];
        if (value) candidateUpdates[field] = value;
      }

      // JSON fields
      if (extractedData.driver_license) candidateUpdates.driver_license = extractedData.driver_license;
      if (extractedData.salary_expectations) candidateUpdates.salary_expectations = extractedData.salary_expectations;
      if (extractedData.availability) candidateUpdates.availability = extractedData.availability;
      if (extractedData.job_preferences) candidateUpdates.job_preferences = extractedData.job_preferences;

      if (Object.keys(candidateUpdates).length > 0) {
        await updateCandidate.mutateAsync({ id: candidateId, ...candidateUpdates });
      }

      // Save structured data
      const promises: Promise<any>[] = [];

      if (extractedData.education && extractedData.education.length > 0) {
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

      if (extractedData.work_experience && extractedData.work_experience.length > 0) {
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

      if (extractedData.languages && extractedData.languages.length > 0) {
        promises.push(saveLanguages.mutateAsync({
          candidateId,
          entries: extractedData.languages.map(l => ({
            language_name: l.language_name || '',
            proficiency_level: l.proficiency_level || 'basic',
          })),
        }));
      }

      if (extractedData.skills_list && extractedData.skills_list.length > 0) {
        promises.push(saveSkills.mutateAsync({
          candidateId,
          entries: extractedData.skills_list.map(s => ({
            skill_name: s.skill_name || '',
            years_experience: s.years_experience || null,
          })),
        }));
      }

      if (extractedData.references && extractedData.references.length > 0) {
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

      toast({
        title: 'CV data applied',
        description: 'All extracted information has been saved to the candidate profile.',
      });
      setExtractedData(null);
      onDataApplied?.();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to apply data',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setApplyingData(false);
    }
  };

  const isProcessing = uploading || isExtracting;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Smart Document Upload
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload a CV, passport, certificate, or any document. AI will extract and auto-fill all available information, including automatic translation from any language.
          </p>
        </CardHeader>
        <CardContent>
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
                    PDF, images, Word documents • Supports all languages
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Extracted Data Review */}
      {extractedData && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Extracted Data — Review & Apply
              </CardTitle>
              <div className="flex items-center gap-2">
                {extractedData.original_language && (
                  <Badge variant="outline" className="gap-1">
                    <Globe className="h-3 w-3" />
                    {extractedData.original_language}
                  </Badge>
                )}
                {extractedData.confidence && (
                  <Badge variant="secondary">
                    {extractedData.confidence}% confidence
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Personal info */}
            <ExtractedSection title="Personal Info" items={[
              { label: 'Name', value: extractedData.full_name },
              { label: 'Email', value: extractedData.email },
              { label: 'Phone', value: extractedData.phone },
              { label: 'Date of Birth', value: extractedData.date_of_birth },
              { label: 'Gender', value: extractedData.gender },
              { label: 'Nationality', value: extractedData.nationality },
              { label: 'Location', value: [extractedData.current_city, extractedData.current_country].filter(Boolean).join(', ') },
              { label: 'Marital Status', value: extractedData.marital_status },
              { label: 'LinkedIn', value: extractedData.linkedin },
              { label: 'Passport', value: extractedData.passport_number },
            ]} />

            {/* Education */}
            {extractedData.education && extractedData.education.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">🎓 Education ({extractedData.education.length})</p>
                <div className="grid gap-1 text-sm text-muted-foreground">
                  {extractedData.education.map((e, i) => (
                    <p key={i}>• {e.education_level} {e.field_of_study ? `in ${e.field_of_study}` : ''} {e.institution_name ? `at ${e.institution_name}` : ''} {e.graduation_year ? `(${e.graduation_year})` : ''}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Work Experience */}
            {extractedData.work_experience && extractedData.work_experience.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">💼 Work Experience ({extractedData.work_experience.length})</p>
                <div className="grid gap-1 text-sm text-muted-foreground">
                  {extractedData.work_experience.map((e, i) => (
                    <p key={i}>• {e.job_title} {e.company_name ? `at ${e.company_name}` : ''} {e.country ? `(${e.country})` : ''}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {extractedData.languages && extractedData.languages.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">🗣️ Languages</p>
                <div className="flex flex-wrap gap-2">
                  {extractedData.languages.map((l, i) => (
                    <Badge key={i} variant="secondary">{l.language_name} — {l.proficiency_level}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {extractedData.skills_list && extractedData.skills_list.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">🛠️ Skills</p>
                <div className="flex flex-wrap gap-2">
                  {extractedData.skills_list.map((s, i) => (
                    <Badge key={i} variant="outline">{s.skill_name}{s.years_experience ? ` (${s.years_experience}y)` : ''}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleApplyData} disabled={applyingData} className="gap-2">
                {applyingData ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Apply All to Profile
              </Button>
              <Button variant="outline" onClick={() => setExtractedData(null)} className="gap-2">
                <X className="h-4 w-4" /> Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ExtractedSection({ title, items }: { title: string; items: { label: string; value?: string | null }[] }) {
  const filled = items.filter(i => i.value);
  if (filled.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium mb-1">👤 {title}</p>
      <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3 text-sm">
        {filled.map((item, i) => (
          <div key={i}>
            <span className="text-muted-foreground">{item.label}:</span>{' '}
            <span className="font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
