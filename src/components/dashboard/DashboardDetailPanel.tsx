import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type DashboardDetailItem = {
  type: 'candidate' | 'project' | 'job' | 'contract' | 'worker' | 'list';
  id?: string;
  title: string;
  subtitle?: string;
  data?: any;
  backLabel?: string;
  route?: string;
  listItems?: Array<{
    id?: string;
    title: string;
    subtitle?: string;
    badge?: string;
    badgeColor?: string;
    route?: string;
  }>;
};

interface DashboardDetailPanelProps {
  item: DashboardDetailItem | null;
  onClose: () => void;
}

export function DashboardDetailPanel({ item, onClose }: DashboardDetailPanelProps) {
  const navigate = useNavigate();

  if (!item) return null;

  const goTo = (route: string) => {
    navigate(route);
  };

  return (
    <div className="h-full flex flex-col border-l bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="min-w-0 flex-1">
          {item.backLabel && (
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{item.backLabel}</p>
          )}
          <h3 className="text-sm font-semibold truncate">{item.title}</h3>
          {item.subtitle && <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Candidate detail */}
          {item.type === 'candidate' && item.data && (
            <>
              <div className="space-y-3">
                <DetailRow label="Name" value={item.data.full_name} />
                <DetailRow label="Email" value={item.data.email} />
                <DetailRow label="Nationality" value={item.data.nationality} />
                <DetailRow label="Country" value={item.data.current_country} />
                <DetailRow label="Stage" value={item.data.current_stage?.replace(/_/g, ' ')} />
                {item.data.phone && <DetailRow label="Phone" value={item.data.phone} />}
              </div>
              <Button
                className="w-full gap-1.5 mt-4"
                size="sm"
                onClick={() => goTo(item.route || `/candidates/${item.id}`)}
              >
                Go to Candidate <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          {/* Project detail */}
          {item.type === 'project' && item.data && (
            <>
              <div className="space-y-3">
                <DetailRow label="Name" value={item.data.name} />
                <DetailRow label="Status" value={item.data.status} badge />
                <DetailRow label="Location" value={item.data.location} />
                {item.data.country && <DetailRow label="Country" value={item.data.country} />}
                {item.data.total_candidates != null && (
                  <DetailRow label="Candidates" value={`${item.data.completed_candidates || 0} / ${item.data.total_candidates}`} />
                )}
                {item.data.fill_percentage != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Completion</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${Math.min(item.data.fill_percentage, 100)}%` }} />
                      </div>
                      <span className="text-xs font-semibold">{item.data.fill_percentage?.toFixed(0)}%</span>
                    </div>
                  </div>
                )}
              </div>
              <Button
                className="w-full gap-1.5 mt-4"
                size="sm"
                onClick={() => goTo(item.route || `/projects/${item.id}`)}
              >
                Go to Project <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          {/* Job detail */}
          {item.type === 'job' && item.data && (
            <>
              <div className="space-y-3">
                <DetailRow label="Title" value={item.data.title} />
                <DetailRow label="Client" value={item.data.client_company} />
                <DetailRow label="Country" value={item.data.country} />
                <DetailRow label="Status" value={item.data.status} badge />
                {item.data.salary_range && <DetailRow label="Salary" value={item.data.salary_range} />}
                {item.data.positions_available && <DetailRow label="Positions" value={item.data.positions_available} />}
              </div>
              {item.id && (
                <Button
                  className="w-full gap-1.5 mt-4"
                  size="sm"
                  onClick={() => goTo(item.route || `/jobs/${item.id}`)}
                >
                  Go to Job <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}

          {/* Contract detail */}
          {item.type === 'contract' && item.data && (
            <>
              <div className="space-y-3">
                <DetailRow label="Title" value={item.data.title} />
                <DetailRow label="Status" value={item.data.status} badge />
                <DetailRow label="Type" value={item.data.contract_type?.replace(/_/g, ' ')} />
                {item.data.total_value && <DetailRow label="Value" value={`€${item.data.total_value.toLocaleString()}`} />}
              </div>
              <Button
                className="w-full gap-1.5 mt-4"
                size="sm"
                onClick={() => goTo(item.route || `/contracts?highlight=${item.id}`)}
              >
                Go to Contract <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          {/* Worker detail */}
          {item.type === 'worker' && item.data && (
            <>
              <div className="space-y-3">
                <DetailRow label="Name" value={item.data.full_name} />
                <DetailRow label="Email" value={item.data.email} />
                <DetailRow label="Nationality" value={item.data.nationality} />
                <DetailRow label="Stage" value={item.data.current_stage?.replace(/_/g, ' ')} />
                {item.data.job_title && <DetailRow label="Job" value={item.data.job_title} />}
                {item.data.job_company && <DetailRow label="Company" value={item.data.job_company} />}
                {item.data.submitted_at && <DetailRow label="Submitted" value={new Date(item.data.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />}
                {item.data.phone && <DetailRow label="Phone" value={item.data.phone} />}
              </div>
              {item.id && (
                <Button
                  className="w-full gap-1.5 mt-4"
                  size="sm"
                  onClick={() => goTo(item.route || `/agency/workers/${item.id}`)}
                >
                  View Worker <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}

          {/* List view */}
          {item.type === 'list' && item.listItems && (
            <div className="space-y-1.5">
              {item.listItems.map((li, i) => (
                <div
                  key={li.id || i}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-lg bg-muted/50',
                    li.route && 'cursor-pointer hover:bg-muted transition-colors'
                  )}
                  onClick={() => li.route && goTo(li.route)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{li.title}</p>
                    {li.subtitle && <p className="text-xs text-muted-foreground truncate">{li.subtitle}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {li.badge && (
                      <Badge className={cn('text-xs', li.badgeColor || 'bg-muted text-muted-foreground')}>
                        {li.badge}
                      </Badge>
                    )}
                    {li.route && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                  </div>
                </div>
              ))}
              {item.listItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No items</p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function DetailRow({ label, value, badge }: { label: string; value: any; badge?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      {badge ? (
        <Badge variant="secondary" className="text-xs capitalize">{String(value)}</Badge>
      ) : (
        <span className="text-sm font-medium text-right max-w-[60%] truncate">{String(value)}</span>
      )}
    </div>
  );
}