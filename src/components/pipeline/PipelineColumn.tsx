import { Candidate, RecruitmentStage, getStageLabel } from '@/types/database';
import { CandidateCard } from './CandidateCard';
import { cn } from '@/lib/utils';

interface PipelineColumnProps {
  stage: RecruitmentStage;
  candidates: Candidate[];
  onCandidateClick?: (candidate: Candidate) => void;
  compact?: boolean;
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

// Short labels for compact view
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

export function PipelineColumn({ stage, candidates, onCandidateClick, compact = false }: PipelineColumnProps) {
  const stageCandidates = candidates.filter((c) => c.current_stage === stage);
  const label = compact 
    ? compactStageLabels[stage] 
    : getStageLabel(stage).split(' / ')[0];

  return (
    <div className={cn(
      "flex-shrink-0",
      compact 
        ? "pipeline-column-compact min-w-[160px] max-w-[200px]" 
        : "pipeline-column min-w-[280px] max-w-[320px]"
    )}>
      <div className={cn(
        "flex items-center gap-2 mb-3 pl-2 border-l-4",
        stageHeaderColors[stage]
      )}>
        <h3 className={cn(
          "font-semibold text-foreground truncate",
          compact ? "text-xs" : "text-sm"
        )}>
          {label}
        </h3>
        <span className={cn(
          "flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground",
          compact ? "h-5 w-5 text-[10px]" : "h-6 w-6 text-xs"
        )}>
          {stageCandidates.length}
        </span>
      </div>
      <div className={compact ? "space-y-1.5" : "space-y-3"}>
        {stageCandidates.map((candidate) => (
          <CandidateCard 
            key={candidate.id} 
            candidate={candidate} 
            onClick={() => onCandidateClick?.(candidate)}
            compact={compact}
          />
        ))}
        {stageCandidates.length === 0 && (
          <div className={cn(
            "rounded-lg border-2 border-dashed border-border/60 text-center",
            compact ? "p-3" : "p-6"
          )}>
            <p className={cn(
              "text-muted-foreground",
              compact ? "text-[10px]" : "text-sm"
            )}>
              No candidates
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
