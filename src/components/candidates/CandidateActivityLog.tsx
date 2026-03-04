import { CandidateActivityEntry } from '@/hooks/useCandidateActivityLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const EVENT_CONFIG: Record<string, { label: string; color: string }> = {
  status_change: { label: 'Status Change', color: 'bg-blue-100 text-blue-800' },
  note_added: { label: 'Note Added', color: 'bg-green-100 text-green-800' },
  note_deleted: { label: 'Note Deleted', color: 'bg-red-100 text-red-800' },
  document_upload: { label: 'Document Upload', color: 'bg-purple-100 text-purple-800' },
  document_download: { label: 'Document Download', color: 'bg-amber-100 text-amber-800' },
  profile_update: { label: 'Profile Update', color: 'bg-teal-100 text-teal-800' },
  profile_view: { label: 'Profile View', color: 'bg-gray-100 text-gray-800' },
  interview_scheduled: { label: 'Interview Scheduled', color: 'bg-indigo-100 text-indigo-800' },
  interview_updated: { label: 'Interview Updated', color: 'bg-indigo-100 text-indigo-800' },
  offer_created: { label: 'Offer Created', color: 'bg-emerald-100 text-emerald-800' },
  offer_updated: { label: 'Offer Updated', color: 'bg-emerald-100 text-emerald-800' },
  workflow_update: { label: 'Workflow Update', color: 'bg-cyan-100 text-cyan-800' },
  review: { label: 'Review', color: 'bg-orange-100 text-orange-800' },
};

const ACTOR_LABELS: Record<string, string> = {
  staff: 'GlobalWorker',
  agency: 'Agency',
  employer: 'Employer',
};

interface CandidateActivityLogProps {
  entries: CandidateActivityEntry[];
  isLoading: boolean;
  showActorType?: boolean; // staff view shows actor type
  title?: string;
}

export function CandidateActivityLog({
  entries,
  isLoading,
  showActorType = false,
  title = 'Activity Log',
}: CandidateActivityLogProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {title}
          {entries.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">({entries.length})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-6">
            <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="relative space-y-0">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
            {entries.map((entry) => {
              const config = EVENT_CONFIG[entry.event_type] || {
                label: entry.event_type,
                color: 'bg-gray-100 text-gray-800',
              };
              return (
                <div key={entry.id} className="relative flex gap-3 py-2.5">
                  <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', config.color)}>
                        {config.label}
                      </Badge>
                      {showActorType && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {ACTOR_LABELS[entry.actor_type] || entry.actor_type}
                        </Badge>
                      )}
                      {entry.actor_name && (
                        <span className="text-[11px] font-medium text-foreground">
                          {entry.actor_name}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground ml-auto whitespace-nowrap">
                        {format(new Date(entry.created_at), 'MMM d, yyyy · HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-0.5">{entry.summary}</p>
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {entry.details.file_name && <span>File: {entry.details.file_name}</span>}
                        {entry.details.from_stage && entry.details.to_stage && (
                          <span>{entry.details.from_stage} → {entry.details.to_stage}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
