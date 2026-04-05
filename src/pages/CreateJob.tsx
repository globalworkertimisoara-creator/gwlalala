import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Briefcase, Building2, MapPin, DollarSign, FileText, Link2 } from 'lucide-react';
import { useCreateJob } from '@/hooks/useJobs';
import { useProjects, useLinkJobToProject } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';

export default function CreateJob() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId') || '';
  const { toast } = useToast();

  const createJob = useCreateJob();
  const linkJobToProject = useLinkJobToProject();
  const { data: projects = [] } = useProjects();

  const [showErrors, setShowErrors] = useState(false);

  const fieldError = (value: string) => {
    if (!showErrors) return '';
    if (!value || !value.trim()) return 'border-destructive ring-1 ring-destructive';
    return '';
  };

  const [form, setForm] = useState({
    title: '',
    client_company: '',
    country: '',
    salary_range: '',
    required_skills: '',
    description: '',
    positions_needed: '',
    experience_level: '',
    employment_type: '',
    project_id: preselectedProjectId,
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title || !form.client_company || !form.country) {
      toast({
        variant: 'destructive',
        title: 'Missing required fields',
        description: 'Please fill in job title, client company, and country.',
      });
      return;
    }

    try {
      const job = await createJob.mutateAsync({
        title: form.title,
        client_company: form.client_company,
        country: form.country,
        salary_range: form.salary_range || undefined,
        required_skills: form.required_skills || undefined,
        description: form.description || undefined,
      });

      // Link to project if selected
      if (form.project_id && job?.id) {
        await linkJobToProject.mutateAsync({ jobId: job.id, projectId: form.project_id });
      }

      navigate('/jobs');
    } catch {
      // Error handled by hook
    }
  };

  // Auto-fill client company from selected project
  const handleProjectChange = (projectId: string) => {
    updateField('project_id', projectId);
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project && !form.client_company) {
        updateField('client_company', project.employer_name);
      }
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        {/* Back */}
        <Button
          variant="ghost"
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/jobs')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Create New Job</h1>
          <p className="text-sm text-muted-foreground">
            Add a new job opening and optionally link it to a project
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Link to Project */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Link to Project
              </CardTitle>
              <CardDescription className="text-xs">
                Select a project to associate this job with. The client company will auto-fill.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={form.project_id} onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {projects.filter(p => p.status === 'active' || p.status === 'draft').map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <span>{p.name}</span>
                        <span className="text-muted-foreground text-xs">— {p.employer_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    placeholder="e.g., Electrician, Welder, Plumber"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_company">
                    <Building2 className="h-3.5 w-3.5 inline mr-1" />
                    Client Company *
                  </Label>
                  <Input
                    id="client_company"
                    value={form.client_company}
                    onChange={(e) => updateField('client_company', e.target.value)}
                    placeholder="e.g., ABC Construction Ltd"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="country">
                    <MapPin className="h-3.5 w-3.5 inline mr-1" />
                    Country *
                  </Label>
                  <Input
                    id="country"
                    value={form.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    placeholder="e.g., Romania, Germany, UAE"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary_range">
                    <DollarSign className="h-3.5 w-3.5 inline mr-1" />
                    Salary Range
                  </Label>
                  <Input
                    id="salary_range"
                    value={form.salary_range}
                    onChange={(e) => updateField('salary_range', e.target.value)}
                    placeholder="e.g., €2,000-3,000/month"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="positions_needed">Positions Needed</Label>
                  <Input
                    id="positions_needed"
                    type="number"
                    min="1"
                    value={form.positions_needed}
                    onChange={(e) => updateField('positions_needed', e.target.value)}
                    placeholder="e.g., 5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience_level">Experience Level</Label>
                  <Select value={form.experience_level} onValueChange={(v) => updateField('experience_level', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level (2-5 years)</SelectItem>
                      <SelectItem value="senior">Senior (5+ years)</SelectItem>
                      <SelectItem value="expert">Expert (10+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select value={form.employment_type} onValueChange={(v) => updateField('employment_type', v)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Skills & Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Requirements & Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="required_skills">Required Skills</Label>
                <Input
                  id="required_skills"
                  value={form.required_skills}
                  onChange={(e) => updateField('required_skills', e.target.value)}
                  placeholder="e.g., Welding, GMAW, Blueprint Reading (comma-separated)"
                />
                <p className="text-[11px] text-muted-foreground">Separate multiple skills with commas</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={5}
                  placeholder="Describe the role responsibilities, working conditions, benefits, and any other relevant details..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/jobs')}>
              Cancel
            </Button>
            <Button type="submit" disabled={createJob.isPending} className="gap-2">
              {createJob.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Job
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
