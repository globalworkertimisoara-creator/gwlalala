import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CandidateCard } from './CandidateCard';
import { Candidate } from '@/types/database';

interface DraggableCandidateCardProps {
  id: string;
  candidate: Candidate;
  onClick?: () => void;
  compact?: boolean;
}

export function DraggableCandidateCard({ id, candidate, onClick, compact }: DraggableCandidateCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { candidate },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <CandidateCard candidate={candidate} onClick={onClick} compact={compact} />
    </div>
  );
}
