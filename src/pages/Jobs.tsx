import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useJobs, useCreateJob, useJobCandidateCount } from '@/hooks/useJobs';
import { usePermissions } from '@/hooks/usePermissions';
import { JobStatus } from '@/types/database';
import { Plus, Search, Building2, MapPin, DollarSign, Loader2, FolderOpen, ArrowUpDown, Calendar } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

const statusColors: Record<JobStatus, string> = {
  open: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  filled: 'bg-blue-100 text-blue-800',
};

type SortOption = 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'country_asc' | 'country_desc' | 'status_asc' | 'status_desc';

export default function Jobs() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { can } = usePermissions();

  const { data: jobs, isLoading } = useJobs({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: search || undefined,
  });
  const { data: candidateCounts } = useJobCandidateCount();
  const createJob = useCreateJob();

  const sortedJobs = useMemo(() => {
    if (!jobs) return [];
    const sorted = [...jobs];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'title_asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'title_desc':
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case 'country_asc':
        return sorted.sort((a, b) => a.country.localeCompare(b.country));
      case 'country_desc':
        return sorted.sort((a, b) => b.country.localeCompare(a.country));
      case 'status_asc':
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      case 'status_desc':
        return sorted.sort((a, b) => b.status.localeCompare(a.status));
      default:
        return sorted;
    }
  }, [jobs, sortBy]);

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
    });

    setIsDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Jobs</h1>
            <p className="text-muted-foreground">
              Manage job openings and linked candidates
            </p>
          </div>
          {can('createJobs') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
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
                    <Label htmlFor="title">Job Title *</Label>
                    <Input id="title" name="title" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_company">Client Company *</Label>
                    <Input id="client_company" name="client_company" required />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input id="country" name="country" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary_range">Salary Range</Label>
                    <Input id="salary_range" name="salary_range" placeholder="e.g., €50k-70k" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="required_skills">Required Skills</Label>
                  <Input id="required_skills" name="required_skills" placeholder="e.g., JavaScript, React, Node.js" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createJob.isPending}>
                    {createJob.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Job
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as JobStatus | 'all')}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="filled">Filled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    <SelectValue placeholder="Sort by" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Date: Newest First</SelectItem>
                  <SelectItem value="oldest">Date: Oldest First</SelectItem>
                  <SelectItem value="title_asc">Title: A → Z</SelectItem>
                  <SelectItem value="title_desc">Title: Z → A</SelectItem>
                  <SelectItem value="country_asc">Country: A → Z</SelectItem>
                  <SelectItem value="country_desc">Country: Z → A</SelectItem>
                  <SelectItem value="status_asc">Status: A → Z</SelectItem>
                  <SelectItem value="status_desc">Status: Z → A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : sortedJobs.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Candidates</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedJobs.map((job) => (
                      <TableRow key={job.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/jobs/${job.id}`)}>
                        <TableCell className="font-medium">{job.title}</TableCell>
                        <TableCell>
                          {(job as any).projects ? (
                            <div className="flex items-center gap-2">
                              <FolderOpen className="h-4 w-4 text-muted-foreground" />
                              <span 
                                className="text-primary hover:underline cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); navigate(`/projects/${(job as any).projects.id}`); }}
                              >
                                {(job as any).projects.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {job.client_company}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {job.country}
                          </div>
                        </TableCell>
                        <TableCell>
                          {job.salary_range && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              {job.salary_range}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[job.status]}>
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(job.created_at), 'dd MMM yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {candidateCounts?.[job.id] || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No jobs found</p>
                <p className="text-sm">Create your first job to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
