import { Candidate } from '@/types/candidate';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface CandidateCardProps {
  candidate: Candidate;
  onClick?: () => void;
}

export function CandidateCard({ candidate, onClick }: CandidateCardProps) {
  return (
    <div 
      className="candidate-card"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
            {candidate.firstName[0]}{candidate.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">
            {candidate.firstName} {candidate.lastName}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {candidate.position}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Building2 className="h-3.5 w-3.5" />
          <span>{candidate.department}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>{format(new Date(candidate.appliedDate), 'MMM d')}</span>
        </div>
      </div>
      {candidate.source && (
        <div className="mt-2">
          <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
            {candidate.source}
          </span>
        </div>
      )}
    </div>
  );
}
