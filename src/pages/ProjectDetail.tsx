import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProject, useUpdateProject, useDeleteProject, useLinkJobToProject } from '@/hooks/useProjects';
import { useJobs, useCreateJob } from '@/hooks/useJobs';
import { usePipelineCandidates, useAddCandidateToPipeline } from '@/hooks/usePipelineCandidates';
import { useCandidates } from '@/hooks/useCandidates';
import { useContractsByProject, useContracts, useLinkContractToProject } from '@/hooks/useContracts';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Trash2,
  Loader2,
  LayoutDashboard,
  Users,
  Briefcase,
  Activity,
} from 'lucide-react';
import { PROJECT_STATUS_CONFIG, ProjectStatus } from '@/types/project';
import { useState } from 'react';

import { ProjectOverviewTab } from '@/components/projects/ProjectOverviewTab';
import { ProjectPeopleTab } from '@/components/projects/ProjectPeopleTab';
import { ProjectBusinessTab } from '@/components/projects/ProjectBusinessTab';
import { ProjectActivityTab } from '@/components/projects/ProjectActivityTab';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromSales = searchParams.get('from') === 'sales-analytics';

  const { data: project, isLoading } = useProject(id!);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const linkJobToProject = useLinkJobToProject();

  // Pipeline data
  const { data: pipelineCandidates = [], isLoading: pipelineLoading } = usePipelineCandidates(id);
  const { data: allCandidates = [] } = useCandidates();
  const addToPipeline = useAddCandidateToPipeline();

  // Jobs data
  const { data: allJobs = [] } = useJobs();
  const createJob = useCreateJob();

  // Contract data
  const { data: projectContracts = [], isLoading: contractsLoading } = useContractsByProject(id);
  const { data: allContracts = [] } = useContracts();
  const linkContractToProject = useLinkContractToProject();

  // Tasks data (for count in overview)
  const { data: projectTasks = [] } = useTasks({ entity_type: 'project', entity_id: id });
  const pendingTaskCount = projectTasks.filter(t => t.status !== 'done').length;

  const [activeTab, setActiveTab] = useState('overview');

  const handleStatusChange = (status: ProjectStatus) => {
    if (project) {
      updateProject.mutate({ id: project.id, status });
    }
  };

  const handleDelete = async () => {
    if (project) {
      await deleteProject.mutateAsync(project.id);
      navigate('/projects');
    }
  };

  const handleLinkJob = async (jobId: string) => {
    if (!id) return;
    await linkJobToProject.mutateAsync({ jobId, projectId: id });
  };

  const handleCreateJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createJob.mutateAsync({
      title: formData.get('title') as string,
      client_company: formData.get('client_company') as string,
      country: formData.get('country') as string,
      salary_range: formData.get('salary_range') as string || undefined,
      required_skills: formData.get('required_skills') as string || undefined,
      description: formData.get('description') as string || undefined,
      project_id: id,
    });
  };

  const handleLinkContract = async (contractId: string) => {
    if (!id) return;
    await linkContractToProject.mutateAsync({ contractId, projectId: id });
  };

  const handleUnlinkContract = async (contractId: string) => {
    await linkContractToProject.mutateAsync({ contractId, projectId: null });
  };

  const handleAddCandidate = async (candidateId: string, workflowType: 'full_immigration' | 'no_visa') => {
    if (!id) return;
    await addToPipeline.mutateAsync({ candidateId, projectId: id, workflowType });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        {fromSales && (
          <Button variant="outline" size="sm" className="mb-2 gap-1" onClick={() => navigate('/sales-analytics')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Sales Analytics
          </Button>
        )}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(fromSales ? '/sales-analytics' : '/projects')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">{project.employer_name}</p>
          </div>
          <Select value={project.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROJECT_STATUS_CONFIG).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this project. Jobs linked to this project will be unlinked but not deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Tabs: Overview | People | Business | Activity */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview" className="gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="people" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              People ({pipelineCandidates.length})
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              Business
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Activity {pendingTaskCount > 0 && `(${pendingTaskCount})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <ProjectOverviewTab
              project={project}
              onUpdateProject={(updates) => updateProject.mutate(updates)}
              pipelineCount={pipelineCandidates.length}
              contractCount={projectContracts.length}
              taskCount={pendingTaskCount}
              onTabChange={setActiveTab}
            />
          </TabsContent>

          <TabsContent value="people" className="mt-6">
            <ProjectPeopleTab
              projectId={id!}
              pipelineCandidates={pipelineCandidates}
              pipelineLoading={pipelineLoading}
              allCandidates={allCandidates}
              defaultWorkflowType={project.default_workflow_type || 'full_immigration'}
              onAddCandidate={handleAddCandidate}
              addPending={addToPipeline.isPending}
            />
          </TabsContent>

          <TabsContent value="business" className="mt-6">
            <ProjectBusinessTab
              projectId={id!}
              employerName={project.employer_name}
              location={project.location}
              jobs={project.jobs as any}
              allJobs={allJobs as any}
              onLinkJob={handleLinkJob}
              linkJobPending={linkJobToProject.isPending}
              onCreateJob={handleCreateJob}
              createJobPending={createJob.isPending}
              projectContracts={projectContracts}
              contractsLoading={contractsLoading}
              allContracts={allContracts}
              onLinkContract={handleLinkContract}
              onUnlinkContract={handleUnlinkContract}
              linkContractPending={linkContractToProject.isPending}
            />
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <ProjectActivityTab projectId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
