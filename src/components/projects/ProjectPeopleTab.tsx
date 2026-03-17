import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';
import { WORKFLOW_TYPE_CONFIG, WorkflowType } from '@/types/project';

import type { PipelineCandidate } from '@/hooks/usePipelineCandidates';

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  [key: string]: any;
}

interface ProjectPeopleTabProps {
  projectId: string;
  pipelineCandidates: PipelineCandidate[];
  pipelineLoading: boolean;
  allCandidates: Candidate[];
  defaultWorkflowType: string;
  onAddCandidate: (candidateId: string, workflowType: 'full_immigration' | 'no_visa') => Promise<void>;
  addPending: boolean;
}

export function ProjectPeopleTab({
  projectId,
  pipelineCandidates,
  pipelineLoading,
  allCandidates,
  defaultWorkflowType,
  onAddCandidate,
  addPending,
}: ProjectPeopleTabProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [pipelineWorkflowType, setPipelineWorkflowType] = useState<WorkflowType | ''>('');

  const existingCandidateIds = new Set(pipelineCandidates.map(pc => pc.candidate_id));
  const availableCandidates = useMemo(() => {
    return allCandidates
      .filter(c => !existingCandidateIds.has(c.id))
      .filter(c => !candidateSearch || c.full_name.toLowerCase().includes(candidateSearch.toLowerCase()) || c.email.toLowerCase().includes(candidateSearch.toLowerCase()));
  }, [allCandidates, existingCandidateIds, candidateSearch]);

  const handleAddCandidate = async (candidateId: string) => {
    const wfType = (pipelineWorkflowType || defaultWorkflowType || 'full_immigration') as 'full_immigration' | 'no_visa';
    await onAddCandidate(candidateId, wfType);
    setAddDialogOpen(false);
    setCandidateSearch('');
    setPipelineWorkflowType('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {pipelineCandidates.length} candidates in this project's pipeline
        </p>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add to Pipeline
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Candidate to Pipeline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Workflow Type</Label>
                <Select
                  value={pipelineWorkflowType || defaultWorkflowType || 'full_immigration'}
                  onValueChange={(v) => setPipelineWorkflowType(v as WorkflowType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(WORKFLOW_TYPE_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {WORKFLOW_TYPE_CONFIG[(pipelineWorkflowType || defaultWorkflowType || 'full_immigration') as WorkflowType]?.description}
                </p>
              </div>
              <div>
                <Label>Search candidates</Label>
                <Input
                  placeholder="Name or email..."
                  value={candidateSearch}
                  onChange={e => setCandidateSearch(e.target.value)}
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {availableCandidates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {candidateSearch ? 'No matching candidates found' : 'All candidates are already in this pipeline'}
                  </p>
                ) : (
                  availableCandidates.slice(0, 20).map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleAddCandidate(c.id)}
                      disabled={addPending}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg border hover:bg-accent/50 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium">{c.full_name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <PipelineBoard candidates={pipelineCandidates} isLoading={pipelineLoading} />
    </div>
  );
}
