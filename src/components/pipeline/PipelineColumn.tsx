import { Candidate, RecruitmentStage, stageLabels } from '@/types/candidate';
import { CandidateCard } from './CandidateCard';
import { cn } from '@/lib/utils';

interface PipelineColumnProps {
  stage: RecruitmentStage;
  candidates: Candidate[];
  onCandidateClick?: (candidate: Candidate) => void;
}

const stageHeaderColors: Record<RecruitmentStage, string> = {
  sourced: 'border-l-stage-sourced-foreground',
  screening: 'border-l-stage-screening-foreground',
  interview: 'border-l-stage-interview-foreground',
  technical: 'border-l-stage-technical-foreground',
  offer: 'border-l-stage-offer-foreground',
  hired: 'border-l-success',
  rejected: 'border-l-destructive',
};

export function PipelineColumn({ stage, candidates, onCandidateClick }: PipelineColumnProps) {
  const stageCandidates = candidates.filter((c) => c.stage === stage);

  return (
    <div className="pipeline-column min-w-[280px] max-w-[320px] flex-shrink-0">
      <div className={cn(
        "flex items-center gap-3 mb-4 pl-3 border-l-4",
        stageHeaderColors[stage]
      )}>
        <h3 className="font-semibold text-foreground">{stageLabels[stage]}</h3>
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
