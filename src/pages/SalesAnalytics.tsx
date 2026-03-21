import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Loader2, DollarSign, TrendingUp, Snowflake, XCircle, Clock, FileText, Users,
  CalendarIcon, Trophy, Building2, Globe, ArrowRight, BarChart3, ArrowUpDown,
  Search, ChevronLeft, ChevronRight, X, ExternalLink, FolderKanban,
} from 'lucide-react';
import { useSalesCommissionsSummary, type SalesCommissionSummary } from '@/hooks/useSalesCommissions';
import { useContracts, useExpiringContracts, type Contract } from '@/hooks/useContracts';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { format, isWithinInterval, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';
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
    <div className="flex flex-wrap items-center gap-1.5">
      {(['this_month', 'this_quarter', 'this_year', 'all'] as Period[]).map(p => (
        <Button
          key={p}
          size="sm"
          variant={filter.period === p ? 'default' : 'outline'}
          onClick={() => filter.setPeriod(p)}
          className="text-xs h-7 px-2.5"
        >
          {p === 'this_month' ? 'Month' : p === 'this_quarter' ? 'Quarter' : p === 'this_year' ? 'Year' : 'All'}
        </Button>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant={filter.period === 'custom' ? 'default' : 'outline'} className="text-xs h-7 px-2.5 gap-1">
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

// ─── Detail panel types ───
type SalesDetail = {
  type: 'commission' | 'client' | 'person' | 'pipeline' | 'contract';
  title: string;
  data?: any;
};

// ─── Paginated sortable table ───
function SortableCommissionsTable({
  commissions,
  onRowClick,
}: {
  commissions: SalesCommissionSummary[];
  onRowClick: (c: SalesCommissionSummary) => void;
}) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortCol, setSortCol] = useState<string>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return commissions;
    const q = search.toLowerCase();
    return commissions.filter(c =>
      (c.contract_title || '').toLowerCase().includes(q) ||
      (c.employer_name || '').toLowerCase().includes(q) ||
      (c.sales_person_name || '').toLowerCase().includes(q)
    );
  }, [commissions, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a: any, b: any) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(0);
  };

  const SortHeader = ({ col, children }: { col: string; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 text-xs"
      onClick={() => toggleSort(col)}
    >
      <div className="flex items-center gap-1">{children} <ArrowUpDown className="h-2.5 w-2.5" /></div>
    </TableHead>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search commissions..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(0); }}>
          <SelectTrigger className="w-[80px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader col="contract_title">Contract</SortHeader>
              <SortHeader col="employer_name">Employer</SortHeader>
              <SortHeader col="sales_person_name">Sales Person</SortHeader>
              <SortHeader col="contract_value">Contract Value</SortHeader>
              <SortHeader col="commission_amount">Commission</SortHeader>
              <SortHeader col="commission_status">Status</SortHeader>
              <SortHeader col="created_at">Date</SortHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  No commissions found
                </TableCell>
              </TableRow>
            )}
            {paged.map(c => (
              <TableRow
                key={c.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => onRowClick(c)}
              >
                <TableCell className="text-sm font-medium">{c.contract_title || '—'}</TableCell>
                <TableCell className="text-sm">{c.employer_name || '—'}</TableCell>
                <TableCell className="text-sm">{c.sales_person_name || '—'}</TableCell>
                <TableCell className="text-sm">{c.contract_value ? `€${c.contract_value.toLocaleString()}` : '—'}</TableCell>
                <TableCell className="text-sm font-semibold">€{c.commission_amount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge className={cn('text-xs', STATUS_COLORS[c.commission_status] || 'bg-muted')}>
                    {c.commission_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(c.created_at), 'MMM d, yyyy')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{sorted.length} total · Page {page + 1} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
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
  const [activeTab, setActiveTab] = useState('clients');
  const [detail, setDetail] = useState<SalesDetail | null>(null);

  const isLoading = commissionsLoading || contractsLoading;

  const filtered = useMemo(() => contracts.filter(c => filter.inRange(c.created_at)), [contracts, filter]);
  const filteredCommissions = useMemo(() => commissions.filter(c => filter.inRange(c.created_at)), [commissions, filter]);

  const totalRevenue = filtered.reduce((s, c) => s + (c.total_value || 0), 0);
  const activeContracts = filtered.filter(c => c.status === 'active').length;
  const totalEarned = filteredCommissions.filter(c => c.commission_status === 'earned').reduce((s, c) => s + c.commission_amount, 0);
  const totalPending = filteredCommissions.filter(c => c.commission_status === 'pending').reduce((s, c) => s + c.commission_amount, 0);
  const expiringCount = expiring.length;

  const pipeline = ['draft', 'sent', 'signed', 'active', 'expired', 'terminated'].map(status => ({
    status,
    count: filtered.filter(c => c.status === status).length,
    value: filtered.filter(c => c.status === status).reduce((s, c) => s + (c.total_value || 0), 0),
  })).filter(s => s.count > 0);

  const byClient = filteredCommissions.reduce((acc, c) => {
    const name = c.employer_name || c.project_name || 'Unknown';
    if (!acc[name]) acc[name] = { revenue: 0, contracts: 0, commissions: 0, project_id: c.project_id };
    acc[name].revenue += c.contract_value || 0;
    acc[name].commissions += c.commission_amount;
    acc[name].contracts += 1;
    if (!acc[name].project_id && c.project_id) acc[name].project_id = c.project_id;
    return acc;
  }, {} as Record<string, { revenue: number; contracts: number; commissions: number; project_id: string | null }>);

  const clientData = Object.entries(byClient)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 10)
    .map(([name, data]) => ({ name: name.length > 20 ? name.slice(0, 18) + '…' : name, fullName: name, ...data }));

  const monthlyRevenue = filtered.reduce((acc, c) => {
    const month = format(new Date(c.created_at), 'yyyy-MM');
    if (!acc[month]) acc[month] = 0;
    acc[month] += c.total_value || 0;
    return acc;
  }, {} as Record<string, number>);

  const trendData = Object.entries(monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month: format(new Date(month + '-01'), 'MMM yy'), amount }));

  const bySalesPerson = filteredCommissions.reduce((acc, c) => {
    const name = c.sales_person_name || 'Unassigned';
    if (!acc[name]) acc[name] = { earned: 0, pending: 0, total: 0, contracts: new Set<string>(), deals: 0 };
    acc[name].total += c.commission_amount;
    if (c.commission_status === 'earned') acc[name].earned += c.commission_amount;
    if (c.commission_status === 'pending') acc[name].pending += c.commission_amount;
    if (c.contract_id) acc[name].contracts.add(c.contract_id);
    acc[name].deals += 1;
    return acc;
  }, {} as Record<string, { earned: number; pending: number; total: number; contracts: Set<string>; deals: number }>);

  const leaderboard = Object.entries(bySalesPerson)
    .sort(([, a], [, b]) => b.earned - a.earned)
    .map(([name, data], i) => ({ rank: i + 1, name, ...data, contractCount: data.contracts.size }));

  const comparisonData = leaderboard.map(p => ({
    name: p.name.length > 12 ? p.name.slice(0, 10) + '…' : p.name,
    earned: p.earned,
    pending: p.pending,
  }));

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b bg-background flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="space-y-0.5">
              <h1 className="text-xl lg:text-2xl font-bold">Sales Analytics</h1>
              <p className="text-sm text-muted-foreground">Client performance, contracts, and team commissions</p>
            </div>
            <PeriodSelector filter={filter} />
          </div>

          {!isLoading && (
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card">
                <div className="p-1 rounded bg-primary/10"><DollarSign className="h-3.5 w-3.5 text-primary" /></div>
                <div>
                  <span className="text-lg font-bold leading-none">€{totalRevenue.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">Revenue</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card">
                <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-950/30"><FileText className="h-3.5 w-3.5 text-emerald-700" /></div>
                <div>
                  <span className="text-lg font-bold leading-none">{activeContracts}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">Active</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card">
                <div className="p-1 rounded bg-green-100 dark:bg-green-950/30"><TrendingUp className="h-3.5 w-3.5 text-green-700" /></div>
                <div>
                  <span className="text-lg font-bold leading-none text-green-700">€{totalEarned.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">Earned</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card">
                <div className="p-1 rounded bg-amber-100 dark:bg-amber-950/30"><Clock className="h-3.5 w-3.5 text-amber-700" /></div>
                <div>
                  <span className="text-lg font-bold leading-none text-amber-700">€{totalPending.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">Pending</span>
                </div>
              </div>
              {expiringCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                  <div className="p-1 rounded bg-orange-100"><Clock className="h-3.5 w-3.5 text-orange-700" /></div>
                  <div>
                    <span className="text-lg font-bold leading-none text-orange-700">{expiringCount}</span>
                    <span className="text-xs text-orange-700 ml-1.5">Expiring</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <div className={cn('flex-1 overflow-y-auto transition-all duration-300', detail && 'max-w-[65%]')}>
              <div className="p-6">
                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setDetail(null); }} className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="clients" className="gap-1.5 text-sm">
                      <Building2 className="h-3.5 w-3.5" /> Clients & Contracts
                    </TabsTrigger>
                    <TabsTrigger value="team" className="gap-1.5 text-sm">
                      <Users className="h-3.5 w-3.5" /> Sales Team
                    </TabsTrigger>
                    <TabsTrigger value="commissions" className="gap-1.5 text-sm">
                      <DollarSign className="h-3.5 w-3.5" /> All Commissions
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="clients">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold">Contract Pipeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {pipeline.map((stage) => (
                              <div
                                key={stage.status}
                                className="flex-1 min-w-[100px] p-2.5 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors text-center"
                                onClick={() => {
                                  const items = filtered.filter(c => c.status === stage.status);
                                  setDetail({
                                    type: 'pipeline',
                                    title: `${stage.status.charAt(0).toUpperCase() + stage.status.slice(1)} Contracts`,
                                    data: { contracts: items, total: stage.value },
                                  });
                                }}
                              >
                                <Badge className={cn('mb-1 text-xs', CONTRACT_STATUS_COLORS[stage.status] || 'bg-muted')}>
                                  {stage.status}
                                </Badge>
                                <p className="text-base font-bold">{stage.count}</p>
                                <p className="text-xs text-muted-foreground">€{stage.value.toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Revenue by Client</CardTitle></CardHeader>
                          <CardContent>
                            {clientData.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-6">No client data</p>
                            ) : (
                              <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={clientData} layout="vertical" margin={{ left: 70 }}>
                                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
                                  <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
                                  <Bar
                                    dataKey="revenue"
                                    fill="hsl(var(--primary))"
                                    radius={[0, 4, 4, 0]}
                                    style={{ cursor: 'pointer' }}
                                    onClick={(data: any) => {
                                      setDetail({
                                        type: 'client',
                                        title: data.fullName || data.name,
                                        data: { ...data, commissions: filteredCommissions.filter(c => (c.employer_name || c.project_name || 'Unknown') === (data.fullName || data.name)) },
                                      });
                                    }}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Revenue Trend</CardTitle></CardHeader>
                          <CardContent>
                            {trendData.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-6">No trend data</p>
                            ) : (
                              <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={trendData}>
                                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                                  <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
                                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Client Overview</CardTitle></CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Client</TableHead>
                                <TableHead className="text-xs">Revenue</TableHead>
                                <TableHead className="text-xs">Commissions</TableHead>
                                <TableHead className="text-xs">Records</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(byClient)
                                .sort(([, a], [, b]) => b.revenue - a.revenue)
                                .slice(0, 15)
                                .map(([name, data]) => (
                                  <TableRow
                                    key={name}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => setDetail({
                                      type: 'client',
                                      title: name,
                                      data: { ...data, fullName: name, commissions: filteredCommissions.filter(c => (c.employer_name || c.project_name || 'Unknown') === name) },
                                    })}
                                  >
                                    <TableCell className="text-sm font-medium flex items-center gap-1.5">
                                      {name}
                                      {data.project_id && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                                    </TableCell>
                                    <TableCell className="text-sm">€{data.revenue.toLocaleString()}</TableCell>
                                    <TableCell className="text-sm">€{data.commissions.toLocaleString()}</TableCell>
                                    <TableCell className="text-sm">{data.contracts}</TableCell>
                                  </TableRow>
                                ))}
                              {Object.keys(byClient).length === 0 && (
                                <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">No data</TableCell></TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="team">
                    <div className="space-y-6">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                            <Trophy className="h-3.5 w-3.5 text-amber-500" /> Sales Leaderboard
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">Click a team member to view portfolio in panel</p>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {leaderboard.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">No data</p>
                          )}
                          {leaderboard.map(p => (
                            <div
                              key={p.name}
                              className={cn(
                                "p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors",
                                detail?.type === 'person' && detail.title === p.name ? "bg-primary/5 ring-1 ring-primary/20" : "bg-muted/50"
                              )}
                              onClick={() => setDetail({
                                type: 'person',
                                title: p.name,
                                data: {
                                  ...p,
                                  commissions: filteredCommissions.filter(c => (c.sales_person_name || 'Unassigned') === p.name),
                                },
                              })}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <span className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                                    p.rank === 1 ? "bg-amber-100 text-amber-800" :
                                    p.rank === 2 ? "bg-slate-200 text-slate-700" :
                                    p.rank === 3 ? "bg-orange-100 text-orange-800" :
                                    "bg-muted text-muted-foreground"
                                  )}>
                                    {p.rank}
                                  </span>
                                  <div>
                                    <p className="text-sm font-medium">{p.name}</p>
                                    <p className="text-xs text-muted-foreground">{p.contractCount} contracts · {p.deals} commissions</p>
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

                      <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Team Comparison</CardTitle></CardHeader>
                        <CardContent>
                          {comparisonData.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No data</p>
                          ) : (
                            <ResponsiveContainer width="100%" height={220}>
                              <BarChart data={comparisonData}>
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Bar dataKey="earned" fill="hsl(var(--chart-3))" name="Earned" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="pending" fill="hsl(var(--chart-4))" name="Pending" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="commissions">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">All Commissions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <SortableCommissionsTable
                          commissions={filteredCommissions}
                          onRowClick={(c) => setDetail({
                            type: 'commission',
                            title: c.contract_title || 'Commission',
                            data: c,
                          })}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {detail && (
              <div className="w-[35%] border-l bg-background overflow-y-auto flex-shrink-0 animate-in slide-in-from-right duration-200">
                <div className="p-4 border-b sticky top-0 bg-background z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground capitalize">{detail.type} Detail</p>
                      <h3 className="text-sm font-semibold">{detail.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {detail.type === 'client' && detail.data?.project_id && (
                        <button
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                          onClick={() => navigate(`/projects/${detail.data.project_id}?from=sales-analytics`)}
                        >
                          <FolderKanban className="h-3 w-3" /> Project
                        </button>
                      )}
                      {detail.type === 'commission' && detail.data?.project_id && (
                        <button
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                          onClick={() => navigate(`/projects/${detail.data.project_id}?from=sales-analytics`)}
                        >
                          <FolderKanban className="h-3 w-3" /> Project
                        </button>
                      )}
                      {detail.type === 'commission' && detail.data?.contract_id && (
                        <button
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                          onClick={() => navigate(`/contracts?highlight=${detail.data.contract_id}`)}
                        >
                          <FileText className="h-3 w-3" /> Contract
                        </button>
                      )}
                      <button onClick={() => setDetail(null)} className="text-xs text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {detail.type === 'commission' && detail.data && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                          <p className="text-lg font-bold">€{detail.data.commission_amount?.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Commission</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                          <p className="text-lg font-bold">{detail.data.contract_value ? `€${detail.data.contract_value.toLocaleString()}` : '—'}</p>
                          <p className="text-xs text-muted-foreground">Contract Value</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-xs text-muted-foreground">Status</span>
                        <Badge className={cn('text-xs', STATUS_COLORS[detail.data.commission_status] || 'bg-muted')}>
                          {detail.data.commission_status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-xs text-muted-foreground">Employer</span>
                        <span className="text-sm font-medium">{detail.data.employer_name || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-xs text-muted-foreground">Sales Person</span>
                        <span className="text-sm font-medium">{detail.data.sales_person_name || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-xs text-muted-foreground">Type</span>
                        <span className="text-sm">{detail.data.contract_type || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-xs text-muted-foreground">Date</span>
                        <span className="text-sm">{format(new Date(detail.data.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      {detail.data.original_amount != null && detail.data.original_amount !== detail.data.commission_amount && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-xs text-muted-foreground">Original Amount</span>
                          <span className="text-sm">€{detail.data.original_amount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {detail.type === 'client' && detail.data && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                          <p className="text-lg font-bold">€{detail.data.revenue?.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Revenue</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                          <p className="text-lg font-bold">€{detail.data.commissions?.reduce?.((s: number, c: any) => s + c.commission_amount, 0)?.toLocaleString() || detail.data.commissions_total?.toLocaleString() || '0'}</p>
                          <p className="text-xs text-muted-foreground">Commissions</p>
                        </div>
                      </div>
                      {detail.data.project_id && (
                        <button
                          className="w-full text-left p-3 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors flex items-center justify-between"
                          onClick={() => navigate(`/projects/${detail.data.project_id}?from=sales-analytics`)}
                        >
                          <span className="text-sm font-medium flex items-center gap-1.5">
                            <FolderKanban className="h-3.5 w-3.5 text-primary" /> Go to Project
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      )}
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Commission Records</p>
                        <div className="space-y-2">
                          {(detail.data.commissions as SalesCommissionSummary[])?.slice(0, 20).map(c => (
                            <div
                              key={c.id}
                              className="p-2.5 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => navigate(`/contracts?highlight=${c.contract_id}`)}
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">{c.contract_title || 'Untitled'}</p>
                                <p className="text-sm font-bold">€{c.commission_amount.toLocaleString()}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                <Badge className={cn('text-[10px] mr-1', STATUS_COLORS[c.commission_status] || 'bg-muted')}>
                                  {c.commission_status}
                                </Badge>
                                {format(new Date(c.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {detail.type === 'person' && detail.data && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
                          <p className="text-lg font-bold text-green-700">€{detail.data.earned?.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Earned</p>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-center">
                          <p className="text-lg font-bold text-amber-700">€{detail.data.pending?.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Pending</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-xs text-muted-foreground">Contracts</span>
                        <span className="text-sm font-medium">{detail.data.contractCount}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-xs text-muted-foreground">Commission Records</span>
                        <span className="text-sm font-medium">{detail.data.deals}</span>
                      </div>
                      <div className="pt-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">All Records</p>
                        <div className="space-y-2">
                          {(detail.data.commissions as SalesCommissionSummary[])?.map(c => (
                            <div
                              key={c.id}
                              className="p-2.5 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => navigate(`/contracts?highlight=${c.contract_id}`)}
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">{c.contract_title || '—'}</p>
                                <p className="text-sm font-bold">€{c.commission_amount.toLocaleString()}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {c.employer_name || '—'} ·
                                <Badge className={cn('text-[10px] mx-1', STATUS_COLORS[c.commission_status] || 'bg-muted')}>
                                  {c.commission_status}
                                </Badge>
                                {format(new Date(c.created_at), 'MMM d, yyyy')}
                                {c.project_id && (
                                  <button
                                    className="ml-1.5 text-primary hover:underline"
                                    onClick={(e) => { e.stopPropagation(); navigate(`/projects/${c.project_id}?from=sales-analytics`); }}
                                  >
                                    <FolderKanban className="h-3 w-3 inline" />
                                  </button>
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {detail.type === 'pipeline' && detail.data && (
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                        <span className="text-sm font-medium">Total Value</span>
                        <span className="text-lg font-bold">€{detail.data.total?.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{detail.data.contracts?.length} contracts</p>
                      <div className="space-y-2">
                        {detail.data.contracts?.map((c: Contract) => (
                          <div
                            key={c.id}
                            className="p-2.5 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => navigate(`/contracts?highlight=${c.id}`)}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{c.title}</p>
                              <p className="text-sm font-bold">{c.total_value ? `€${c.total_value.toLocaleString()}` : '—'}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {c.party_type} · {c.contract_type.replace(/_/g, ' ')}
                              {c.start_date && ` · ${format(new Date(c.start_date), 'MMM d, yyyy')}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}