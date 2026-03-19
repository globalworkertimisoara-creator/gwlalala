import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import { CandidateDetailPanel } from '@/components/candidates/CandidateDetailPanel';
import { LinkToProjectDialog } from '@/components/candidates/LinkToProjectDialog';
import { useCandidates } from '@/hooks/useCandidates';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Download, Loader2, Group } from 'lucide-react';
import { RecruitmentStage, STAGES, Candidate } from '@/types/database';

// Phase definitions for the stat bar and filter
const PHASES = [
  { key: 'Sourcing', stages: ['sourced', 'contacted', 'application_received'] as RecruitmentStage[], color: 'text-slate-700 bg-slate-100' },
  { key: 'Evaluation', stages: ['screening', 'shortlisted', 'submitted_to_client', 'client_feedback', 'interview_completed'] as RecruitmentStage[], color: 'text-blue-700 bg-blue-50' },
  { key: 'Closing', stages: ['offer_extended', 'offer_accepted'] as RecruitmentStage[], color: 'text-amber-700 bg-amber-50' },
  { key: 'Post-Hire', stages: ['visa_processing', 'medical_checks', 'onboarding', 'placed'] as RecruitmentStage[], color: 'text-green-700 bg-green-50' },
  { key: 'Closed', stages: ['closed_not_placed'] as RecruitmentStage[], color: 'text-red-700 bg-red-50' },
];

