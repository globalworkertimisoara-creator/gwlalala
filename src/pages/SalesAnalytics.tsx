import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export default function SalesAnalytics() {
  const { data: commissions = [], isLoading } = useSalesCommissionsSummary();

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
              <Card>
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
              <Card>
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
              <Card>
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
              <Card>
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
                        <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
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
                      <BarChart data={timelineData}>
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
                          <TableHead>Project</TableHead>
                          <TableHead>Sales Person</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Project Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissions.map((c: SalesCommissionSummary) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.contract_title || '—'}</TableCell>
                            <TableCell>{c.project_name || '—'}</TableCell>
                            <TableCell>{c.sales_person_name || '—'}</TableCell>
                            <TableCell>€{c.commission_amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge className={statusColors[c.commission_status] || 'bg-muted'}>{c.commission_status}</Badge>
                            </TableCell>
                            <TableCell>
                              {c.project_status ? <Badge variant="outline">{c.project_status}</Badge> : '—'}
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
    </AppLayout>
  );
}
