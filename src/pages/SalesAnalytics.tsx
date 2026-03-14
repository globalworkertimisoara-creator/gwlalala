import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Loader2, DollarSign, TrendingUp, Snowflake, XCircle, Clock, FileText, Users,
  CalendarIcon, Trophy, Building2, Globe, ArrowRight, BarChart3,
} from 'lucide-react';
import { useSalesCommissionsSummary, type SalesCommissionSummary } from '@/hooks/useSalesCommissions';
import { useContracts, useExpiringContracts, type Contract } from '@/hooks/useContracts';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { format, isWithinInterval, startOfMonth, startOfQuarter, startOfYear, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

// ─── Colors ───
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  earned: 'bg-green-100 text-green-800',
  partial: 'bg-blue-100 text-blue-800',
  frozen: 'bg-sky-100 text-sky-800',
  forfeited: 'bg-red-100 text-red-800',
};
const CHART_COLORS = [
  'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))',
  'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--accent))', 'hsl(var(--primary))',
];
const CONTRACT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800',
  signed: 'bg-green-100 text-green-800',
  active: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-destructive/10 text-destructive',
  terminated: 'bg-red-100 text-red-800',
};

// ─── Period filter ───
type Period = 'this_month' | 'this_quarter' | 'this_year' | 'all' | 'custom';

function usePeriodFilter() {
  const [period, setPeriod] = useState<Period>('all');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const range = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'this_month': return { from: startOfMonth(now), to: now };
      case 'this_quarter': return { from: startOfQuarter(now), to: now };
      case 'this_year': return { from: startOfYear(now), to: now };
      case 'custom': return { from: customFrom, to: customTo };
      default: return { from: undefined, to: undefined };
    }
  }, [period, customFrom, customTo]);

  const inRange = (dateStr: string) => {
    if (!range.from && !range.to) return true;
    const d = new Date(dateStr);
    if (range.from && range.to) return isWithinInterval(d, { start: range.from, end: range.to });
    if (range.from) return d >= range.from;
    if (range.to) return d <= range.to;
    return true;
  };

  return { period, setPeriod, customFrom, setCustomFrom, customTo, setCustomTo, inRange, range };
}

