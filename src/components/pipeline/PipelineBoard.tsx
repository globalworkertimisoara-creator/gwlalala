import { PipelineCandidate } from '@/hooks/usePipelineCandidates';
import { RecruitmentStage, STAGES, getStageLabel } from '@/types/database';
import { useQueryClient } from '@tanstack/react-query';
import { DraggableCandidateCard } from './DraggableCandidateCard';
import { DroppableStageColumn } from './DroppableStageColumn';
import { cn } from '@/lib/utils';
import { Loader2, Search, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { CandidateCard } from './CandidateCard';
import { useUpdatePipelineStage } from '@/hooks/usePipelineCandidates';

const pipelineStages: RecruitmentStage[] = STAGES
  .filter(s => s.value !== 'closed_not_placed')
  .map(s => s.value);

const stageHeaderColors: Record<RecruitmentStage, string> = {
  sourced: 'border-l-slate-400',
  contacted: 'border-l-blue-400',
  application_received: 'border-l-blue-500',
  screening: 'border-l-cyan-500',
  shortlisted: 'border-l-teal-500',
  submitted_to_client: 'border-l-indigo-500',
  client_feedback: 'border-l-violet-500',
  interview_completed: 'border-l-purple-500',
  offer_extended: 'border-l-amber-500',
  offer_accepted: 'border-l-yellow-500',
  visa_processing: 'border-l-orange-500',
  medical_checks: 'border-l-rose-500',
  onboarding: 'border-l-lime-500',
  placed: 'border-l-green-500',
  closed_not_placed: 'border-l-red-500',
};

const compactStageLabels: Record<RecruitmentStage, string> = {
  sourced: 'Sourced',
  contacted: 'Contacted',
  application_received: 'App Recv',
  screening: 'Screening',
  shortlisted: 'Shortlist',
  submitted_to_client: 'Submitted',
  client_feedback: 'Feedback',
  interview_completed: 'Interview',
  offer_extended: 'Offer Ext',
  offer_accepted: 'Offer Acc',
  visa_processing: 'Visa',
  medical_checks: 'Medical',
  onboarding: 'Onboard',
  placed: 'Placed',
  closed_not_placed: 'Closed',
};

function buildCandidateForCard(pc: PipelineCandidate) {
  return {
    id: pc.candidate_id,
    full_name: pc.full_name,
    email: pc.email,
    phone: pc.phone,
    nationality: pc.nationality,
    current_country: pc.current_country,
    current_stage: pc.pipeline_stage,
    linkedin: null,
    rejection_reason: null,
    expected_start_date: null,
    added_by: null,
    created_at: pc.workflow_updated_at,
    updated_at: pc.workflow_updated_at,
    passport_number: null,
    passport_expiry: null,
    passport_issue_date: null,
    passport_issued_by: null,
    parents_names: null,
  };
}

interface PipelineBoardProps {
  candidates: PipelineCandidate[];
  isLoading: boolean;
  onCandidateClick?: (candidateId: string) => void;
}

export function PipelineBoard({ candidates, isLoading, onCandidateClick }: PipelineBoardProps) {
  const navigate = useNavigate();
  const updateStage = useUpdatePipelineStage();
  const [searchTerm, setSearchTerm] = useState('');
  const [nationalityFilter, setNationalityFilter] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const [activeDragCandidate, setActiveDragCandidate] = useState<PipelineCandidate | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const savedScrollLeft = useRef<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const { nationalities, countries } = useMemo(() => {
    const nats = new Set<string>();
    const ctrs = new Set<string>();
    candidates.forEach(c => {
      if (c.nationality) nats.add(c.nationality);
      if (c.current_country) ctrs.add(c.current_country);
    });
    return { nationalities: Array.from(nats).sort(), countries: Array.from(ctrs).sort() };
  }, [candidates]);

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      if (searchTerm && !c.full_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (nationalityFilter && nationalityFilter !== 'all' && c.nationality !== nationalityFilter) return false;
      if (countryFilter && countryFilter !== 'all' && c.current_country !== countryFilter) return false;
      return true;
    });
  }, [candidates, searchTerm, nationalityFilter, countryFilter]);

  const isCompact = viewMode === 'compact';

  function handleDragStart(event: DragStartEvent) {
    const draggedId = event.active.id as string;
    const found = filtered.find(c => c.workflow_id === draggedId);
    setActiveDragCandidate(found || null);
  }

  const queryClient = useQueryClient();

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) {
      setActiveDragCandidate(null);
      return;
    }

    // Save scroll position before mutation triggers re-render
    if (scrollContainerRef.current) {
      savedScrollLeft.current = scrollContainerRef.current.scrollLeft;
    }

    const workflowId = active.id as string;
    const newStage = over.id as RecruitmentStage;
    const candidate = filtered.find(c => c.workflow_id === workflowId);

    if (candidate && candidate.pipeline_stage !== newStage) {
      // Apply optimistic update SYNCHRONOUSLY before clearing drag overlay
      queryClient.setQueriesData(
        { queryKey: ['pipeline-candidates'] },
        (old: PipelineCandidate[] | undefined) => {
          if (!old) return old;
          return old.map(c =>
            c.workflow_id === workflowId
              ? { ...c, pipeline_stage: newStage, workflow_updated_at: new Date().toISOString() }
              : c
          );
        }
      );

      // Now clear the drag overlay — the card is already in its new column
      setActiveDragCandidate(null);

      updateStage.mutate({
        workflowId,
        candidateId: candidate.candidate_id,
        fromStage: candidate.pipeline_stage,
        stage: newStage,
      });
    } else {
      setActiveDragCandidate(null);
    }
  }

  // Restore scroll position after candidates data changes
  const prevCandidatesRef = useRef(candidates);
  if (prevCandidatesRef.current !== candidates) {
    prevCandidatesRef.current = candidates;
    requestAnimationFrame(() => {
      if (scrollContainerRef.current && savedScrollLeft.current > 0) {
        scrollContainerRef.current.scrollLeft = savedScrollLeft.current;
      }
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{filtered.length} candidates</span>
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

      {/* Pipeline Board with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div ref={scrollContainerRef} className="overflow-x-auto pb-4">
          <div className={isCompact ? "flex gap-2 min-w-max" : "flex gap-4 min-w-max"}>
            {pipelineStages.map((stage) => {
              const stageCandidates = filtered.filter(c => c.pipeline_stage === stage);
              const label = isCompact ? compactStageLabels[stage] : getStageLabel(stage).split(' / ')[0];

              return (
                <div
                  key={stage}
                  className={cn(
                    "flex-shrink-0",
                    isCompact
                      ? "pipeline-column-compact min-w-[160px] max-w-[200px]"
                      : "pipeline-column min-w-[280px] max-w-[320px]"
                  )}
                >
                  <div className={cn(
                    "flex items-center gap-2 mb-3 pl-2 border-l-4",
                    stageHeaderColors[stage]
                  )}>
                    <h3 className={cn(
                      "font-semibold text-foreground truncate",
                      isCompact ? "text-xs" : "text-sm"
                    )}>
                      {label}
                    </h3>
                    <span className={cn(
                      "flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground",
                      isCompact ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-xs"
                    )}>
                      {stageCandidates.length}
                    </span>
                  </div>
                  <DroppableStageColumn stage={stage}>
                    <div className={isCompact ? "space-y-1.5" : "space-y-3"}>
                      {stageCandidates.map((pc) => (
                        <DraggableCandidateCard
                          key={pc.workflow_id}
                          id={pc.workflow_id}
                          candidate={buildCandidateForCard(pc)}
                          onClick={() => onCandidateClick ? onCandidateClick(pc.candidate_id) : navigate(`/candidates/${pc.candidate_id}`)}
                          compact={isCompact}
                        />
                      ))}
                      {stageCandidates.length === 0 && (
                        <div className={cn(
                          "rounded-lg border-2 border-dashed border-border/60 text-center",
                          isCompact ? "p-3" : "p-6"
                        )}>
                          <p className={cn(
                            "text-muted-foreground",
                            isCompact ? "text-[10px]" : "text-sm"
                          )}>
                            No candidates
                          </p>
                        </div>
                      )}
                    </div>
                  </DroppableStageColumn>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragCandidate ? (
            <div className="opacity-90 shadow-lg rounded-lg">
              <CandidateCard
                candidate={buildCandidateForCard(activeDragCandidate)}
                compact={isCompact}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
