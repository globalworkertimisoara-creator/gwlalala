import { Candidate, getStageLabel, getStageColor } from '@/types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Users, FolderSymlink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CandidateTableProps {
  candidates: Candidate[];
  onCandidateClick?: (candidate: Candidate) => void;
  onLinkToProject?: (candidate: Candidate) => void;
}

function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function CandidateTable({ candidates, onCandidateClick, onLinkToProject }: CandidateTableProps) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground">No candidates found</p>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[280px]">Candidate</TableHead>
            <TableHead>Nationality</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Days in Stage</TableHead>
            <TableHead>Added</TableHead>
            {onLinkToProject && <TableHead className="w-[60px]"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => {
            const daysInStage = differenceInDays(new Date(), new Date(candidate.updated_at));
            const isLongWait = daysInStage > 14;

            return (
              <TableRow 
                key={candidate.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => onCandidateClick?.(candidate)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                        {getInitials(candidate.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">
                        {candidate.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {candidate.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {candidate.nationality || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {candidate.current_country || '-'}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={cn(getStageColor(candidate.current_stage))}
                  >
                    {getStageLabel(candidate.current_stage).split(' / ')[0]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={cn(
                    "font-medium",
                    isLongWait && "text-warning"
                  )}>
                    {daysInStage}d
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(candidate.created_at), 'MMM d, yyyy')}
                </TableCell>
                {onLinkToProject && (
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onLinkToProject(candidate);
                          }}
                        >
                          <FolderSymlink className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Link to Project</TooltipContent>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
