import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProject, useUpdateProject, useDeleteProject, useLinkJobToProject } from '@/hooks/useProjects';
import { useJobs, useCreateJob } from '@/hooks/useJobs';
import { usePipelineCandidates, useAddCandidateToPipeline } from '@/hooks/usePipelineCandidates';
import { useCandidates } from '@/hooks/useCandidates';
import { PipelineBoard } from '@/components/pipeline/PipelineBoard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Clock,
  Calendar,
  Briefcase,
  Trash2,
  Loader2,
  Plus,
  GitBranchPlus,
  Search,
  Link2,
  Route,
} from 'lucide-react';
import WorkflowPhaseTracker from '@/components/projects/WorkflowPhaseTracker';
import { format } from 'date-fns';
import { getProjectStatusColor, getProjectStatusLabel, PROJECT_STATUS_CONFIG, ProjectStatus, WORKFLOW_TYPE_CONFIG, WorkflowType } from '@/types/project';
import { useState, useMemo } from 'react';

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
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [pipelineWorkflowType, setPipelineWorkflowType] = useState<WorkflowType | ''>('');

  // Job linking & creation state
  const { data: allJobs = [] } = useJobs();
  const createJob = useCreateJob();
  const [jobSearch, setJobSearch] = useState('');
  const [linkedJobSearch, setLinkedJobSearch] = useState('');
  const [linkJobDialogOpen, setLinkJobDialogOpen] = useState(false);
  const [createJobDialogOpen, setCreateJobDialogOpen] = useState(false);

  const existingCandidateIds = new Set(pipelineCandidates.map(pc => pc.candidate_id));
  const availableCandidates = useMemo(() => {
    return allCandidates
      .filter(c => !existingCandidateIds.has(c.id))
      .filter(c => !candidateSearch || c.full_name.toLowerCase().includes(candidateSearch.toLowerCase()) || c.email.toLowerCase().includes(candidateSearch.toLowerCase()));
  }, [allCandidates, existingCandidateIds, candidateSearch]);

  // Jobs not yet linked to this project (for linking dialog)
  const linkedJobIds = new Set(project?.jobs?.map(j => j.id) || []);
  const availableJobs = useMemo(() => {
    return allJobs
      .filter(j => !linkedJobIds.has(j.id))
      .filter(j => {
        if (!jobSearch) return true;
        const q = jobSearch.toLowerCase();
        return j.title.toLowerCase().includes(q) || j.client_company.toLowerCase().includes(q);
      });
  }, [allJobs, linkedJobIds, jobSearch]);

  // Filter linked jobs by search
  const filteredLinkedJobs = useMemo(() => {
    if (!project?.jobs) return [];
    if (!linkedJobSearch) return project.jobs;
    const q = linkedJobSearch.toLowerCase();
    return project.jobs.filter(j => j.title.toLowerCase().includes(q));
  }, [project?.jobs, linkedJobSearch]);

  const handleAddCandidate = async (candidateId: string) => {
    if (!id) return;
    const wfType = (pipelineWorkflowType || project?.default_workflow_type || 'full_immigration') as 'full_immigration' | 'no_visa';
    await addToPipeline.mutateAsync({ candidateId, projectId: id, workflowType: wfType });
    setAddDialogOpen(false);
    setCandidateSearch('');
    setPipelineWorkflowType('');
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
    setCreateJobDialogOpen(false);
  };

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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
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

        {/* Tabs: Overview | Pipeline | Workflow */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-1.5">
              <GitBranchPlus className="h-3.5 w-3.5" />
              Pipeline ({pipelineCandidates.length})
            </TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Details */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Employer</p>
                        <p className="font-medium">{project.employer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-medium">{project.location}</p>
                      </div>
                    </div>
                    {project.sales_person_name && (
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Sales Person</p>
                          <p className="font-medium">{project.sales_person_name}</p>
                        </div>
                      </div>
                    )}
                    {project.contract_signed_at && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Contract Signed</p>
                          <p className="font-medium">
                            {format(new Date(project.contract_signed_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    )}
                    {project.days_since_contract !== null && (
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Time Since Contract</p>
                          <p className="font-medium">{project.days_since_contract} days</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Route className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Workflow Type</p>
                        <Select
                          value={project.default_workflow_type || 'full_immigration'}
                          onValueChange={(v) => updateProject.mutate({ id: project.id, default_workflow_type: v } as any)}
                        >
                          <SelectTrigger className="h-8 w-[180px] mt-0.5">
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
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contract Countries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.countries_in_contract.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {project.countries_in_contract.map(country => (
                          <Badge key={country} variant="outline">
                            {country}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No countries specified</p>
                    )}
                  </CardContent>
                </Card>

                {project.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{project.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Metrics & Jobs */}
              <div className="lg:col-span-2 space-y-6">
                {/* Fulfillment Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contract Fulfillment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold">{project.fill_percentage}%</span>
                      <span className="text-muted-foreground">
                        {project.filled_positions} of {project.total_positions} positions filled
                      </span>
                    </div>
                    <Progress value={project.fill_percentage} className="h-3" />
                  </CardContent>
                </Card>

                {/* Jobs Table */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Linked Jobs ({project.jobs.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {/* Link Existing Job Dialog */}
                      <Dialog open={linkJobDialogOpen} onOpenChange={(open) => { setLinkJobDialogOpen(open); if (!open) setJobSearch(''); }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1.5">
                            <Link2 className="h-4 w-4" />
                            Link Job
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Link Existing Job</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search active jobs..."
                                value={jobSearch}
                                onChange={e => setJobSearch(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-1">
                              {availableJobs.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  {jobSearch ? 'No matching jobs found' : 'All jobs are already linked'}
                                </p>
                              ) : (
                                availableJobs.slice(0, 20).map(job => (
                                  <button
                                    key={job.id}
                                    onClick={() => handleLinkJob(job.id)}
                                    disabled={linkJobToProject.isPending}
                                    className="w-full flex items-center justify-between p-2.5 rounded-lg border hover:bg-accent/50 transition-colors text-left"
                                  >
                                    <div>
                                      <p className="text-sm font-medium">{job.title}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {job.client_company} · {job.country}
                                        <Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="ml-2 text-[10px] px-1.5 py-0">
                                          {job.status}
                                        </Badge>
                                      </p>
                                    </div>
                                    <Link2 className="h-4 w-4 text-muted-foreground" />
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Add New Job Dialog */}
                      <Dialog open={createJobDialogOpen} onOpenChange={setCreateJobDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="gap-1.5">
                            <Plus className="h-4 w-4" />
                            Add Job
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Create New Job</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleCreateJob} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="pj-title">Job Title *</Label>
                                <Input id="pj-title" name="title" required />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="pj-client_company">Client Company *</Label>
                                <Input id="pj-client_company" name="client_company" defaultValue={project.employer_name} required />
                              </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="pj-country">Country *</Label>
                                <Input id="pj-country" name="country" defaultValue={project.location} required />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="pj-salary_range">Salary Range</Label>
                                <Input id="pj-salary_range" name="salary_range" placeholder="e.g., €50k-70k" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="pj-required_skills">Required Skills</Label>
                              <Input id="pj-required_skills" name="required_skills" placeholder="e.g., JavaScript, React, Node.js" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="pj-description">Description</Label>
                              <Textarea id="pj-description" name="description" rows={3} />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setCreateJobDialogOpen(false)}>Cancel</Button>
                              <Button type="submit" disabled={createJob.isPending}>
                                {createJob.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Job
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <Button variant="outline" size="sm" asChild>
                        <Link to="/jobs">Manage Jobs</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.jobs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No jobs linked to this project yet</p>
                        <p className="text-sm">Link existing jobs or create a new one</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Search bar for linked jobs */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search linked jobs..."
                            value={linkedJobSearch}
                            onChange={e => setLinkedJobSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Role</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-center">Total</TableHead>
                              <TableHead className="text-center">Placed</TableHead>
                              <TableHead className="text-right">Fill Rate</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredLinkedJobs.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                                  No jobs match your search
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredLinkedJobs.map(job => {
                                const fillRate = job.total_candidates > 0
                                  ? Math.round((job.placed_candidates / job.total_candidates) * 100)
                                  : 0;
                                return (
                                  <TableRow
                                    key={job.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                  >
                                    <TableCell className="font-medium">{job.title}</TableCell>
                                    <TableCell>
                                      <Badge variant={job.status === 'open' ? 'default' : 'secondary'}>
                                        {job.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">{job.total_candidates}</TableCell>
                                    <TableCell className="text-center">{job.placed_candidates}</TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <Progress value={fillRate} className="w-16 h-2" />
                                        <span className="text-sm w-10">{fillRate}%</span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pipeline" className="mt-6">
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
                        value={pipelineWorkflowType || project.default_workflow_type || 'full_immigration'}
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
                        {WORKFLOW_TYPE_CONFIG[(pipelineWorkflowType || project.default_workflow_type || 'full_immigration') as WorkflowType]?.description}
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
            </div>
            <PipelineBoard candidates={pipelineCandidates} isLoading={pipelineLoading} />
          </TabsContent>

          <TabsContent value="workflow" className="mt-6">
            <WorkflowPhaseTracker projectId={project.id} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
