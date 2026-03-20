import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Plane, UserCheck } from 'lucide-react';
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
  const navigate = useNavigate();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [pipelineWorkflowType, setPipelineWorkflowType] = useState<WorkflowType | ''>('');
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<WorkflowType>(
    (defaultWorkflowType as WorkflowType) || 'full_immigration'
  );

  const existingCandidateIds = new Set(pipelineCandidates.map(pc => pc.candidate_id));
  const availableCandidates = useMemo(() => {
    return allCandidates
      .filter(c => !existingCandidateIds.has(c.id))
      .filter(c => !candidateSearch || c.full_name.toLowerCase().includes(candidateSearch.toLowerCase()) || c.email.toLowerCase().includes(candidateSearch.toLowerCase()));
  }, [allCandidates, existingCandidateIds, candidateSearch]);

  // Workflow tab counts
  const workflowCounts = useMemo(() => ({
    full_immigration: pipelineCandidates.filter(c => c.workflow_type === 'full_immigration').length,
    no_visa: pipelineCandidates.filter(c => c.workflow_type === 'no_visa').length,
  }), [pipelineCandidates]);

  const handleCandidateClick = useCallback((candidateId: string) => {
    navigate(`/candidates/${candidateId}?from=pipeline&project=${projectId}`);
  }, [navigate, projectId]);

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
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {pipelineCandidates.length} candidates in this project's pipeline
          </p>
          <Tabs value={activeWorkflowTab} onValueChange={(v) => setActiveWorkflowTab(v as WorkflowType)}>
            <TabsList className="h-8">
              <TabsTrigger value="full_immigration" className="gap-1.5 text-xs px-2.5">
                <Plane className="h-3 w-3" />
                Full Immigration
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                  {workflowCounts.full_immigration}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="no_visa" className="gap-1.5 text-xs px-2.5">
                <UserCheck className="h-3 w-3" />
                No Visa
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                  {workflowCounts.no_visa}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
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
      <PipelineBoard
        candidates={pipelineCandidates}
        isLoading={pipelineLoading}
        projectId={projectId}
        workflowTab={activeWorkflowTab}
        onCandidateClick={handleCandidateClick}
      />
    </div>
  );
}
