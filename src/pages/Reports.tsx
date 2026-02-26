import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useReports, type ReportType } from '@/hooks/useReports';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { FileDown, FileText, Users, FolderKanban, Shield, Receipt, Bell, Loader2 } from 'lucide-react';

const REPORT_CARDS: { type: ReportType; title: string; description: string; icon: typeof FileText }[] = [
  { type: 'candidate_pipeline', title: 'Candidate Pipeline', description: 'All candidates with current stage, days in stage, and contact details.', icon: Users },
  { type: 'agency_performance', title: 'Agency Performance', description: 'Submissions, placements, and success rates per agency.', icon: FolderKanban },
  { type: 'project_status', title: 'Project Status', description: 'Fill rates, workflow progress, and timeline adherence.', icon: FileText },
  { type: 'compliance', title: 'Compliance Report', description: 'Document expiry dates, passport status, and compliance alerts.', icon: Shield },
  { type: 'billing_summary', title: 'Billing Summary', description: 'Payments by agency, outstanding amounts, and billing status.', icon: Receipt },
];

const Reports = () => {
  const { generateReport, isGenerating } = useReports();
  const { preferences, upsert, NOTIFICATION_TYPES, isLoading: prefsLoading } = useNotificationPreferences();

  const getPref = (type: string) => preferences.find((p) => p.notification_type === type);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileDown className="h-7 w-7 text-primary" />
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Reports & Notifications</h1>
          </div>
          <p className="text-muted-foreground">
            Generate data exports and manage your notification preferences
          </p>
        </div>

        {/* Report Builder */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Export Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {REPORT_CARDS.map((report) => (
              <Card key={report.type} className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <report.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{report.title}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">CSV</Badge>
                    <Button
                      size="sm"
                      onClick={() => generateReport(report.type)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <FileDown className="h-4 w-4 mr-1" />}
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Notification Preferences */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notification Preferences
          </h2>
          <Card className="border-border">
            <CardContent className="pt-6">
              {prefsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {NOTIFICATION_TYPES.map((nt) => {
                    const pref = getPref(nt.value);
                    const inApp = pref?.in_app ?? true;
                    const email = pref?.email ?? false;

                    return (
                      <div key={nt.value} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <Label className="font-medium text-foreground">{nt.label}</Label>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={inApp}
                              onCheckedChange={(checked) =>
                                upsert.mutate({ notification_type: nt.value, in_app: checked, email })
                              }
                            />
                            <span className="text-xs text-muted-foreground">In-App</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={email}
                              onCheckedChange={(checked) =>
                                upsert.mutate({ notification_type: nt.value, in_app: inApp, email: checked })
                              }
                            />
                            <span className="text-xs text-muted-foreground">Email</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
};

export default Reports;
