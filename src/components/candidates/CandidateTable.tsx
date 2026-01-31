import { Candidate, stageLabels } from '@/types/candidate';
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
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CandidateTableProps {
  candidates: Candidate[];
  onCandidateClick?: (candidate: Candidate) => void;
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

export function CandidateTable({ candidates, onCandidateClick }: CandidateTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[280px]">Candidate</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Applied</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow 
              key={candidate.id}
              className="cursor-pointer hover:bg-muted/30"
              onClick={() => onCandidateClick?.(candidate)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                      {candidate.firstName[0]}{candidate.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {candidate.firstName} {candidate.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {candidate.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-medium">{candidate.position}</TableCell>
              <TableCell className="text-muted-foreground">{candidate.department}</TableCell>
              <TableCell>
                <Badge 
                  variant="secondary" 
                  className={cn(stageBadgeStyles[candidate.stage])}
                >
                  {stageLabels[candidate.stage]}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{candidate.source}</TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(candidate.appliedDate), 'MMM d, yyyy')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
