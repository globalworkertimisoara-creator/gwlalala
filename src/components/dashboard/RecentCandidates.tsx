import { Candidate, getStageLabel, getStageColor } from '@/types/database';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface RecentCandidatesProps {
  candidates: Candidate[];
  onCandidateClick?: (candidate: Candidate) => void;
}

export function RecentCandidates({ candidates, onCandidateClick }: RecentCandidatesProps) {
  const recentCandidates = [...candidates]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (recentCandidates.length === 0) {
    return (
      <div className="stat-card animate-fade-in">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="h-[280px] flex items-center justify-center text-muted-foreground">
          No recent activity
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {recentCandidates.map((candidate) => (
          <div 
            key={candidate.id} 
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => onCandidateClick?.(candidate)}
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(candidate.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {candidate.full_name}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {candidate.nationality && `${candidate.nationality} • `}
                {formatDistanceToNow(new Date(candidate.updated_at), { addSuffix: true })}
              </p>
            </div>
            <Badge 
              variant="secondary" 
              className={cn("shrink-0", getStageColor(candidate.current_stage))}
            >
              {getStageLabel(candidate.current_stage).split(' / ')[0]}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
