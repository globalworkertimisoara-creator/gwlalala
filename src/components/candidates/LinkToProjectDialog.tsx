import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WORKFLOW_TYPE_CONFIG } from '@/types/project';
import { useProjects } from '@/hooks/useProjects';
import { useCreateWorkflow, useCandidateWorkflows, useDeleteWorkflow } from '@/hooks/useWorkflow';
import { useLogCandidateActivity } from '@/hooks/useCandidateActivityLog';
import { Candidate } from '@/types/database';
import { Search, Loader2, FolderOpen, Unlink, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getProjectStatusColor } from '@/types/project';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LinkToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  onLinked?: (projectId: string, projectName: string, workflowType: string) => void;
}

export function LinkToProjectDialog({ open, onOpenChange, candidate, onLinked }: LinkToProjectDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [workflowType, setWorkflowType] = useState<'full_immigration' | 'no_visa'>('full_immigration');
  const [unlinkTarget, setUnlinkTarget] = useState<{ workflowId: string; projectName: string } | null>(null);

  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: existingWorkflows } = useCandidateWorkflows(candidate?.id);
  const createWorkflow = useCreateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();
  const logActivity = useLogCandidateActivity();

  const linkedProjectIds = useMemo(() => {
    return new Set((existingWorkflows || []).map(w => w.project_id));
  }, [existingWorkflows]);

  const linkedProjectsWithNames = useMemo(() => {
    if (!existingWorkflows || !projects) return [];
    return existingWorkflows.map(w => ({
      ...w,
      projectName: projects.find(p => p.id === w.project_id)?.name || 'Unknown Project',
    }));
  }, [existingWorkflows, projects]);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    const list = search.trim()
      ? projects.filter(p => {
          const q = search.toLowerCase();
          return p.name.toLowerCase().includes(q) || p.employer_name.toLowerCase().includes(q);
        })
      : projects;
    // Show unlinked projects first, then linked ones
    return list.sort((a, b) => {
      const aLinked = linkedProjectIds.has(a.id) ? 1 : 0;
      const bLinked = linkedProjectIds.has(b.id) ? 1 : 0;
      return aLinked - bLinked;
    });
  }, [projects, search, linkedProjectIds]);

  const selectedProject = projects?.find(p => p.id === selectedProjectId);

  const handleSelectProject = (projectId: string) => {
    if (linkedProjectIds.has(projectId)) return; // Can't select already linked
    setSelectedProjectId(projectId);
    const proj = projects?.find(p => p.id === projectId);
    if (proj?.default_workflow_type) {
      setWorkflowType(proj.default_workflow_type as 'full_immigration' | 'no_visa');
    }
  };

  const handleLink = () => {
    if (!candidate || !selectedProjectId || !selectedProject) return;
    createWorkflow.mutate(
      { candidateId: candidate.id, projectId: selectedProjectId, workflowType },
      {
        onSuccess: () => {
          onLinked?.(selectedProjectId, selectedProject.name, workflowType);
          onOpenChange(false);
          setSelectedProjectId(null);
          setSearch('');
          setWorkflowType('full_immigration');
        },
      }
    );
  };

  const handleConfirmUnlink = () => {
    if (!unlinkTarget || !candidate) return;
    deleteWorkflow.mutate(
      { workflowId: unlinkTarget.workflowId, candidateId: candidate.id },
      {
        onSuccess: () => {
          logActivity.mutate({
            candidate_id: candidate.id,
            event_type: 'unlinked_from_project',
            summary: `Unlinked from project "${unlinkTarget.projectName}"`,
            is_shared_event: true,
            details: { project_name: unlinkTarget.projectName },
          });
          setUnlinkTarget(null);
        },
      }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Link to Project</DialogTitle>
            <DialogDescription>
              Link <span className="font-medium text-foreground">{candidate?.full_name}</span> to a project and start their workflow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Existing linked projects */}
            {linkedProjectsWithNames.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Currently Linked</Label>
                <div className="space-y-1.5">
                  {linkedProjectsWithNames.map(lp => (
                    <div key={lp.id} className="flex items-center justify-between px-3 py-2 rounded-md border bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{lp.projectName}</span>
                        <Badge variant="outline" className="text-xs">
                          {WORKFLOW_TYPE_CONFIG[lp.workflow_type as keyof typeof WORKFLOW_TYPE_CONFIG]?.label || lp.workflow_type}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setUnlinkTarget({ workflowId: lp.id, projectName: lp.projectName })}
                      >
                        <Unlink className="h-3.5 w-3.5 mr-1" />
                        Unlink
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Project list */}
            <div className="max-h-52 overflow-y-auto border rounded-lg divide-y divide-border">
              {projectsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  No projects found
                </div>
              ) : (
                filteredProjects.map(project => {
                  const isLinked = linkedProjectIds.has(project.id);
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => handleSelectProject(project.id)}
                      disabled={isLinked}
                      className={`w-full text-left px-4 py-3 transition-colors ${
                        isLinked
                          ? 'opacity-50 cursor-not-allowed bg-muted/20'
                          : selectedProjectId === project.id
                          ? 'bg-primary/5 ring-1 ring-inset ring-primary/20'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {project.name}
                            {isLinked && <span className="ml-2 text-xs text-muted-foreground">(already linked)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{project.employer_name} · {project.location}</p>
                        </div>
                        <Badge variant="secondary" className={getProjectStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Workflow type */}
            {selectedProject && (
              <div className="space-y-2">
                <Label>Workflow Type</Label>
                <Select value={workflowType} onValueChange={(v) => setWorkflowType(v as 'full_immigration' | 'no_visa')}>
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
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleLink}
                disabled={!selectedProjectId || createWorkflow.isPending}
              >
                {createWorkflow.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Link to Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unlink Confirmation */}
      <AlertDialog open={!!unlinkTarget} onOpenChange={(open) => { if (!open) setUnlinkTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Unlink from project?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink <span className="font-medium text-foreground">{candidate?.full_name}</span> from{' '}
              <span className="font-medium text-foreground">{unlinkTarget?.projectName}</span>? This will remove their workflow and all progress for this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmUnlink}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteWorkflow.isPending}
            >
              {deleteWorkflow.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
