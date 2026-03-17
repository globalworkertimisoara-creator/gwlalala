import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Briefcase,
  FileText,
  Plus,
  Link2,
  Search,
  Unlink,
  Loader2,
} from 'lucide-react';
import { CreateContractDialog } from '@/components/contracts/CreateContractDialog';
import { ContractDetailDialog } from '@/components/contracts/ContractDetailDialog';
import type { Contract } from '@/types/contract';

interface Job {
  id: string;
  title: string;
  status: string;
  total_candidates: number;
  placed_candidates: number;
  client_company: string;
  country: string;
  [key: string]: any;
}

interface ProjectBusinessTabProps {
  projectId: string;
  employerName: string;
  location: string;
  // Jobs
  jobs: Job[];
  allJobs: Job[];
  onLinkJob: (jobId: string) => Promise<void>;
  linkJobPending: boolean;
  onCreateJob: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  createJobPending: boolean;
  // Contracts
  projectContracts: Contract[];
  contractsLoading: boolean;
  allContracts: Contract[];
  onLinkContract: (contractId: string) => Promise<void>;
  onUnlinkContract: (contractId: string) => Promise<void>;
  linkContractPending: boolean;
}

export function ProjectBusinessTab({
  projectId,
  employerName,
  location,
  jobs,
  allJobs,
  onLinkJob,
  linkJobPending,
  onCreateJob,
  createJobPending,
  projectContracts,
  contractsLoading,
  allContracts,
  onLinkContract,
  onUnlinkContract,
  linkContractPending,
}: ProjectBusinessTabProps) {
  const navigate = useNavigate();

  // Job state
  const [jobSearch, setJobSearch] = useState('');
  const [linkedJobSearch, setLinkedJobSearch] = useState('');
  const [linkJobDialogOpen, setLinkJobDialogOpen] = useState(false);
  const [createJobDialogOpen, setCreateJobDialogOpen] = useState(false);

  // Contract state
  const [createContractDialogOpen, setCreateContractDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [linkContractDialogOpen, setLinkContractDialogOpen] = useState(false);
  const [contractSearch, setContractSearch] = useState('');

  const linkedJobIds = new Set(jobs.map(j => j.id));
  const availableJobs = useMemo(() => {
    return allJobs
      .filter(j => !linkedJobIds.has(j.id))
      .filter(j => {
        if (!jobSearch) return true;
        const q = jobSearch.toLowerCase();
        return j.title.toLowerCase().includes(q) || j.client_company.toLowerCase().includes(q);
      });
  }, [allJobs, linkedJobIds, jobSearch]);

  const filteredLinkedJobs = useMemo(() => {
    if (!linkedJobSearch) return jobs;
    const q = linkedJobSearch.toLowerCase();
    return jobs.filter(j => j.title.toLowerCase().includes(q));
  }, [jobs, linkedJobSearch]);

  const linkedContractIds = new Set(projectContracts.map(c => c.id));
  const availableContracts = useMemo(() => {
    return allContracts
      .filter(c => !linkedContractIds.has(c.id) && !c.project_id)
      .filter(c => {
        if (!contractSearch) return true;
        const q = contractSearch.toLowerCase();
        return c.title.toLowerCase().includes(q) || (c.contract_number || '').toLowerCase().includes(q);
      });
  }, [allContracts, linkedContractIds, contractSearch]);

  return (
    <div className="space-y-6">
      {/* Contracts Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Contracts ({projectContracts.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Dialog open={linkContractDialogOpen} onOpenChange={(open) => { setLinkContractDialogOpen(open); if (!open) setContractSearch(''); }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Link2 className="h-4 w-4" />
                  Link Contract
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Link Existing Contract</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search contracts..."
                      value={contractSearch}
                      onChange={e => setContractSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {availableContracts.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {contractSearch ? 'No matching contracts found' : 'No unlinked contracts available'}
                      </p>
                    ) : (
                      availableContracts.slice(0, 20).map(c => (
                        <button
                          key={c.id}
                          onClick={() => onLinkContract(c.id)}
                          disabled={linkContractPending}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg border hover:bg-accent/50 transition-colors text-left"
                        >
                          <div>
                            <p className="text-sm font-medium">{c.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.contract_number || 'No number'}
                              <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="ml-2 text-[10px] px-1.5 py-0">
                                {c.status}
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
            <Button size="sm" className="gap-1.5" onClick={() => setCreateContractDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New Contract
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contractsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : projectContracts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No contracts linked yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectContracts.map(c => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedContract(c)}
                  >
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{c.contract_number || '—'}</TableCell>
                    <TableCell className="capitalize">{c.contract_type}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status}</Badge>
                    </TableCell>
                    <TableCell>{c.total_value ? `${c.total_value.toLocaleString()} ${c.currency}` : '—'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); onUnlinkContract(c.id); }}
                        disabled={linkContractPending}
                      >
                        <Unlink className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Jobs Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Jobs ({jobs.length})
          </CardTitle>
          <div className="flex items-center gap-2">
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
                          onClick={() => onLinkJob(job.id)}
                          disabled={linkJobPending}
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
                <form onSubmit={onCreateJob} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pj-title">Job Title *</Label>
                      <Input id="pj-title" name="title" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pj-client_company">Client Company *</Label>
                      <Input id="pj-client_company" name="client_company" defaultValue={employerName} required />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pj-country">Country *</Label>
                      <Input id="pj-country" name="country" defaultValue={location} required />
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
                    <Button type="submit" disabled={createJobPending}>
                      {createJobPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
          {jobs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No jobs linked yet</p>
            </div>
          ) : (
            <div className="space-y-4">
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

      {/* Dialogs */}
      <CreateContractDialog
        open={createContractDialogOpen}
        onOpenChange={setCreateContractDialogOpen}
        preselectedProjectId={projectId}
      />
      <ContractDetailDialog
        contract={selectedContract}
        open={!!selectedContract}
        onOpenChange={(open) => { if (!open) setSelectedContract(null); }}
      />
    </div>
  );
}
