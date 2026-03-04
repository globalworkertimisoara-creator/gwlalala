import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WORKFLOW_TYPE_CONFIG } from '@/types/project';
import { useProjects } from '@/hooks/useProjects';
import { useCreateWorkflow } from '@/hooks/useWorkflow';
import { Candidate } from '@/types/database';
import { Search, Loader2, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getProjectStatusColor } from '@/types/project';

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

  const { data: projects, isLoading: projectsLoading } = useProjects();
  const createWorkflow = useCreateWorkflow();

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      p => p.name.toLowerCase().includes(q) || p.employer_name.toLowerCase().includes(q)
    );
  }, [projects, search]);

  const selectedProject = projects?.find(p => p.id === selectedProjectId);

  const handleSelectProject = (projectId: string) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link to Project</DialogTitle>
          <DialogDescription>
            Link <span className="font-medium text-foreground">{candidate?.full_name}</span> to a project and start their workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
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
              filteredProjects.map(project => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleSelectProject(project.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                    selectedProjectId === project.id ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-foreground">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.employer_name} · {project.location}</p>
                    </div>
                    <Badge variant="secondary" className={getProjectStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                </button>
              ))
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
  );
}
