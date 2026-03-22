import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users } from 'lucide-react';
import { Candidate, getStageLabel, getStageColor } from '@/types/database';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface RecentCandidatesProps {
  candidates: Candidate[];
  onCandidateClick?: (candidate: Candidate) => void;
}

export function RecentCandidates({ candidates, onCandidateClick }: RecentCandidatesProps) {
  const recentCandidates = [...candidates]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 8);

  const getInitials = (fullName: string) =>
    fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-primary" />
          Recent Candidates
          <Badge variant="secondary" className="text-[10px] ml-auto">{recentCandidates.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {recentCandidates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[280px]">
            <div className="space-y-1">
              {recentCandidates.map(candidate => (
                <div
                  key={candidate.id}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onCandidateClick?.(candidate)}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                      {getInitials(candidate.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{candidate.full_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {candidate.nationality && `${candidate.nationality} · `}
                      {formatDistanceToNow(new Date(candidate.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn('shrink-0 text-[10px]', getStageColor(candidate.current_stage))}
                  >
                    {getStageLabel(candidate.current_stage).split(' / ')[0]}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}