/**
 * src/components/workflow/WorkflowTimeline.tsx
 *
 * Visual timeline showing candidate's progress through workflow phases.
 * Displays: Recruitment → Documentation → Visa → Arrival → Residence Permit
 */

import React from 'react';
import { CheckCircle, Circle, Clock, FileText, Plane, Home, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

type WorkflowPhase = 
  | 'recruitment' 
  | 'documentation' 
  | 'visa' 
  | 'arrival' 
  | 'residence_permit';

type WorkflowType = 'full_immigration' | 'no_visa';

interface WorkflowTimelineProps {
  currentPhase: WorkflowPhase;
  workflowType: WorkflowType;
  completedPhases: {
    recruitment?: string; // ISO date
    documentation?: string;
    visa?: string;
    arrival?: string;
    residence_permit?: string;
  };
  /** Show phase names below icons */
  showLabels?: boolean;
  /** Compact mode (smaller icons, less spacing) */
  compact?: boolean;
}

interface Phase {
  id: WorkflowPhase;
  label: string;
  icon: React.ElementType;
}

const ALL_PHASES: Phase[] = [
  { id: 'recruitment', label: 'Recruitment', icon: FileText },
  { id: 'documentation', label: 'Documentation', icon: FileText },
  { id: 'visa', label: 'Visa', icon: Award },
  { id: 'arrival', label: 'Arrival', icon: Plane },
  { id: 'residence_permit', label: 'Residence Permit', icon: Home },
];

export default function WorkflowTimeline({
  currentPhase,
  workflowType,
  completedPhases,
  showLabels = true,
  compact = false,
}: WorkflowTimelineProps) {
  // Filter phases based on workflow type
  const phases = workflowType === 'no_visa' 
    ? ALL_PHASES.filter(p => p.id !== 'visa')
    : ALL_PHASES;

  const currentIndex = phases.findIndex(p => p.id === currentPhase);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {phases.map((phase, index) => {
          const isCompleted = !!completedPhases[phase.id];
          const isCurrent = phase.id === currentPhase;
          const isPast = index < currentIndex;
          const isFuture = index > currentIndex;
          
          const Icon = phase.icon;
          
          return (
            <React.Fragment key={phase.id}>
              {/* Phase step */}
              <div className="flex flex-col items-center">
                {/* Icon */}
                <div
                  className={cn(
                    'rounded-full flex items-center justify-center transition-all',
                    compact ? 'h-10 w-10' : 'h-12 w-12',
                    isCompleted && 'bg-green-100 text-green-700',
                    isCurrent && !isCompleted && 'bg-blue-100 text-blue-700 ring-4 ring-blue-50',
                    (isPast && !isCompleted) && 'bg-gray-100 text-gray-400',
                    isFuture && 'bg-gray-50 text-gray-300'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
                  ) : isCurrent ? (
                    <Clock className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
                  ) : (
                    <Icon className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
                  )}
                </div>

                {/* Label */}
                {showLabels && (
                  <div className="mt-2 text-center">
                    <p
                      className={cn(
                        'text-xs font-medium',
                        compact && 'text-xs',
                        !compact && 'text-sm',
                        isCompleted && 'text-green-700',
                        isCurrent && 'text-blue-700 font-semibold',
                        (isPast && !isCompleted) && 'text-gray-400',
                        isFuture && 'text-gray-400'
                      )}
                    >
                      {phase.label}
                    </p>
                    {isCompleted && completedPhases[phase.id] && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(completedPhases[phase.id]!).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Connector line */}
              {index < phases.length - 1 && (
                <div className="flex-1 mx-2">
                  <div
                    className={cn(
                      'h-1 rounded-full transition-all',
                      compact ? 'h-0.5' : 'h-1',
                      isCompleted && 'bg-green-300',
                      !isCompleted && index < currentIndex && 'bg-blue-300',
                      !isCompleted && index >= currentIndex && 'bg-gray-200'
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Workflow type badge */}
      <div className="mt-4 flex justify-center">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
            workflowType === 'full_immigration'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          )}
        >
          {workflowType === 'full_immigration' ? 'Full Immigration Process' : 'No Visa Required'}
        </span>
      </div>
    </div>
  );
}
