import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { RecruitmentStage } from '@/types/database';

interface DroppableStageColumnProps {
  stage: RecruitmentStage;
  children: ReactNode;
}

export function DroppableStageColumn({ stage, children }: DroppableStageColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: stage,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "transition-colors duration-200 rounded-lg min-h-[100px]",
        isOver && "bg-primary/5 ring-2 ring-primary/20"
      )}
    >
      {children}
    </div>
  );
}
