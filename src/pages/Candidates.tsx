import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import { LinkToProjectDialog } from '@/components/candidates/LinkToProjectDialog';
import { useCandidates } from '@/hooks/useCandidates';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Download, Loader2 } from 'lucide-react';
import { RecruitmentStage, STAGES, Candidate } from '@/types/database';

const Candidates = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const { can } = usePermissions();

  const { data: candidates, isLoading } = useCandidates({
    stage: stageFilter === 'all' ? undefined : (stageFilter as RecruitmentStage),
    search: searchQuery || undefined,
  });

  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [linkCandidate, setLinkCandidate] = useState<Candidate | null>(null);

  const handleExportCSV = () => {
    if (!candidates || candidates.length === 0) return;

    const headers = ['Full Name', 'Email', 'Phone', 'Nationality', 'Country', 'LinkedIn', 'Stage', 'Expected Start', 'Rejection Reason', 'Created At'];
    const rows = candidates.map(c => [
      c.full_name,
      c.email,
      c.phone || '',
      c.nationality || '',
      c.current_country || '',
      c.linkedin || '',
      c.current_stage,
      c.expected_start_date || '',
      c.rejection_reason || '',
      new Date(c.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `candidates-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleCandidateClick = (candidate: Candidate) => {
    navigate(`/candidates/${candidate.id}`);
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Candidates & Leads</h1>
            <p className="text-muted-foreground">
              Internal leads from marketing channels, referrals, and direct applications
            </p>
          </div>
          <div className="flex gap-2">
            {can('exportCandidates') && (
              <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            )}
            {can('createCandidates') && (
              <Button className="gap-2" onClick={() => navigate('/candidates/new')}>
                <Plus className="h-4 w-4" />
                Add Candidate
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or nationality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {STAGES.map(stage => (
                <SelectItem key={stage.value} value={stage.value}>
                  {stage.label.split(' / ')[0]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Loading...' : `Showing ${candidates?.length || 0} candidates`}
        </p>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <CandidateTable 
            candidates={candidates || []} 
            onCandidateClick={handleCandidateClick}
            onLinkToProject={(c) => setLinkCandidate(c)}
          />
        )}
      </div>

      <AddCandidateDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <LinkToProjectDialog
        open={!!linkCandidate}
        onOpenChange={(open) => { if (!open) setLinkCandidate(null); }}
        candidate={linkCandidate}
      />
    </AppLayout>
  );
};

export default Candidates;
