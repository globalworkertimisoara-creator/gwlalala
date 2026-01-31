import { AppLayout } from '@/components/layout/AppLayout';
import { PipelineColumn } from '@/components/pipeline/PipelineColumn';
import { useCandidates, useCreateCandidate } from '@/hooks/useCandidates';
import { RecruitmentStage, STAGES, Candidate } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Search, LayoutGrid, List } from 'lucide-react';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// Active pipeline stages (exclude closed_not_placed from main view)
const pipelineStages: RecruitmentStage[] = STAGES
  .filter(s => s.value !== 'closed_not_placed')
  .map(s => s.value);

const Pipeline = () => {
  const { data: candidates, isLoading } = useCandidates();
  const createCandidate = useCreateCandidate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [nationalityFilter, setNationalityFilter] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');

  // Extract unique nationalities and countries for filter dropdowns
  const { nationalities, countries } = useMemo(() => {
    const nats = new Set<string>();
    const ctrs = new Set<string>();
    (candidates || []).forEach(c => {
      if (c.nationality) nats.add(c.nationality);
      if (c.current_country) ctrs.add(c.current_country);
    });
    return {
      nationalities: Array.from(nats).sort(),
      countries: Array.from(ctrs).sort(),
    };
  }, [candidates]);

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return (candidates || []).filter(c => {
      if (searchTerm && !c.full_name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (nationalityFilter && nationalityFilter !== 'all' && c.nationality !== nationalityFilter) {
        return false;
      }
      if (countryFilter && countryFilter !== 'all' && c.current_country !== countryFilter) {
        return false;
      }
      return true;
    });
  }, [candidates, searchTerm, nationalityFilter, countryFilter]);

  const handleCreateCandidate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    await createCandidate.mutateAsync({
      full_name: formData.get('full_name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || undefined,
      nationality: formData.get('nationality') as string || undefined,
      current_country: formData.get('current_country') as string || undefined,
      linkedin: formData.get('linkedin') as string || undefined,
      current_stage: formData.get('current_stage') as RecruitmentStage || 'sourced',
    });

    setIsDialogOpen(false);
  };

  const handleCandidateClick = (candidate: Candidate) => {
    // TODO: Open candidate detail modal/page
    console.log('Clicked candidate:', candidate);
  };

  const isCompact = viewMode === 'compact';

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">Pipeline</h1>
            <p className="text-sm text-muted-foreground">
              Track candidates through recruitment stages
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add Candidate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Candidate</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCandidate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input id="full_name" name="full_name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input id="nationality" name="nationality" placeholder="e.g., Romanian" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="current_country">Current Country</Label>
                    <Input id="current_country" name="current_country" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current_stage">Stage</Label>
                    <Select name="current_stage" defaultValue="sourced">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map(stage => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label.split(' / ')[0]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input id="linkedin" name="linkedin" type="url" placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCandidate.isPending}>
                    {createCandidate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Candidate
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-card rounded-lg border border-border/60">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue placeholder="Nationality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Nationalities</SelectItem>
              {nationalities.map(nat => (
                <SelectItem key={nat} value={nat}>{nat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map(country => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto">
            <ToggleGroup 
              type="single" 
              value={viewMode} 
              onValueChange={(v) => v && setViewMode(v as 'compact' | 'detailed')}
              size="sm"
            >
              <ToggleGroupItem value="compact" aria-label="Compact view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="detailed" aria-label="Detailed view">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Pipeline Board */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className={isCompact ? "flex gap-2 min-w-max" : "flex gap-4 min-w-max"}>
              {pipelineStages.map((stage) => (
                <PipelineColumn
                  key={stage}
                  stage={stage}
                  candidates={filteredCandidates}
                  onCandidateClick={handleCandidateClick}
                  compact={isCompact}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Pipeline;
