import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CandidateCard } from './CandidateCard';
import { Candidate } from '@/types/database';
import { WorkflowType } from '@/types/project';

interface DraggableCandidateCardProps {
  id: string;
  candidate: Candidate;
  onClick?: () => void;
  compact?: boolean;
  workflowType?: WorkflowType;
}

export function DraggableCandidateCard({ id, candidate, onClick, compact, workflowType }: DraggableCandidateCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { candidate, workflowType },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <CandidateCard candidate={candidate} onClick={onClick} compact={compact} workflowType={workflowType} />
    </div>
  );
}
