import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import { mockCandidates } from '@/data/mockCandidates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { RecruitmentStage, stageLabels } from '@/types/candidate';

const Candidates = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');

  const filteredCandidates = mockCandidates.filter((candidate) => {
    const matchesSearch =
      searchQuery === '' ||
      `${candidate.firstName} ${candidate.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage =
      stageFilter === 'all' || candidate.stage === stageFilter;

    return matchesSearch && matchesStage;
  });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Candidates</h1>
            <p className="text-muted-foreground">
              Manage and review all candidate applications
            </p>
          </div>
          <Button className="gap-2 w-fit">
            <Plus className="h-4 w-4" />
            Add Candidate
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {(Object.entries(stageLabels) as [RecruitmentStage, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredCandidates.length} of {mockCandidates.length} candidates
        </p>

        {/* Table */}
        <CandidateTable candidates={filteredCandidates} />
      </div>
    </AppLayout>
  );
};

export default Candidates;
