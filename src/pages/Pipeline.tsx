import { AppLayout } from '@/components/layout/AppLayout';
import { PipelineColumn } from '@/components/pipeline/PipelineColumn';
import { useCandidates, useCreateCandidate } from '@/hooks/useCandidates';
import { RecruitmentStage, STAGES, Candidate } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Active pipeline stages (exclude closed_not_placed from main view)
const pipelineStages: RecruitmentStage[] = STAGES
  .filter(s => s.value !== 'closed_not_placed')
  .map(s => s.value);

const Pipeline = () => {
  const { data: candidates, isLoading } = useCandidates();
  const createCandidate = useCreateCandidate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateCandidate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    await createCandidate.mutateAsync({
      full_name: formData.get('full_name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || undefined,
      nationality: formData.get('nationality') as string || undefined,
      current_country: formData.get('current_country') as string || undefined,
      linkedin: formData.get('linkedin') as string || undefined,
      current_stage: formData.get('current_stage') as RecruitmentStage || 'sourced',
    });

    setIsDialogOpen(false);
  };

  const handleCandidateClick = (candidate: Candidate) => {
    // TODO: Open candidate detail modal/page
    console.log('Clicked candidate:', candidate);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Pipeline</h1>
            <p className="text-muted-foreground">
              Track candidates through recruitment stages
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Candidate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Candidate</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCandidate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input id="full_name" name="full_name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input id="nationality" name="nationality" placeholder="e.g., Romanian" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="current_country">Current Country</Label>
                    <Input id="current_country" name="current_country" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current_stage">Stage</Label>
                    <Select name="current_stage" defaultValue="sourced">
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
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input id="linkedin" name="linkedin" type="url" placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCandidate.isPending}>
                    {createCandidate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Candidate
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pipeline Board */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {pipelineStages.map((stage) => (
                <PipelineColumn
                  key={stage}
                  stage={stage}
                  candidates={candidates || []}
                  onCandidateClick={handleCandidateClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Pipeline;
