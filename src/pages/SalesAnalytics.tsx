import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, DollarSign, TrendingUp, Snowflake, XCircle, Clock } from 'lucide-react';
import { useSalesCommissionsSummary, type SalesCommissionSummary } from '@/hooks/useSalesCommissions';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  earned: 'bg-green-100 text-green-800',
  partial: 'bg-blue-100 text-blue-800',
  frozen: 'bg-sky-100 text-sky-800',
  forfeited: 'bg-red-100 text-red-800',
};

const PIE_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#0ea5e9', '#ef4444'];

type DrilldownType = 'earned' | 'pending' | 'frozen' | 'forfeited' | null;
type ChartDrilldown = { type: 'pie'; status: string } | { type: 'bar'; month: string } | null;

function CommissionDrilldownContent({
  commissions,
  status,
  navigate,
  onClose,
}: {
  commissions: SalesCommissionSummary[];
  status: string;
  navigate: (path: string) => void;
  onClose: () => void;
}) {
  const filtered = commissions.filter((c) => c.commission_status === status);
  const totalAmount = filtered.reduce((s, c) => s + c.commission_amount, 0);

  // Sales person breakdown
  const bySalesPerson = filtered.reduce((acc, c) => {
    const name = c.sales_person_name || 'Unassigned';
    if (!acc[name]) acc[name] = { total: 0, count: 0 };
    acc[name].total += c.commission_amount;
    acc[name].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  // Project breakdown
  const byProject = filtered.reduce((acc, c) => {
    const name = c.project_name || 'No Project';
    if (!acc[name]) acc[name] = { total: 0, count: 0, contractValue: 0 };
    acc[name].total += c.commission_amount;
    acc[name].count += 1;
    acc[name].contractValue += c.contract_value || 0;
    return acc;
  }, {} as Record<string, { total: number; count: number; contractValue: number }>);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <span className="text-sm font-medium">Total {status} commissions</span>
        <div className="text-right">
          <span className="text-lg font-bold">€{totalAmount.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground ml-2">({filtered.length} records)</span>
        </div>
      </div>

      {/* Sales Person Breakdown */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">By Sales Person</h4>
        {Object.entries(bySalesPerson)
          .sort(([, a], [, b]) => b.total - a.total)
          .map(([name, data]) => (
            <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{data.count} commission{data.count > 1 ? 's' : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">€{data.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{totalAmount > 0 ? Math.round((data.total / totalAmount) * 100) : 0}% of total</p>
              </div>
            </div>
          ))}
      </div>

      {/* Project Breakdown */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">By Project</h4>
        {Object.entries(byProject)
          .sort(([, a], [, b]) => b.total - a.total)
          .map(([name, data]) => {
            const pctOfContract = data.contractValue > 0 ? Math.round((data.total / data.contractValue) * 100) : null;
            return (
              <div key={name} className="p-3 rounded-lg bg-muted/50 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-sm font-bold">€{data.total.toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Contract: €{data.contractValue.toLocaleString()}
                    {pctOfContract !== null && ` · ${pctOfContract}% received`}
                  </span>
                  <span>{data.count} record{data.count > 1 ? 's' : ''}</span>
                </div>
                {pctOfContract !== null && <Progress value={pctOfContract} className="h-1.5" />}
              </div>
            );
          })}
      </div>

      {/* Commission List */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">All Records</h4>
        {filtered.map((c) => (
          <div
            key={c.id}
            className="p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors space-y-1"
            onClick={() => {
              onClose();
              if (c.contract_id) navigate(`/contracts?highlight=${c.contract_id}`);
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{c.contract_title || 'Untitled Contract'}</p>
              <p className="text-sm font-bold">€{c.commission_amount.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              {c.employer_name && <span>{c.employer_name}</span>}
              {c.contract_type && <Badge variant="outline" className="text-xs">{c.contract_type}</Badge>}
              {c.sales_person_name && <span>· {c.sales_person_name}</span>}
              <span>· {format(new Date(c.created_at), 'MMM d, yyyy')}</span>
            </div>
            {c.original_amount !== null && c.original_amount !== c.commission_amount && (
              <p className="text-xs text-muted-foreground">
                Original: €{c.original_amount.toLocaleString()} → Adjusted: €{c.commission_amount.toLocaleString()}
                {c.adjustment_reason && ` (${c.adjustment_reason})`}
              </p>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No {status} commissions</p>
        )}
      </div>
    </div>
  );
}

function ChartDrilldownContent({
  commissions,
  drilldown,
  navigate,
  onClose,
}: {
  commissions: SalesCommissionSummary[];
  drilldown: NonNullable<ChartDrilldown>;
  navigate: (path: string) => void;
  onClose: () => void;
}) {
  let filtered: SalesCommissionSummary[];
  let title: string;

  if (drilldown.type === 'pie') {
    filtered = commissions.filter((c) => c.commission_status === drilldown.status.toLowerCase());
    title = `${drilldown.status} Commissions`;
  } else {
    filtered = commissions.filter((c) => {
      const month = format(new Date(c.created_at), 'MMM yyyy');
      return month === drilldown.month && c.commission_status === 'earned';
    });
    title = `Earned in ${drilldown.month}`;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {filtered.length} commission{filtered.length !== 1 ? 's' : ''} · Total: €{filtered.reduce((s, c) => s + c.commission_amount, 0).toLocaleString()}
      </p>
      {filtered.map((c) => (
        <div
          key={c.id}
          className="p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
          onClick={() => {
            onClose();
            if (c.contract_id) navigate(`/contracts?highlight=${c.contract_id}`);
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{c.contract_title || 'Untitled'}</p>
              <p className="text-xs text-muted-foreground">
                {c.employer_name || c.project_name || '—'} · {c.sales_person_name || '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">€{c.commission_amount.toLocaleString()}</p>
              <Badge className={`text-xs ${statusColors[c.commission_status] || 'bg-muted'}`}>
                {c.commission_status}
              </Badge>
            </div>
          </div>
        </div>
      ))}
      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No commissions found</p>
      )}
    </div>
  );
}

export default function SalesAnalytics() {
  const { data: commissions = [], isLoading } = useSalesCommissionsSummary();
  const [drilldown, setDrilldown] = useState<DrilldownType>(null);
  const [chartDrilldown, setChartDrilldown] = useState<ChartDrilldown>(null);
  const navigate = useNavigate();

  const totalEarned = commissions
    .filter((c) => c.commission_status === 'earned')
    .reduce((sum, c) => sum + c.commission_amount, 0);

  const totalPending = commissions
    .filter((c) => c.commission_status === 'pending')
    .reduce((sum, c) => sum + c.commission_amount, 0);

  const totalFrozen = commissions
    .filter((c) => c.commission_status === 'frozen')
    .reduce((sum, c) => sum + c.commission_amount, 0);

  const totalForfeited = commissions
    .filter((c) => c.commission_status === 'forfeited')
    .reduce((sum, c) => sum + c.commission_amount, 0);

  // Status breakdown for pie chart
  const statusBreakdown = ['pending', 'earned', 'partial', 'frozen', 'forfeited']
    .map((status) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: commissions.filter((c) => c.commission_status === status).reduce((s, c) => s + c.commission_amount, 0),
    }))
    .filter((s) => s.value > 0);

  // Monthly timeline
  const monthlyData = commissions.reduce((acc, c) => {
    const month = format(new Date(c.created_at), 'yyyy-MM');
    if (!acc[month]) acc[month] = 0;
    if (c.commission_status === 'earned') acc[month] += c.commission_amount;
    return acc;
  }, {} as Record<string, number>);

  const timelineData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({
      month: format(new Date(month + '-01'), 'MMM yyyy'),
      amount,
    }));

  const drilldownTitles: Record<string, string> = {
    earned: 'Earned Commissions',
    pending: 'Pending Commissions',
    frozen: 'Frozen Commissions',
    forfeited: 'Forfeited Commissions',
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Sales Analytics</h1>
          <p className="text-muted-foreground">Commission tracking and performance overview</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDrilldown('earned')}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2"><TrendingUp className="h-5 w-5 text-green-700" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Earned</p>
                      <p className="text-2xl font-bold text-foreground">€{totalEarned.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDrilldown('pending')}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-100 p-2"><Clock className="h-5 w-5 text-amber-700" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-foreground">€{totalPending.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDrilldown('frozen')}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-sky-100 p-2"><Snowflake className="h-5 w-5 text-sky-700" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Frozen</p>
                      <p className="text-2xl font-bold text-foreground">€{totalFrozen.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDrilldown('forfeited')}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-red-100 p-2"><XCircle className="h-5 w-5 text-red-700" /></div>
                    <div>
                      <p className="text-sm text-muted-foreground">Forfeited</p>
                      <p className="text-2xl font-bold text-foreground">€{totalForfeited.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Breakdown */}
              <Card>
                <CardHeader><CardTitle>Commission by Status</CardTitle></CardHeader>
                <CardContent>
                  {statusBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No commission data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={statusBreakdown}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          onClick={(_, index) => {
                            const segment = statusBreakdown[index];
                            if (segment) setChartDrilldown({ type: 'pie', status: segment.name });
                          }}
                          className="cursor-pointer"
                        >
                          {statusBreakdown.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Earned Timeline */}
              <Card>
                <CardHeader><CardTitle>Monthly Earned Commission</CardTitle></CardHeader>
                <CardContent>
                  {timelineData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No earned commissions yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={timelineData}
                        onClick={(data) => {
                          if (data?.activePayload?.[0]) {
                            const month = data.activePayload[0].payload.month;
                            setChartDrilldown({ type: 'bar', month });
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
                        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Commission Table */}
            <Card>
              <CardHeader><CardTitle>All Commissions</CardTitle></CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No commissions found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contract</TableHead>
                          <TableHead>Employer</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Sales Person</TableHead>
                          <TableHead>Contract Value</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Original</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissions.map((c: SalesCommissionSummary) => (
                          <TableRow
                            key={c.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              if (c.contract_id) navigate(`/contracts?highlight=${c.contract_id}`);
                            }}
                          >
                            <TableCell className="font-medium">{c.contract_title || '—'}</TableCell>
                            <TableCell>{c.employer_name || '—'}</TableCell>
                            <TableCell>{c.project_name || '—'}</TableCell>
                            <TableCell>{c.sales_person_name || '—'}</TableCell>
                            <TableCell>{c.contract_value ? `€${c.contract_value.toLocaleString()}` : '—'}</TableCell>
                            <TableCell className="font-semibold">€{c.commission_amount.toLocaleString()}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {c.original_amount !== null && c.original_amount !== c.commission_amount
                                ? `€${c.original_amount.toLocaleString()}`
                                : '—'}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusColors[c.commission_status] || 'bg-muted'}>{c.commission_status}</Badge>
                            </TableCell>
                            <TableCell>
                              {c.contract_type ? <Badge variant="outline">{c.contract_type}</Badge> : '—'}
                            </TableCell>
                            <TableCell>{format(new Date(c.created_at), 'MMM d, yyyy')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Status Card Drilldown Dialog */}
      <Dialog open={drilldown !== null} onOpenChange={() => setDrilldown(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{drilldown ? drilldownTitles[drilldown] : ''}</DialogTitle>
          </DialogHeader>
          {drilldown && (
            <CommissionDrilldownContent
              commissions={commissions}
              status={drilldown}
              navigate={navigate}
              onClose={() => setDrilldown(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Chart Drilldown Dialog */}
      <Dialog open={chartDrilldown !== null} onOpenChange={() => setChartDrilldown(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {chartDrilldown?.type === 'pie' && `${chartDrilldown.status} Commissions`}
              {chartDrilldown?.type === 'bar' && `Earned in ${chartDrilldown.month}`}
            </DialogTitle>
          </DialogHeader>
          {chartDrilldown && (
            <ChartDrilldownContent
              commissions={commissions}
              drilldown={chartDrilldown}
              navigate={navigate}
              onClose={() => setChartDrilldown(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
