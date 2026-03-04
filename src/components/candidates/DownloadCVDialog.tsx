import { useState } from 'react';
import { useCandidate } from '@/hooks/useCandidates';
import {
  useCandidateEducation,
  useCandidateWorkExperience,
  useCandidateLanguages,
  useCandidateSkills,
  useCandidateReferences,
} from '@/hooks/useCandidateCV';
import { useLogCandidateActivity } from '@/hooks/useCandidateActivityLog';
import { CV_SECTIONS, CVSection, CVData, generateDocx, downloadPdf } from '@/utils/cvGenerator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  candidateId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DownloadCVDialog({ candidateId, open, onOpenChange }: Props) {
  const [selectedSections, setSelectedSections] = useState<CVSection[]>(
    CV_SECTIONS.map((s) => s.key)
  );
  const [generating, setGenerating] = useState(false);

  const { data: candidate } = useCandidate(candidateId);
  const { data: education } = useCandidateEducation(candidateId);
  const { data: workExperience } = useCandidateWorkExperience(candidateId);
  const { data: languages } = useCandidateLanguages(candidateId);
  const { data: skills } = useCandidateSkills(candidateId);
  const { data: references } = useCandidateReferences(candidateId);
  const logActivity = useLogCandidateActivity();
  const { toast } = useToast();

  const toggleSection = (key: CVSection) => {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const toggleAll = () => {
    if (selectedSections.length === CV_SECTIONS.length) {
      setSelectedSections([]);
    } else {
      setSelectedSections(CV_SECTIONS.map((s) => s.key));
    }
  };

  const buildCVData = (): CVData => ({
    candidate: candidate as any,
    education: education || [],
    workExperience: workExperience || [],
    languages: languages || [],
    skills: skills || [],
    references: references || [],
  });

  const handleDownload = async (format: 'pdf' | 'docx') => {
    if (!candidate || selectedSections.length === 0) return;
    setGenerating(true);

    try {
      const cvData = buildCVData();

      if (format === 'docx') {
        await generateDocx(cvData, selectedSections);
      } else {
        downloadPdf(cvData, selectedSections);
      }

      logActivity.mutate({
        candidate_id: candidateId,
        event_type: 'cv_downloaded',
        summary: `Downloaded CV as ${format.toUpperCase()} (${selectedSections.length} sections)`,
        is_shared_event: true,
        details: { format, sections: selectedSections },
      });

      toast({ title: 'CV generated', description: `${format.toUpperCase()} file is ready.` });
    } catch (error) {
      console.error('CV generation error:', error);
      toast({ variant: 'destructive', title: 'Generation failed', description: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Download CV
          </DialogTitle>
          <DialogDescription>
            Select which sections to include in the generated CV for{' '}
            <span className="font-medium text-foreground">{candidate?.full_name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Sections</Label>
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={toggleAll}>
              {selectedSections.length === CV_SECTIONS.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="grid gap-2">
            {CV_SECTIONS.map((section) => (
              <label
                key={section.key}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={selectedSections.includes(section.key)}
                  onCheckedChange={() => toggleSection(section.key)}
                />
                <span className="text-base">{section.icon}</span>
                <span className="text-sm">{section.label}</span>
              </label>
            ))}
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            disabled={generating || selectedSections.length === 0}
            onClick={() => handleDownload('pdf')}
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            PDF
          </Button>
          <Button
            className="flex-1 gap-2"
            disabled={generating || selectedSections.length === 0}
            onClick={() => handleDownload('docx')}
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Word (.docx)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