function PeriodSelector({ filter }: { filter: ReturnType<typeof usePeriodFilter> }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(['this_month', 'this_quarter', 'this_year', 'all'] as Period[]).map(p => (
        <Button
          key={p}
          size="sm"
          variant={filter.period === p ? 'default' : 'outline'}
          onClick={() => filter.setPeriod(p)}
          className="text-xs"
        >
          {p === 'this_month' ? 'Month' : p === 'this_quarter' ? 'Quarter' : p === 'this_year' ? 'Year' : 'All Time'}
        </Button>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant={filter.period === 'custom' ? 'default' : 'outline'} className="text-xs gap-1">
            <CalendarIcon className="h-3 w-3" />
            {filter.period === 'custom' && filter.customFrom
              ? `${format(filter.customFrom, 'MMM d')}${filter.customTo ? ` – ${format(filter.customTo, 'MMM d')}` : ''}`
              : 'Custom'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={{ from: filter.customFrom, to: filter.customTo }}
            onSelect={(range) => {
              filter.setCustomFrom(range?.from);
              filter.setCustomTo(range?.to);
              filter.setPeriod('custom');
            }}
            className={cn("p-3 pointer-events-auto")}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ─── Clients & Contracts Tab ───
function ClientsContractsTab({
  contracts,
  commissions,
  filter,
  navigate,
}: {
  contracts: Contract[];
  commissions: SalesCommissionSummary[];
  filter: ReturnType<typeof usePeriodFilter>;
  navigate: (path: string) => void;
}) {
  const [drilldown, setDrilldown] = useState<string | null>(null);

  const filtered = contracts.filter(c => filter.inRange(c.created_at));
  const filteredCommissions = commissions.filter(c => filter.inRange(c.created_at));

  // Stats
  const totalRevenue = filtered.reduce((s, c) => s + (c.total_value || 0), 0);
  const activeContracts = filtered.filter(c => c.status === 'active').length;
  const avgDealSize = filtered.length > 0 ? Math.round(totalRevenue / filtered.length) : 0;
  const signedContracts = filtered.filter(c => c.status === 'signed' || c.status === 'active').length;
  const conversionRate = filtered.length > 0 ? Math.round((signedContracts / filtered.length) * 100) : 0;

  // Pipeline funnel
  const pipeline = ['draft', 'sent', 'signed', 'active', 'expired', 'terminated'].map(status => ({
    status,
    count: filtered.filter(c => c.status === status).length,
    value: filtered.filter(c => c.status === status).reduce((s, c) => s + (c.total_value || 0), 0),
  })).filter(s => s.count > 0);

  // Revenue by client (party_type = employer)
  const byClient = filteredCommissions.reduce((acc, c) => {
    const name = c.employer_name || c.project_name || 'Unknown';
    if (!acc[name]) acc[name] = { revenue: 0, contracts: 0, commissions: 0 };
    acc[name].revenue += c.contract_value || 0;
    acc[name].commissions += c.commission_amount;
    acc[name].contracts += 1;
    return acc;
  }, {} as Record<string, { revenue: number; contracts: number; commissions: number }>);

  const clientData = Object.entries(byClient)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(([name, data]) => ({ name: name.length > 20 ? name.slice(0, 18) + '…' : name, ...data }));

  // Monthly revenue trend
  const monthlyRevenue = filtered.reduce((acc, c) => {
    const month = format(new Date(c.created_at), 'yyyy-MM');
    if (!acc[month]) acc[month] = 0;
    acc[month] += c.total_value || 0;
    return acc;
  }, {} as Record<string, number>);

  const trendData = Object.entries(monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month: format(new Date(month + '-01'), 'MMM yy'), amount }));

  // Contract type breakdown
  const typeBreakdown = filtered.reduce((acc, c) => {
    const type = c.contract_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    acc[type] = (acc[type] || 0) + (c.total_value || 0);
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(typeBreakdown)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  // Drilldown data
  const drilldownContracts = drilldown
    ? filtered.filter(c => c.status === drilldown)
    : [];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDrilldown(null)}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5"><DollarSign className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-foreground">€{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDrilldown('active')}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2.5"><FileText className="h-5 w-5 text-emerald-700" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Active Contracts</p>
                <p className="text-xl font-bold text-foreground">{activeContracts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5"><TrendingUp className="h-5 w-5 text-blue-700" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Avg Deal Size</p>
                <p className="text-xl font-bold text-foreground">€{avgDealSize.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2.5"><BarChart3 className="h-5 w-5 text-purple-700" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
                <p className="text-xl font-bold text-foreground">{conversionRate}%</p>
                <p className="text-xs text-muted-foreground">{signedContracts} of {filtered.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Funnel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Contract Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {pipeline.map((stage, i) => (
              <div
                key={stage.status}
                className="flex-1 min-w-[120px] p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors text-center"
                onClick={() => setDrilldown(stage.status)}
              >
                <Badge className={cn('mb-1', CONTRACT_STATUS_COLORS[stage.status] || 'bg-muted')}>
                  {stage.status}
                </Badge>
                <p className="text-lg font-bold">{stage.count}</p>
                <p className="text-xs text-muted-foreground">€{stage.value.toLocaleString()}</p>
                {i < pipeline.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto mt-1 hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Client */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Revenue by Client</CardTitle></CardHeader>
          <CardContent>
            {clientData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No client data</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={clientData} layout="vertical" margin={{ left: 80 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Contract Type Breakdown */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">By Contract Type</CardTitle></CardHeader>
          <CardContent>
            {typeData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={typeData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {typeData.map((_, i) => <Cell key={i} fill={PASTEL_COLORS[i % PASTEL_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Revenue Trend</CardTitle></CardHeader>
        <CardContent>
          {trendData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No trend data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trendData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Clients Table */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Client Overview</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Commissions</TableHead>
                <TableHead>Records</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(byClient)
                .sort(([, a], [, b]) => b.revenue - a.revenue)
                .slice(0, 15)
                .map(([name, data]) => (
                  <TableRow key={name} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell>€{data.revenue.toLocaleString()}</TableCell>
                    <TableCell>€{data.commissions.toLocaleString()}</TableCell>
                    <TableCell>{data.contracts}</TableCell>
                  </TableRow>
                ))}
              {Object.keys(byClient).length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pipeline Drilldown Dialog */}
      <Dialog open={drilldown !== null} onOpenChange={() => setDrilldown(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{drilldown ? `${drilldown.charAt(0).toUpperCase() + drilldown.slice(1)} Contracts` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {drilldownContracts.length} contract{drilldownContracts.length !== 1 ? 's' : ''} ·
              Total: €{drilldownContracts.reduce((s, c) => s + (c.total_value || 0), 0).toLocaleString()}
            </p>
            {drilldownContracts.map(c => (
              <div
                key={c.id}
                className="p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => { setDrilldown(null); navigate(`/contracts?highlight=${c.id}`); }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{c.title}</p>
                  <p className="text-sm font-bold">{c.total_value ? `€${c.total_value.toLocaleString()}` : '—'}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {c.party_type} · {c.contract_type.replace(/_/g, ' ')}
                  {c.start_date && ` · ${format(new Date(c.start_date), 'MMM d, yyyy')}`}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sales Team Tab ───
function SalesTeamTab({
  commissions,
  filter,
  navigate,
}: {
  commissions: SalesCommissionSummary[];
  filter: ReturnType<typeof usePeriodFilter>;
  navigate: (path: string) => void;
}) {
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [statusDrilldown, setStatusDrilldown] = useState<string | null>(null);

  const filtered = commissions.filter(c => filter.inRange(c.created_at));

  // Totals by status
  const totalByStatus = (['earned', 'pending', 'frozen', 'forfeited'] as const).map(status => ({
    status,
    total: filtered.filter(c => c.commission_status === status).reduce((s, c) => s + c.commission_amount, 0),
    count: filtered.filter(c => c.commission_status === status).length,
  }));

  const statusIcons: Record<string, any> = { earned: TrendingUp, pending: Clock, frozen: Snowflake, forfeited: XCircle };
  const statusIconColors: Record<string, string> = {
    earned: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    frozen: 'bg-sky-100 text-sky-700',
    forfeited: 'bg-red-100 text-red-700',
  };

  // Leaderboard
  const bySalesPerson = filtered.reduce((acc, c) => {
    const name = c.sales_person_name || 'Unassigned';
    const id = c.sales_person_id;
    if (!acc[name]) acc[name] = { id, earned: 0, pending: 0, total: 0, contracts: new Set<string>(), deals: 0 };
    acc[name].total += c.commission_amount;
    if (c.commission_status === 'earned') acc[name].earned += c.commission_amount;
    if (c.commission_status === 'pending') acc[name].pending += c.commission_amount;
    if (c.contract_id) acc[name].contracts.add(c.contract_id);
    acc[name].deals += 1;
    return acc;
  }, {} as Record<string, { id: string; earned: number; pending: number; total: number; contracts: Set<string>; deals: number }>);

  const leaderboard = Object.entries(bySalesPerson)
    .sort(([, a], [, b]) => b.earned - a.earned)
    .map(([name, data], i) => ({ rank: i + 1, name, ...data, contractCount: data.contracts.size }));

  // Comparison chart
  const comparisonData = leaderboard.map(p => ({
    name: p.name.length > 12 ? p.name.slice(0, 10) + '…' : p.name,
    earned: p.earned,
    pending: p.pending,
  }));

  // Monthly commission timeline
  const monthlyTimeline = filtered.reduce((acc, c) => {
    if (c.commission_status !== 'earned') return acc;
    const month = format(new Date(c.created_at), 'yyyy-MM');
    const name = c.sales_person_name || 'Unassigned';
    if (!acc[month]) acc[month] = {};
    acc[month][name] = (acc[month][name] || 0) + c.commission_amount;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const allNames = [...new Set(filtered.map(c => c.sales_person_name || 'Unassigned'))];
  const timelineData = Object.entries(monthlyTimeline)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: format(new Date(month + '-01'), 'MMM yy'),
      ...Object.fromEntries(allNames.map(n => [n, data[n] || 0])),
    }));

  // Selected person portfolio
  const selectedData = selectedPerson
    ? filtered.filter(c => (c.sales_person_name || 'Unassigned') === selectedPerson)
    : [];

  return (
    <div className="space-y-6">
      {/* Commission Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {totalByStatus.map(({ status, total, count }) => {
          const Icon = statusIcons[status];
          return (
            <Card
              key={status}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setStatusDrilldown(status)}
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className={cn('rounded-lg p-2.5', statusIconColors[status])}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground capitalize">{status}</p>
                    <p className="text-xl font-bold text-foreground">€{total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{count} record{count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Leaderboard & Portfolio side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" /> Sales Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaderboard.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No data</p>
            )}
            {leaderboard.map(p => (
              <div
                key={p.name}
                className={cn(
                  "p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors",
                  selectedPerson === p.name ? "bg-primary/5 ring-1 ring-primary/20" : "bg-muted/50"
                )}
                onClick={() => setSelectedPerson(selectedPerson === p.name ? null : p.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                      p.rank === 1 ? "bg-amber-100 text-amber-800" :
                      p.rank === 2 ? "bg-slate-200 text-slate-700" :
                      p.rank === 3 ? "bg-orange-100 text-orange-800" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {p.rank}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.contractCount} contract{p.contractCount !== 1 ? 's' : ''} · {p.deals} commission{p.deals !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-700">€{p.earned.toLocaleString()}</p>
                    {p.pending > 0 && <p className="text-xs text-amber-600">+€{p.pending.toLocaleString()} pending</p>}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Individual Portfolio (right beside leaderboard) */}
        {selectedPerson ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> {selectedPerson}'s Portfolio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contract</TableHead>
                      <TableHead>Employer</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedData.map(c => (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/contracts?highlight=${c.contract_id}`)}
                      >
                        <TableCell className="font-medium">{c.contract_title || '—'}</TableCell>
                        <TableCell>{c.employer_name || '—'}</TableCell>
                        <TableCell>
                          <span className="font-semibold">€{c.commission_amount.toLocaleString()}</span>
                          {c.original_amount != null && c.original_amount !== c.commission_amount && (
                            <span className="text-xs text-muted-foreground ml-1">(was €{c.original_amount.toLocaleString()})</span>
                          )}
                        </TableCell>
                        <TableCell><Badge className={STATUS_COLORS[c.commission_status] || 'bg-muted'}>{c.commission_status}</Badge></TableCell>
                        <TableCell>{format(new Date(c.created_at), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-full min-h-[200px]">
              <p className="text-sm text-muted-foreground">Click a team member to view their portfolio</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Team Comparison & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Team Comparison</CardTitle></CardHeader>
          <CardContent>
            {comparisonData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={comparisonData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="earned" fill="#10b981" name="Earned" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {timelineData.length > 0 && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Commission Payment Timeline</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={timelineData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
                  <Legend />
                  {allNames.map((name, i) => (
                    <Bar key={name} dataKey={name} stackId="a" fill={PASTEL_COLORS[i % PASTEL_COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* All Commissions Table */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">All Commissions</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
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
                    <TableHead>Sales Person</TableHead>
                    <TableHead>Contract Value</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/contracts?highlight=${c.contract_id}`)}
                    >
                      <TableCell className="font-medium">{c.contract_title || '—'}</TableCell>
                      <TableCell>{c.employer_name || '—'}</TableCell>
                      <TableCell>{c.sales_person_name || '—'}</TableCell>
                      <TableCell>{c.contract_value ? `€${c.contract_value.toLocaleString()}` : '—'}</TableCell>
                      <TableCell className="font-semibold">€{c.commission_amount.toLocaleString()}</TableCell>
                      <TableCell><Badge className={STATUS_COLORS[c.commission_status] || 'bg-muted'}>{c.commission_status}</Badge></TableCell>
                      <TableCell>{c.contract_type ? <Badge variant="outline">{c.contract_type}</Badge> : '—'}</TableCell>
                      <TableCell>{format(new Date(c.created_at), 'MMM d, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Drilldown Dialog */}
      <Dialog open={statusDrilldown !== null} onOpenChange={() => setStatusDrilldown(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">{statusDrilldown} Commissions</DialogTitle>
          </DialogHeader>
          {statusDrilldown && (() => {
            const items = filtered.filter(c => c.commission_status === statusDrilldown);
            const total = items.reduce((s, c) => s + c.commission_amount, 0);

            // By sales person
            const byPerson = items.reduce((acc, c) => {
              const name = c.sales_person_name || 'Unassigned';
              if (!acc[name]) acc[name] = { total: 0, count: 0 };
              acc[name].total += c.commission_amount;
              acc[name].count += 1;
              return acc;
            }, {} as Record<string, { total: number; count: number }>);

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-lg font-bold">€{total.toLocaleString()} ({items.length})</span>
                </div>

                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">By Sales Person</h4>
                {Object.entries(byPerson).sort(([, a], [, b]) => b.total - a.total).map(([name, data]) => (
                  <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{data.count} record{data.count !== 1 ? 's' : ''}</p>
                    </div>
                    <p className="text-sm font-bold">€{data.total.toLocaleString()}</p>
                  </div>
                ))}

                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">All Records</h4>
                {items.map(c => (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => { setStatusDrilldown(null); navigate(`/contracts?highlight=${c.contract_id}`); }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{c.contract_title || 'Untitled'}</p>
                      <p className="text-sm font-bold">€{c.commission_amount.toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.employer_name || '—'} · {c.sales_person_name || '—'} · {format(new Date(c.created_at), 'MMM d, yyyy')}
                    </p>
                    {c.original_amount != null && c.original_amount !== c.commission_amount && (
                      <p className="text-xs text-muted-foreground">
                        Original: €{c.original_amount.toLocaleString()} → €{c.commission_amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ───
export default function SalesAnalytics() {
  const { data: commissions = [], isLoading: commissionsLoading } = useSalesCommissionsSummary();
  const { data: contracts = [], isLoading: contractsLoading } = useContracts();
  const { data: expiring = [] } = useExpiringContracts(30);
  const navigate = useNavigate();
  const filter = usePeriodFilter();

  const isLoading = commissionsLoading || contractsLoading;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Sales Analytics</h1>
            <p className="text-muted-foreground">Client performance, contracts, and team commissions</p>
          </div>
          <PeriodSelector filter={filter} />
        </div>

        {/* Expiring alert */}
        {expiring.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-amber-800">
                <Clock className="h-4 w-4" />
                <p className="text-sm font-medium">{expiring.length} contract{expiring.length > 1 ? 's' : ''} expiring within 30 days</p>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="clients" className="space-y-6">
            <TabsList>
              <TabsTrigger value="clients" className="gap-1.5">
                <Building2 className="h-4 w-4" /> Clients & Contracts
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-1.5">
                <Users className="h-4 w-4" /> Sales Team
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients">
              <ClientsContractsTab contracts={contracts} commissions={commissions} filter={filter} navigate={navigate} />
            </TabsContent>

            <TabsContent value="team">
              <SalesTeamTab commissions={commissions} filter={filter} navigate={navigate} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
