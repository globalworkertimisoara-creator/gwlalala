import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity, ArrowRight, FileText, Users, Briefcase, CheckCircle,
  Upload, MessageSquare, Calendar, AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const EVENT_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  status_change: { icon: ArrowRight, color: 'text-blue-600', label: 'Stage Change' },
  note_added: { icon: MessageSquare, color: 'text-green-600', label: 'Note Added' },
  document_upload: { icon: Upload, color: 'text-purple-600', label: 'Document Uploaded' },
  interview_scheduled: { icon: Calendar, color: 'text-amber-600', label: 'Interview' },
  offer_created: { icon: FileText, color: 'text-emerald-600', label: 'Offer Created' },
  candidate_created: { icon: Users, color: 'text-blue-600', label: 'Candidate Added' },
  candidate_linked: { icon: Briefcase, color: 'text-indigo-600', label: 'Linked to Job' },
  workflow_update: { icon: Activity, color: 'text-teal-600', label: 'Workflow Update' },
  workflow_warning: { icon: AlertTriangle, color: 'text-amber-600', label: 'Warning' },
  approval_change: { icon: CheckCircle, color: 'text-green-600', label: 'Approval' },
};

function useRecentActivity(limit: number = 20) {
  return useQuery({
    queryKey: ['dashboard-activity-feed', limit],
    queryFn: async () => {
      // Fetch from candidate_activity_log (most common activity source)
      const { data, error } = await supabase
        .from('candidate_activity_log' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as any[];
    },
    refetchInterval: 60000,
  });
}

export function DashboardActivityFeed() {
  const { data: activities = [], isLoading } = useRecentActivity();
  const navigate = useNavigate();

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[320px]">
            <div className="space-y-1">
              {activities.map((activity, i) => {
                const config = EVENT_CONFIG[activity.event_type] || EVENT_CONFIG.workflow_update;
                const Icon = config.icon;
                return (
                  <div
                    key={activity.id || i}
                    className={cn(
                      'flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors',
                      activity.candidate_id && 'cursor-pointer'
                    )}
                    onClick={() => {
                      if (activity.candidate_id) {
                        navigate(`/candidates/${activity.candidate_id}`);
                      }
                    }}
                  >
                    <div className={cn('mt-0.5 shrink-0', config.color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug">
                        <span className="font-medium">{activity.actor_name || 'System'}</span>
                        {' '}
                        <span className="text-muted-foreground">
                          {activity.event_type === 'status_change'
                            ? `moved to ${activity.new_value?.replace(/_/g, ' ') || 'new stage'}`
                            : config.label.toLowerCase()}
                        </span>
                        {activity.candidate_name && (
                          <>
                            {' · '}
                            <span className="font-medium">{activity.candidate_name}</span>
                          </>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}