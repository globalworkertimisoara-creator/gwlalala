import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import type { Contract } from '@/hooks/useContracts';
import { format, subMonths, startOfMonth, isAfter } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { CalendarDays } from 'lucide-react';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--accent))',
  'hsl(var(--primary))',
];

const typeLabels: Record<string, string> = {
  employer_agreement: 'Employer',
  agency_agreement: 'Agency',
  worker_contract: 'Worker',
  service_agreement: 'Service',
};

interface ContractAnalyticsPanelProps {
  contracts: Contract[];
  expiring: Contract[];
}

export function ContractAnalyticsPanel({ contracts, expiring }: ContractAnalyticsPanelProps) {
  // By type
  const byType = Object.entries(
    contracts.reduce((acc, c) => {
      const key = typeLabels[c.contract_type] || c.contract_type;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // By status
  const byStatus = Object.entries(
    contracts.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  // Monthly trend (last 6 months)
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), 5 - i);
    const start = startOfMonth(month);
    const end = startOfMonth(subMonths(new Date(), 4 - i));
    const active = contracts.filter(c => {
      if (!c.start_date) return false;
      const sd = new Date(c.start_date);
      return sd <= end && (!c.end_date || new Date(c.end_date) >= start);
    }).length;
    const created = contracts.filter(c => {
      const d = new Date(c.created_at);
      return d >= start && d < end;
    }).length;
    return { month: format(month, 'MMM'), active, created };
  });

  // Financial by month
  const financialByMonth = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(new Date(), 5 - i);
    const start = startOfMonth(month);
    const end = startOfMonth(subMonths(new Date(), 4 - i));
    const value = contracts
      .filter(c => {
        const d = new Date(c.created_at);
        return d >= start && d < end && c.total_value;
      })
      .reduce((sum, c) => sum + (c.total_value || 0), 0);
    return { month: format(month, 'MMM'), value };
  });

  // Expiry calendar - next 90 days grouped by month
  const expiryByMonth = expiring.reduce((acc, c) => {
    if (!c.end_date) return acc;
    const key = format(new Date(c.end_date), 'MMM yyyy');
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {} as Record<string, Contract[]>);

  // Performance metrics
  const avgValue = contracts.length > 0
    ? contracts.reduce((s, c) => s + (c.total_value || 0), 0) / contracts.filter(c => c.total_value).length
    : 0;
  const renewalRate = contracts.length > 0
    ? ((contracts.filter(c => c.auto_renew).length / contracts.length) * 100).toFixed(0)
    : '0';
  const terminatedRate = contracts.length > 0
    ? ((contracts.filter(c => c.status === 'terminated').length / contracts.length) * 100).toFixed(0)
    : '0';

  return (
    <div className="space-y-6">
      {/* Row 1: Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* By Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contracts by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                    {byType.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* By Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contracts by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byStatus}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active vs Created (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="active" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="created" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Financial + Metrics + Expiry Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Financial by month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contract Value by Month (€)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialByMonth}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Contract Value</span>
              <span className="font-semibold">€{avgValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Auto-Renewal Rate</span>
              <span className="font-semibold">{renewalRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Termination Rate</span>
              <span className="font-semibold text-destructive">{terminatedRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Contracts</span>
              <span className="font-semibold">{contracts.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Signed Contracts</span>
              <span className="font-semibold">{contracts.filter(c => c.signed_by_party_at).length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Expiry Calendar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Expiry Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(expiryByMonth).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No contracts expiring soon</p>
            ) : (
              <div className="space-y-3 max-h-[200px] overflow-y-auto">
                {Object.entries(expiryByMonth).map(([month, list]) => (
                  <div key={month}>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{month}</p>
                    {list.map(c => {
                      const daysLeft = Math.ceil((new Date(c.end_date!).getTime() - Date.now()) / 86400000);
                      return (
                        <div key={c.id} className="flex items-center justify-between text-sm py-1">
                          <span className="truncate mr-2">{c.title}</span>
                          <Badge variant={daysLeft <= 7 ? 'destructive' : daysLeft <= 14 ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                            {daysLeft}d
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
