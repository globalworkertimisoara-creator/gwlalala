import { Candidate } from '@/types/database';
import { WorkflowType, WORKFLOW_TYPE_CONFIG } from '@/types/project';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Plane, UserCheck } from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CandidateCardProps {
  candidate: Candidate;
  onClick?: () => void;
  compact?: boolean;
  workflowType?: WorkflowType;
}

// Simple flag emoji mapping for common nationalities
const nationalityFlags: Record<string, string> = {
  'Romanian': '🇷🇴', 'Romania': '🇷🇴',
  'Polish': '🇵🇱', 'Poland': '🇵🇱',
  'German': '🇩🇪', 'Germany': '🇩🇪',
  'British': '🇬🇧', 'UK': '🇬🇧',
  'American': '🇺🇸', 'USA': '🇺🇸',
  'French': '🇫🇷', 'France': '🇫🇷',
  'Italian': '🇮🇹', 'Italy': '🇮🇹',
  'Spanish': '🇪🇸', 'Spain': '🇪🇸',
  'Indian': '🇮🇳', 'India': '🇮🇳',
  'Chinese': '🇨🇳', 'China': '🇨🇳',
  'Filipino': '🇵🇭', 'Philippines': '🇵🇭',
  'Ukrainian': '🇺🇦', 'Ukraine': '🇺🇦',
  'Bulgarian': '🇧🇬', 'Bulgaria': '🇧🇬',
  'Hungarian': '🇭🇺', 'Hungary': '🇭🇺',
  'Czech': '🇨🇿', 'Czechia': '🇨🇿',
  'Slovak': '🇸🇰', 'Slovakia': '🇸🇰',
  'Greek': '🇬🇷', 'Greece': '🇬🇷',
  'Turkish': '🇹🇷', 'Turkey': '🇹🇷',
  'Dutch': '🇳🇱', 'Netherlands': '🇳🇱',
  'Belgian': '🇧🇪', 'Belgium': '🇧🇪',
  'Portuguese': '🇵🇹', 'Portugal': '🇵🇹',
  'Brazilian': '🇧🇷', 'Brazil': '🇧🇷',
  'Mexican': '🇲🇽', 'Mexico': '🇲🇽',
  'Canadian': '🇨🇦', 'Canada': '🇨🇦',
  'Australian': '🇦🇺', 'Australia': '🇦🇺',
  'Japanese': '🇯🇵', 'Japan': '🇯🇵',
  'Korean': '🇰🇷', 'South Korea': '🇰🇷',
  'Vietnamese': '🇻🇳', 'Vietnam': '🇻🇳',
  'Indonesian': '🇮🇩', 'Indonesia': '🇮🇩',
  'Pakistani': '🇵🇰', 'Pakistan': '🇵🇰',
  'Bangladeshi': '🇧🇩', 'Bangladesh': '🇧🇩',
  'Egyptian': '🇪🇬', 'Egypt': '🇪🇬',
  'Moroccan': '🇲🇦', 'Morocco': '🇲🇦',
  'Nigerian': '🇳🇬', 'Nigeria': '🇳🇬',
  'South African': '🇿🇦', 'South Africa': '🇿🇦',
  'Moldovan': '🇲🇩', 'Moldova': '🇲🇩',
  'Serbian': '🇷🇸', 'Serbia': '🇷🇸',
  'Croatian': '🇭🇷', 'Croatia': '🇭🇷',
  'Slovenian': '🇸🇮', 'Slovenia': '🇸🇮',
  'Austrian': '🇦🇹', 'Austria': '🇦🇹',
  'Swiss': '🇨🇭', 'Switzerland': '🇨🇭',
  'Irish': '🇮🇪', 'Ireland': '🇮🇪',
  'Swedish': '🇸🇪', 'Sweden': '🇸🇪',
  'Norwegian': '🇳🇴', 'Norway': '🇳🇴',
  'Danish': '🇩🇰', 'Denmark': '🇩🇰',
  'Finnish': '🇫🇮', 'Finland': '🇫🇮',
};

function getFlag(nationality: string | null): string {
  if (!nationality) return '🌍';
  return nationalityFlags[nationality] || '🌍';
}

function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function CandidateCard({ candidate, onClick, compact = false, workflowType }: CandidateCardProps) {
  const daysInStage = differenceInDays(new Date(), new Date(candidate.updated_at));
  const isLongWait = daysInStage > 14;

  const workflowBadge = workflowType ? (
    <Badge
      variant="outline"
      className={cn(
        'text-[9px] px-1 py-0 font-normal',
        workflowType === 'full_immigration'
          ? 'border-orange-300 text-orange-600 bg-orange-50'
          : 'border-green-300 text-green-600 bg-green-50'
      )}
    >
      {workflowType === 'full_immigration' ? (
        <><Plane className="h-2.5 w-2.5 mr-0.5" />Visa</>
      ) : (
        <><UserCheck className="h-2.5 w-2.5 mr-0.5" />No Visa</>
      )}
    </Badge>
  ) : null;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="candidate-card-compact"
              onClick={onClick}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm flex-shrink-0">{getFlag(candidate.nationality)}</span>
                  <span className="font-medium text-foreground text-sm truncate">
                    {candidate.full_name}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {workflowBadge}
                  <span className={cn(
                    "text-xs",
                    isLongWait ? "text-warning font-medium" : "text-muted-foreground"
                  )}>
                    {daysInStage}d
                  </span>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-1.5">
              <p className="font-medium">{candidate.full_name}</p>
              <p className="text-xs text-muted-foreground">{candidate.email}</p>
              {workflowType && (
                <p className="text-xs">
                  Workflow: {WORKFLOW_TYPE_CONFIG[workflowType].label}
                </p>
              )}
              {candidate.current_country && (
                <div className="flex items-center gap-1 text-xs">
                  <MapPin className="h-3 w-3" />
                  <span>{candidate.current_country}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                <span>{daysInStage} days in stage</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Updated {formatDistanceToNow(new Date(candidate.updated_at), { addSuffix: true })}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div
      className="candidate-card"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
            {getInitials(candidate.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground truncate">
              {candidate.full_name}
            </p>
            <span className="text-lg" title={candidate.nationality || undefined}>
              {getFlag(candidate.nationality)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {candidate.email}
          </p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {workflowBadge}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {candidate.current_country && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span>{candidate.current_country}</span>
          </div>
        )}
        <div className={cn(
          "flex items-center gap-1",
          isLongWait && "text-warning font-medium"
        )}>
          <Calendar className="h-3.5 w-3.5" />
          <span>{daysInStage}d in stage</span>
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Updated {formatDistanceToNow(new Date(candidate.updated_at), { addSuffix: true })}
      </div>
    </div>
  );
}
