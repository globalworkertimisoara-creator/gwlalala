import { Candidate, RecruitmentStage, getStageLabel } from '@/types/database';
import { CandidateCard } from './CandidateCard';
import { cn } from '@/lib/utils';

interface PipelineColumnProps {
  stage: RecruitmentStage;
  candidates: Candidate[];
  onCandidateClick?: (candidate: Candidate) => void;
}

// Color mapping for stage headers
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

export function PipelineColumn({ stage, candidates, onCandidateClick }: PipelineColumnProps) {
  const stageCandidates = candidates.filter((c) => c.current_stage === stage);
  const shortLabel = getStageLabel(stage).split(' / ')[0];

  return (
    <div className="pipeline-column min-w-[280px] max-w-[320px] flex-shrink-0">
      <div className={cn(
        "flex items-center gap-3 mb-4 pl-3 border-l-4",
        stageHeaderColors[stage]
      )}>
        <h3 className="font-semibold text-foreground text-sm">{shortLabel}</h3>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {stageCandidates.length}
        </span>
      </div>
      <div className="space-y-3">
        {stageCandidates.map((candidate) => (
          <CandidateCard 
            key={candidate.id} 
            candidate={candidate} 
            onClick={() => onCandidateClick?.(candidate)}
          />
        ))}
        {stageCandidates.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-border/60 p-6 text-center">
            <p className="text-sm text-muted-foreground">No candidates</p>
          </div>
        )}
      </div>
    </div>
  );
}