const Candidates = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [groupBy, setGroupBy] = useState('none');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [linkCandidate, setLinkCandidate] = useState<Candidate | null>(null);
  const { can } = usePermissions();
  const navigate = useNavigate();

  // Determine effective stage filter based on phase or individual stage selection
  const effectiveStageFilter = stageFilter !== 'all' ? stageFilter : undefined;

  const { data: candidates = [], isLoading } = useCandidates({
    stage: effectiveStageFilter as RecruitmentStage | undefined,
    search: searchQuery || undefined,
  });

  // All candidates for stats (unfiltered)
  const { data: allCandidates = [] } = useCandidates();

  // Apply phase filter client-side
  const filteredCandidates = useMemo(() => {
    if (phaseFilter === 'all') return candidates;
    const phase = PHASES.find(p => p.key === phaseFilter);
    if (!phase) return candidates;
    return candidates.filter(c => phase.stages.includes(c.current_stage));
  }, [candidates, phaseFilter]);

  // Keep selected candidate updated
  useEffect(() => {
    if (selectedCandidate) {
      const updated = filteredCandidates.find(c => c.id === selectedCandidate.id);
      if (updated) setSelectedCandidate(updated);
    }
  }, [filteredCandidates]);

  // Phase counts
  const phaseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const phase of PHASES) {
      counts[phase.key] = allCandidates.filter(c => phase.stages.includes(c.current_stage)).length;
    }
    return counts;
  }, [allCandidates]);

  // Long-wait count
  const longWaitCount = useMemo(() => {
    const now = new Date();
    return allCandidates.filter(c => {
      const days = Math.floor((now.getTime() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      return days > 14;
    }).length;
  }, [allCandidates]);

  const handleExportCSV = () => {
    if (!filteredCandidates || filteredCandidates.length === 0) return;
    const headers = ['Full Name', 'Email', 'Phone', 'Nationality', 'Country', 'LinkedIn', 'Stage', 'Expected Start', 'Rejection Reason', 'Created At'];
    const rows = filteredCandidates.map(c => [
      c.full_name, c.email, c.phone || '', c.nationality || '', c.current_country || '',
      c.linkedin || '', c.current_stage, c.expected_start_date || '', c.rejection_reason || '',
      new Date(c.created_at).toLocaleDateString(),
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `candidates-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handlePhaseClick = (phaseKey: string) => {
    setStageFilter('all');
    setPhaseFilter(prev => prev === phaseKey ? 'all' : phaseKey);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Candidates & Leads</h1>
              <p className="text-sm text-muted-foreground">Internal leads from marketing channels, referrals, and direct applications</p>
            </div>
            <div className="flex items-center gap-2">
              {can('exportCandidates') && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
              )}
              {can('createCandidates') && (
                <Button size="sm" className="gap-1.5" onClick={() => navigate('/candidates/new')}>
                  <Plus className="h-4 w-4" /> Add Candidate
                </Button>
              )}
            </div>
          </div>

          {/* Compact Stat Bar */}
          <div className="flex items-center gap-1 text-xs flex-wrap">
            <StatChip label="Total" value={allCandidates.length} active={phaseFilter === 'all' && stageFilter === 'all'} onClick={() => { setPhaseFilter('all'); setStageFilter('all'); }} />
            <span className="text-muted-foreground">·</span>
            {PHASES.map(phase => (
              <span key={phase.key} className="contents">
                <StatChip
                  label={phase.key}
                  value={phaseCounts[phase.key] || 0}
                  color={phase.color}
                  active={phaseFilter === phase.key}
                  onClick={() => handlePhaseClick(phase.key)}
                />
                <span className="text-muted-foreground">·</span>
              </span>
            ))}
            {longWaitCount > 0 && (
              <StatChip label="Long wait" value={longWaitCount} color="text-amber-700 bg-amber-50" />
            )}
          </div>

          {/* Filters */}
          <div className="flex items-end gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or nationality..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Select value={stageFilter} onValueChange={(v) => { setStageFilter(v); setPhaseFilter('all'); }}>
              <SelectTrigger className="w-[200px] h-10">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {PHASES.map(phase => (
                  <div key={phase.key}>
                    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{phase.key}</div>
                    {phase.stages.map(stageVal => {
                      const stage = STAGES.find(s => s.value === stageVal);
                      return stage ? (
                        <SelectItem key={stage.value} value={stage.value} className="pl-4 text-xs">
                          {stage.label.split(' / ')[0]}
                        </SelectItem>
                      ) : null;
                    })}
                  </div>
                ))}
              </SelectContent>
            </Select>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="h-10 w-[150px]">
                <Group className="h-4 w-4 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No grouping</SelectItem>
                <SelectItem value="phase">By Phase</SelectItem>
                <SelectItem value="stage">By Stage</SelectItem>
                <SelectItem value="country">By Country</SelectItem>
                <SelectItem value="nationality">By Nationality</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main content: table + optional detail panel */}
        <div className="flex-1 flex gap-0 min-h-0 overflow-hidden mx-6 mb-6 rounded-lg border bg-card">
          {/* Table area */}
          <div className={`flex-1 min-w-0 overflow-auto p-3 ${selectedCandidate ? 'max-w-[65%]' : ''}`}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <CandidateTable
                candidates={filteredCandidates}
                selectedCandidateId={selectedCandidate?.id}
                onCandidateClick={(c) => setSelectedCandidate(c)}
                onLinkToProject={(c) => setLinkCandidate(c)}
                groupBy={groupBy}
              />
            )}
          </div>

          {/* Detail sidebar panel */}
          {selectedCandidate && (
            <div className="w-[35%] min-w-[320px] max-w-[420px] shrink-0 overflow-hidden">
              <CandidateDetailPanel
                key={selectedCandidate.id}
                candidate={selectedCandidate}
                onClose={() => setSelectedCandidate(null)}
              />
            </div>
          )}
        </div>
      </div>

      <LinkToProjectDialog
        open={!!linkCandidate}
        onOpenChange={(open) => { if (!open) setLinkCandidate(null); }}
        candidate={linkCandidate}
      />
    </AppLayout>
  );
};

export default Candidates;

function StatChip({ label, value, color, active, onClick }: { label: string; value: number; color?: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
        active ? 'ring-2 ring-primary/40 ' : 'hover:ring-1 hover:ring-primary/30 '
      }${color || 'text-muted-foreground bg-muted/50'}`}
    >
      <span className="font-medium">{value}</span>
      <span className="opacity-70">{label}</span>
    </button>
  );
}
