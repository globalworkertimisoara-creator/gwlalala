import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OverviewCards from '@/components/analytics/OverviewCards';
import PipelineAnalytics from '@/components/analytics/PipelineAnalytics';
import ProjectAnalytics from '@/components/analytics/ProjectAnalytics';
import JobAnalytics from '@/components/analytics/JobAnalytics';
import AgencyAnalytics from '@/components/analytics/AgencyAnalytics';
import { BarChart3, GitBranch, FolderKanban, Briefcase, Building2, Handshake } from 'lucide-react';
import ClientAnalytics from '@/components/analytics/ClientAnalytics';

export type AnalyticsDetailItem = {
  type: 'project' | 'candidate' | 'job' | 'agency' | 'conversion' | 'workflow' | 'phase' | 'client';
  id?: string;
  data?: any;
  title: string;
  backLabel?: string;
};

const Analytics = () => {
  const navigate = useNavigate();
  const [detailItem, setDetailItem] = useState<AnalyticsDetailItem | null>(null);
  const [activeTab, setActiveTab] = useState('pipeline');

  const openDetail = (item: AnalyticsDetailItem) => setDetailItem(item);
  const closeDetail = () => setDetailItem(null);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b bg-background flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h1 className="text-xl lg:text-2xl font-bold text-foreground">Analytics</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Comprehensive statistics across your recruitment pipeline
              </p>
            </div>
          </div>
          <OverviewCards />
        </div>

        {/* Tabs + Content with Detail Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className={`flex-1 overflow-y-auto transition-all duration-300 ${detailItem ? 'max-w-[65%]' : ''}`}>
            <div className="p-6">
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); closeDetail(); }} className="space-y-6">
                <TabsList>
                  <TabsTrigger value="pipeline" className="gap-1.5 text-sm">
                    <GitBranch className="h-3.5 w-3.5" /> Pipeline
                  </TabsTrigger>
                  <TabsTrigger value="projects" className="gap-1.5 text-sm">
                    <FolderKanban className="h-3.5 w-3.5" /> Projects
                  </TabsTrigger>
                  <TabsTrigger value="jobs" className="gap-1.5 text-sm">
                    <Briefcase className="h-3.5 w-3.5" /> Jobs
                  </TabsTrigger>
                  <TabsTrigger value="agencies" className="gap-1.5 text-sm">
                    <Building2 className="h-3.5 w-3.5" /> Agencies
                  </TabsTrigger>
                  <TabsTrigger value="clients" className="gap-1.5 text-sm">
                    <Handshake className="h-3.5 w-3.5" /> Clients
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pipeline">
                  <PipelineAnalytics onOpenDetail={openDetail} />
                </TabsContent>

                <TabsContent value="projects">
                  <ProjectAnalytics onOpenDetail={openDetail} />
                </TabsContent>

                <TabsContent value="jobs">
                  <JobAnalytics onOpenDetail={openDetail} />
                </TabsContent>

                <TabsContent value="agencies">
                  <AgencyAnalytics onOpenDetail={openDetail} />
                </TabsContent>

                <TabsContent value="clients">
                  <ClientAnalytics onOpenDetail={openDetail} />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Slide-in Detail Panel */}
          {detailItem && (
            <div className="w-[35%] border-l bg-background overflow-y-auto flex-shrink-0 animate-in slide-in-from-right duration-200">
              <div className="p-5 border-b sticky top-0 bg-background z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{detailItem.backLabel || 'Detail'}</p>
                    <h3 className="text-sm font-semibold">{detailItem.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {detailItem.type === 'project' && detailItem.id && (
                      <button
                        className="text-xs text-primary hover:underline"
                        onClick={() => navigate(`/projects/${detailItem.id}?from=analytics`)}
                      >
                        Go to Project
                      </button>
                    )}
                    {detailItem.type === 'job' && detailItem.id && (
                      <button
                        className="text-xs text-primary hover:underline"
                        onClick={() => navigate(`/jobs/${detailItem.id}?from=analytics`)}
                      >
                        Go to Job
                      </button>
                    )}
                    {detailItem.type === 'candidate' && detailItem.id && (
                      <button
                        className="text-xs text-primary hover:underline"
                        onClick={() => navigate(`/candidates/${detailItem.id}?from=analytics`)}
                      >
                        Go to Candidate
                      </button>
                    )}
                    {detailItem.type === 'client' && detailItem.id && (
                      <button
                        className="text-xs text-primary hover:underline"
                        onClick={() => navigate(`/clients/${detailItem.id}?from=analytics`)}
                      >
                        Go to Client
                      </button>
                    )}
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={closeDetail}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Render detail content based on type */}
                {detailItem.type === 'project' && detailItem.data && (
                  <div className="space-y-3">
                    {detailItem.data.employer_name && (
                      <p className="text-sm text-muted-foreground">{detailItem.data.employer_name}</p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xl font-bold">{detailItem.data.total_candidates}</p>
                        <p className="text-xs text-muted-foreground">Total Candidates</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xl font-bold">{detailItem.data.completed_candidates}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xl font-bold">{detailItem.data.fill_percentage?.toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">Completion</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xl font-bold">{detailItem.data.agencies_involved}</p>
                        <p className="text-xs text-muted-foreground">Agencies</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-xs text-muted-foreground">Country</span>
                      <span className="text-sm font-medium">{detailItem.data.country}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <span className="text-sm font-medium capitalize">{detailItem.data.status}</span>
                    </div>
                    {detailItem.data.avg_days_to_completion && (
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-xs text-muted-foreground">Avg Days to Complete</span>
                        <span className="text-sm font-medium">{detailItem.data.avg_days_to_completion}d</span>
                      </div>
                    )}
                  </div>
                )}

                {detailItem.type === 'job' && detailItem.data && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-xs text-muted-foreground">Client</span>
                      <span className="text-sm font-medium">{detailItem.data.client_company}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-xs text-muted-foreground">Country</span>
                      <span className="text-sm font-medium">{detailItem.data.country}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xl font-bold">{detailItem.data.total_applications}</p>
                        <p className="text-xs text-muted-foreground">Applications</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xl font-bold capitalize">{detailItem.data.status}</p>
                        <p className="text-xs text-muted-foreground">Status</p>
                      </div>
                    </div>
                  </div>
                )}

                {detailItem.type === 'agency' && detailItem.data && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xl font-bold">{detailItem.data.total_candidates_submitted}</p>
                        <p className="text-xs text-muted-foreground">Submitted</p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
                        <p className="text-xl font-bold text-green-700">{detailItem.data.successful_placements}</p>
                        <p className="text-xs text-muted-foreground">Placed</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xl font-bold">{detailItem.data.success_rate?.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Success Rate</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xl font-bold">{detailItem.data.avg_days_to_placement || '-'}</p>
                        <p className="text-xs text-muted-foreground">Avg Days</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-xs text-muted-foreground">Projects</span>
                      <span className="text-sm font-medium">{detailItem.data.projects_involved}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-xs text-muted-foreground">Country</span>
                      <span className="text-sm font-medium">{detailItem.data.country}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <span className="text-sm font-medium capitalize">{detailItem.data.agency_status}</span>
                    </div>
                  </div>
                )}

                {detailItem.type === 'phase' && detailItem.data && (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">{detailItem.data.candidates?.length || 0} candidates in this phase</p>
                    {detailItem.data.candidates?.map((c: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => {
                          const cand = c.candidates || c;
                          if (cand.candidate_id || c.candidate_id) {
                            navigate(`/candidates/${cand.candidate_id || c.candidate_id}?from=analytics`);
                          }
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium">{(c.candidates as any)?.full_name || c.full_name}</p>
                          <p className="text-xs text-muted-foreground">{(c.candidates as any)?.email || c.email}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted capitalize">
                          {((c.candidates as any)?.current_stage || c.current_stage || '').replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                    {(!detailItem.data.candidates || detailItem.data.candidates.length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">No candidates found</p>
                    )}
                  </div>
                )}

                {detailItem.type === 'conversion' && detailItem.data && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xl font-bold">{detailItem.data.from_count}</p>
                        <p className="text-xs text-muted-foreground">In {detailItem.data.from_phase}</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xl font-bold">{detailItem.data.to_count}</p>
                        <p className="text-xs text-muted-foreground">To {detailItem.data.to_phase}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">{detailItem.data.conversion_rate}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Conversion Rate</p>
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${detailItem.data.conversion_rate >= 70 ? 'bg-green-500' : detailItem.data.conversion_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${detailItem.data.conversion_rate || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {detailItem.type === 'workflow' && detailItem.data && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {detailItem.data.workflow_type === 'full_immigration' ? 'Full Immigration Process' : 'No Visa Required'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xl font-bold">{detailItem.data.total_workflows}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xl font-bold">{detailItem.data.completed_count}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xl font-bold">{detailItem.data.avg_completion_days || '-'}</p>
                        <p className="text-xs text-muted-foreground">Avg Days</p>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg text-center">
                        <p className="text-xl font-bold text-destructive">{detailItem.data.stalled_count || 0}</p>
                        <p className="text-xs text-muted-foreground">Stalled</p>
                      </div>
                    </div>
                  </div>
                )}

                {detailItem.type === 'client' && detailItem.data && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xl font-bold">€{(detailItem.data.total_invoiced || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xl font-bold text-destructive">€{(detailItem.data.outstanding_amount || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Outstanding</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-xs text-muted-foreground">Type</span>
                      <span className="text-sm font-medium capitalize">{detailItem.data.client_type}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-xs text-muted-foreground">Status</span>
                      <span className="text-sm font-medium capitalize">{detailItem.data.status}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Analytics;