import { AppLayout } from '@/components/layout/AppLayout';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';
import { usePipelineCandidates, useAddCandidateToPipeline } from '@/hooks/usePipelineCandidates';
import { useProjects } from '@/hooks/useProjects';
import { useCandidates } from '@/hooks/useCandidates';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, FolderKanban, ChevronsUpDown, Check, Search } from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const Pipeline = () => {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read project from URL, fallback to first project
  const projectFromUrl = searchParams.get('project') || '';
  const activeProjectId = projectFromUrl || (projects.length > 0 ? projects[0].id : '');

  const { data: pipelineCandidates = [], isLoading: pipelineLoading } = usePipelineCandidates(activeProjectId || undefined);
  const { data: allCandidates = [] } = useCandidates();
  const addToPipeline = useAddCandidateToPipeline();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);

  // Auto-set URL param to first project if none selected
  useEffect(() => {
    if (!projectFromUrl && projects.length > 0) {
      setSearchParams({ project: projects[0].id }, { replace: true });
    }
  }, [projectFromUrl, projects, setSearchParams]);

  const handleProjectChange = useCallback((projectId: string) => {
    setSearchParams({ project: projectId }, { replace: true });
    setProjectPickerOpen(false);
  }, [setSearchParams]);

  // Navigate to candidate with pipeline context
  const handleCandidateClick = useCallback((candidateId: string) => {
    navigate(`/candidates/${candidateId}?from=pipeline&project=${activeProjectId}`);
  }, [navigate, activeProjectId]);

  // Candidates not yet in this pipeline
  const existingCandidateIds = new Set(pipelineCandidates.map(pc => pc.candidate_id));
  const availableCandidates = useMemo(() => {
    return allCandidates
      .filter(c => !existingCandidateIds.has(c.id))
      .filter(c => !candidateSearch || c.full_name.toLowerCase().includes(candidateSearch.toLowerCase()) || c.email.toLowerCase().includes(candidateSearch.toLowerCase()));
  }, [allCandidates, existingCandidateIds, candidateSearch]);

  const selectedProject = projects.find(p => p.id === activeProjectId);

  // Group projects by status for the picker
  const activeProjects = useMemo(() => projects.filter(p => p.status === 'active' || p.status === 'in_progress'), [projects]);
  const otherProjects = useMemo(() => projects.filter(p => p.status !== 'active' && p.status !== 'in_progress'), [projects]);

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
            {/* Searchable Project Selector */}
            <Popover open={projectPickerOpen} onOpenChange={setProjectPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={projectPickerOpen}
                  className="w-[300px] justify-between font-normal"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {selectedProject ? (
                      <span className="truncate">{selectedProject.name} — {selectedProject.employer_name}</span>
                    ) : (
                      <span className="text-muted-foreground">Select project...</span>
                    )}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0" align="end">
                <Command>
                  <CommandInput placeholder="Search projects..." />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty>No projects found.</CommandEmpty>
                    {activeProjects.length > 0 && (
                      <CommandGroup heading="Active">
                        {activeProjects.map(p => (
                          <CommandItem
                            key={p.id}
                            value={`${p.name} ${p.employer_name}`}
                            onSelect={() => handleProjectChange(p.id)}
                            className="flex items-center justify-between"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="truncate font-medium text-sm">{p.name}</span>
                              <span className="truncate text-xs text-muted-foreground">{p.employer_name} · {p.location}</span>
                            </div>
                            <Check className={cn("h-4 w-4 shrink-0", activeProjectId === p.id ? "opacity-100" : "opacity-0")} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {otherProjects.length > 0 && (
                      <CommandGroup heading="Other">
                        {otherProjects.map(p => (
                          <CommandItem
                            key={p.id}
                            value={`${p.name} ${p.employer_name}`}
                            onSelect={() => handleProjectChange(p.id)}
                            className="flex items-center justify-between"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="truncate font-medium text-sm">{p.name}</span>
                              <span className="truncate text-xs text-muted-foreground">{p.employer_name} · {p.location}</span>
                            </div>
                            <Check className={cn("h-4 w-4 shrink-0", activeProjectId === p.id ? "opacity-100" : "opacity-0")} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

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
            <PipelineBoard
              candidates={pipelineCandidates}
              isLoading={pipelineLoading}
              projectId={activeProjectId}
              onCandidateClick={handleCandidateClick}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Pipeline;
