import { AppLayout } from '@/components/layout/AppLayout';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';
import { usePipelineCandidates, useAddCandidateToPipeline } from '@/hooks/usePipelineCandidates';
import { useProjects } from '@/hooks/useProjects';
import { useCandidates } from '@/hooks/useCandidates';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, FolderKanban } from 'lucide-react';
import { useState, useMemo } from 'react';

const Pipeline = () => {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { data: pipelineCandidates = [], isLoading: pipelineLoading } = usePipelineCandidates(selectedProjectId || undefined);
  const { data: allCandidates = [] } = useCandidates();
  const addToPipeline = useAddCandidateToPipeline();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');

  // Auto-select first project
  const activeProjectId = selectedProjectId || (projects.length > 0 ? projects[0].id : '');

  // Candidates not yet in this pipeline
  const existingCandidateIds = new Set(pipelineCandidates.map(pc => pc.candidate_id));
  const availableCandidates = useMemo(() => {
    return allCandidates
      .filter(c => !existingCandidateIds.has(c.id))
      .filter(c => !candidateSearch || c.full_name.toLowerCase().includes(candidateSearch.toLowerCase()) || c.email.toLowerCase().includes(candidateSearch.toLowerCase()));
  }, [allCandidates, existingCandidateIds, candidateSearch]);

  const selectedProject = projects.find(p => p.id === activeProjectId);

  const handleAddCandidate = async (candidateId: string) => {
    if (!activeProjectId) return;
    await addToPipeline.mutateAsync({ candidateId, projectId: activeProjectId });
    setAddDialogOpen(false);
    setCandidateSearch('');
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">Recruitment Pipeline</h1>
            <p className="text-sm text-muted-foreground">
              Track candidates through recruitment stages per project
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Project Selector */}
            <Select
              value={activeProjectId}
              onValueChange={v => setSelectedProjectId(v)}
            >
              <SelectTrigger className="w-[260px]">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select project" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {p.employer_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeProjectId && (
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
                            disabled={addToPipeline.isPending}
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
            )}
          </div>
        </div>

        {/* Pipeline Board */}
        {projectsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !activeProjectId ? (
          <div className="text-center py-16 text-muted-foreground">
            <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No project selected</p>
            <p className="text-sm">Select a project to view its recruitment pipeline</p>
          </div>
        ) : (
          <>
            {selectedProject && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{selectedProject.name}</span>
                <span>•</span>
                <span>{selectedProject.employer_name}</span>
                <span>•</span>
                <span>{pipelineCandidates.length} candidates</span>
              </div>
            )}
            <PipelineBoard candidates={pipelineCandidates} isLoading={pipelineLoading} />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Pipeline;
