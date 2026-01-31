import { Candidate, stageLabels } from '@/types/candidate';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RecentCandidatesProps {
  candidates: Candidate[];
}

const stageBadgeStyles: Record<string, string> = {
  sourced: 'bg-stage-sourced text-stage-sourced-foreground',
  screening: 'bg-stage-screening text-stage-screening-foreground',
  interview: 'bg-stage-interview text-stage-interview-foreground',
  technical: 'bg-stage-technical text-stage-technical-foreground',
  offer: 'bg-stage-offer text-stage-offer-foreground',
  hired: 'bg-stage-hired text-stage-hired-foreground',
  rejected: 'bg-stage-rejected text-stage-rejected-foreground',
};

export function RecentCandidates({ candidates }: RecentCandidatesProps) {
  const recentCandidates = [...candidates]
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 5);

  return (
    <div className="stat-card animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {recentCandidates.map((candidate) => (
          <div 
            key={candidate.id} 
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
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
            <Badge 
              variant="secondary" 
              className={cn("shrink-0", stageBadgeStyles[candidate.stage])}
            >
              {stageLabels[candidate.stage]}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
