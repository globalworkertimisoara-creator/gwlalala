import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { ArrowLeft, Loader2, Upload, FileText, Sparkles } from 'lucide-react';
import { STAGES, RecruitmentStage, DocType } from '@/types/database';
import { useCreateCandidate } from '@/hooks/useCandidates';
import { useDocumentExtraction } from '@/hooks/useDocumentExtraction';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function CreateCandidate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createCandidate = useCreateCandidate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    nationality: '',
    current_country: '',
    current_stage: 'sourced' as RecruitmentStage,
    expected_start_date: '',
    linkedin: '',
    notes: '',
  });

  // Document upload for CV extraction
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { extractData, isExtracting } = useDocumentExtraction();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) return;
    try {
      // Upload file to temp storage first, then extract
      const tempPath = `temp/${Date.now()}_${selectedFile.name}`;
      const { error: uploadErr } = await supabase.storage
        .from('candidate-documents')
        .upload(tempPath, selectedFile);
      if (uploadErr) throw uploadErr;

      const data = await extractData(tempPath, 'resume', 'candidate-documents');
      // Auto-fill form fields from extracted data
      if (data) {
        setForm(prev => ({
          ...prev,
          full_name: data.full_name || prev.full_name,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          nationality: data.nationality || prev.nationality,
          current_country: data.current_country || prev.current_country,
          linkedin: data.linkedin || prev.linkedin,
        }));
        toast({ title: 'Data extracted from CV', description: 'Form fields have been auto-filled' });
      }
    } catch (err: any) {
      toast({ title: 'Extraction failed', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    }
  };

  const handleCreate = async () => {
    if (!form.full_name.trim() || !form.email.trim()) return;

    try {
      const candidate = await createCandidate.mutateAsync({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone || undefined,
        nationality: form.nationality || undefined,
        current_country: form.current_country || undefined,
        current_stage: form.current_stage,
        expected_start_date: form.expected_start_date || undefined,
        linkedin: form.linkedin || undefined,
      });

      // Upload CV if selected
      if (selectedFile && candidate?.id) {
        const filePath = `candidates/${candidate.id}/${Date.now()}_${selectedFile.name}`;
        const { error: uploadErr } = await supabase.storage
          .from('candidate-documents')
          .upload(filePath, selectedFile);

        if (!uploadErr) {
          await supabase.from('documents').insert({
            candidate_id: candidate.id,
            doc_type: 'resume',
            file_name: selectedFile.name,
            file_path: filePath,
            file_size: selectedFile.size,
            mime_type: selectedFile.type,
          } as any);
        }
      }

      navigate(`/candidates/${candidate?.id || ''}`);
    } catch (err: any) {
      toast({ title: 'Failed to create candidate', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <h1 className="text-2xl font-bold">Add New Candidate</h1>

        <div className="grid gap-6">
          {/* CV Upload & Extraction */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">CV Upload (Optional)</CardTitle>
              <CardDescription>Upload a CV to auto-fill candidate details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {selectedFile ? selectedFile.name : 'Choose File'}
                </Button>
                {selectedFile && (
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={handleExtract}
                    disabled={isExtracting}
                  >
                    {isExtracting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Extract Data
                  </Button>
                )}
              </div>
              {isExtracting && (
                <p className="text-xs text-muted-foreground">Extracting data from CV...</p>
              )}
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={form.full_name}
                    onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+40 123 456 789"
                  />
                </div>
                <div>
                  <Label>LinkedIn</Label>
                  <Input
                    value={form.linkedin}
                    onChange={e => setForm(p => ({ ...p, linkedin: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nationality</Label>
                  <Input
                    value={form.nationality}
                    onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))}
                    placeholder="e.g., Romanian"
                  />
                </div>
                <div>
                  <Label>Current Country</Label>
                  <Input
                    value={form.current_country}
                    onChange={e => setForm(p => ({ ...p, current_country: e.target.value }))}
                    placeholder="e.g., Romania"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status & Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Initial Stage</Label>
                  <Select value={form.current_stage} onValueChange={v => setForm(p => ({ ...p, current_stage: v as RecruitmentStage }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAGES.map(stage => (
                        <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Expected Start Date</Label>
                  <Input
                    type="date"
                    value={form.expected_start_date}
                    onChange={e => setForm(p => ({ ...p, expected_start_date: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              You can upload additional documents and fill in detailed CV data on the candidate's profile page after creation.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              <Button
                onClick={handleCreate}
                disabled={createCandidate.isPending || !form.full_name.trim() || !form.email.trim()}
              >
                {createCandidate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Candidate
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
