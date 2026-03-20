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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, FolderKanban, ChevronsUpDown, Check, Plane, UserCheck } from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { WorkflowType, WORKFLOW_TYPE_CONFIG } from '@/types/project';

const Pipeline = () => {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read project and workflow tab from URL
  const projectFromUrl = searchParams.get('project') || '';
  const workflowTabFromUrl = (searchParams.get('workflow') || 'full_immigration') as WorkflowType;
  const activeProjectId = projectFromUrl || (projects.length > 0 ? projects[0].id : '');

  const { data: pipelineCandidates = [], isLoading: pipelineLoading } = usePipelineCandidates(activeProjectId || undefined);
  const { data: allCandidates = [] } = useCandidates();
  const addToPipeline = useAddCandidateToPipeline();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [addWorkflowType, setAddWorkflowType] = useState<WorkflowType>(workflowTabFromUrl);

  // Auto-set URL param to first project if none selected
  useEffect(() => {
    if (!projectFromUrl && projects.length > 0) {
      setSearchParams({ project: projects[0].id, workflow: workflowTabFromUrl }, { replace: true });
    }
  }, [projectFromUrl, projects, setSearchParams, workflowTabFromUrl]);

  const selectedProject = projects.find(p => p.id === activeProjectId);

  // Sync add dialog workflow type with project default when opening
  useEffect(() => {
    if (addDialogOpen && selectedProject) {
      setAddWorkflowType(workflowTabFromUrl);
    }
  }, [addDialogOpen, selectedProject, workflowTabFromUrl]);

  const handleProjectChange = useCallback((projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    const defaultWf = project?.default_workflow_type || 'full_immigration';
    setSearchParams({ project: projectId, workflow: defaultWf }, { replace: true });
    setProjectPickerOpen(false);
  }, [setSearchParams, projects]);

  const handleWorkflowTabChange = useCallback((tab: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('workflow', tab);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

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

  // Group projects by status for the picker
  const activeProjects = useMemo(() => projects.filter(p => p.status === 'active'), [projects]);
  const otherProjects = useMemo(() => projects.filter(p => p.status !== 'active'), [projects]);

  // Workflow tab counts
  const workflowCounts = useMemo(() => ({
    full_immigration: pipelineCandidates.filter(c => c.workflow_type === 'full_immigration').length,
    no_visa: pipelineCandidates.filter(c => c.workflow_type === 'no_visa').length,
  }), [pipelineCandidates]);

  const handleAddCandidate = async (candidateId: string) => {
    if (!activeProjectId) return;
    await addToPipeline.mutateAsync({
      candidateId,
      projectId: activeProjectId,
      workflowType: addWorkflowType,
    });
    setAddDialogOpen(false);
    setCandidateSearch('');
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Recruitment Pipeline</h1>
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
                              <span className="truncate text-xs text-muted-foreground">
                                {p.employer_name} · {p.location}
                                {p.default_workflow_type === 'no_visa' && ' · No Visa'}
                              </span>
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
                    {/* Workflow Type Selector */}
                    <div className="space-y-2">
                      <Label>Workflow Type</Label>
                      <Select value={addWorkflowType} onValueChange={(v) => setAddWorkflowType(v as WorkflowType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full_immigration">
                            <div className="flex items-center gap-2">
                              <Plane className="h-3.5 w-3.5 text-orange-500" />
                              <span>Full Immigration</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="no_visa">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-3.5 w-3.5 text-green-500" />
                              <span>No Visa Required</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {selectedProject && addWorkflowType !== selectedProject.default_workflow_type && (
                        <p className="text-[11px] text-amber-600">
                          Note: Project default is {WORKFLOW_TYPE_CONFIG[selectedProject.default_workflow_type].label}
                        </p>
                      )}
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
            {/* Project Info + Workflow Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {selectedProject && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedProject.name}</span>
                  <span>·</span>
                  <span>{selectedProject.employer_name}</span>
                  <span>·</span>
                  <span>{pipelineCandidates.length} candidates total</span>
                </div>
              )}
              <Tabs value={workflowTabFromUrl} onValueChange={handleWorkflowTabChange}>
                <TabsList className="h-9">
                  <TabsTrigger value="full_immigration" className="gap-1.5 text-xs px-3">
                    <Plane className="h-3.5 w-3.5" />
                    Full Immigration
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                      {workflowCounts.full_immigration}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="no_visa" className="gap-1.5 text-xs px-3">
                    <UserCheck className="h-3.5 w-3.5" />
                    No Visa
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                      {workflowCounts.no_visa}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <PipelineBoard
              candidates={pipelineCandidates}
              isLoading={pipelineLoading}
              projectId={activeProjectId}
              workflowTab={workflowTabFromUrl}
              onCandidateClick={handleCandidateClick}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Pipeline;
