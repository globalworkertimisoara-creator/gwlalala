import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  useClientsByStatus,
  useClientRevenueByClient,
  useClientAcquisitionTrend,
  useTopClients,
} from '@/hooks/useClientAnalytics';
import { useClients } from '@/hooks/useClients';
import { Handshake, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import type { AnalyticsDetailItem } from '@/pages/Analytics';

interface ClientAnalyticsProps {
  onOpenDetail?: (item: AnalyticsDetailItem) => void;
}

const STATUS_COLORS: Record<string, string> = {
  lead: '#3B82F6',
  active: '#10B981',
  on_hold: '#F59E0B',
  inactive: '#6B7280',
  churned: '#EF4444',
};

const TYPE_COLORS: Record<string, string> = {
  company: '#8B5CF6',
  individual: '#6366F1',
};

export default function ClientAnalytics({ onOpenDetail }: ClientAnalyticsProps) {
  const { data: byStatus = [] } = useClientsByStatus();
  const { data: allClients = [] } = useClients();
  const { data: revenueByClient = [] } = useClientRevenueByClient();
  const { data: acquisitionTrend = [] } = useClientAcquisitionTrend();
  const { data: topClients = [] } = useTopClients(20);

  const totalClients = allClients.length;
  const activeClients = allClients.filter(c => c.status === 'active').length;
  const totalRevenue = topClients.reduce((sum, c) => sum + c.total_invoiced, 0);
  const totalOutstanding = topClients.reduce((sum, c) => sum + c.outstanding_amount, 0);
  const avgRevenue = totalClients > 0 ? totalRevenue / totalClients : 0;

  const byType = Object.entries(
    allClients.reduce((acc, c) => {
      acc[c.client_type] = (acc[c.client_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, count]) => ({ type, count }));

  const outstandingClients = topClients
    .filter(c => c.outstanding_amount > 0)
    .sort((a, b) => b.outstanding_amount - a.outstanding_amount)
    .slice(0, 10);

  const handleClientClick = (client: any) => {
    onOpenDetail?.({
      type: 'client',
      id: client.id,
      title: client.display_name || client.name,
      backLabel: 'Client Analytics',
      data: client,
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard icon={Handshake} label="Total Clients" value={totalClients} />
        <SummaryCard icon={TrendingUp} label="Active Clients" value={activeClients} color="text-green-600" />
        <SummaryCard icon={DollarSign} label="Total Revenue" value={`€${totalRevenue.toLocaleString()}`} />
        <SummaryCard icon={AlertTriangle} label="Outstanding" value={`€${totalOutstanding.toLocaleString()}`} color="text-destructive" />
        <SummaryCard icon={DollarSign} label="Avg Revenue" value={`€${Math.round(avgRevenue).toLocaleString()}`} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Clients by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={byStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={40}
                  label={(e) => `${e.count}`}
                  labelLine={false}
                >
                  {byStatus.map((entry: any, i: number) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-background p-2 rounded-lg shadow-lg border text-sm">
                        <p className="font-semibold capitalize">{d.status}</p>
                        <p className="text-lg font-bold">{d.count}</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Legend formatter={(v) => String(v).charAt(0).toUpperCase() + String(v).slice(1).replace('_', ' ')} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Clients by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={byType}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={40}
                  label={(e) => `${e.count}`}
                  labelLine={false}
                >
                  {byType.map((entry, i) => (
                    <Cell key={i} fill={TYPE_COLORS[entry.type] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend formatter={(v) => String(v).charAt(0).toUpperCase() + String(v).slice(1)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Acquisition Trend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Client Acquisition Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={acquisitionTrend}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="company" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} name="Company" />
              <Area type="monotone" dataKey="individual" stackId="1" stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} name="Individual" />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue + Outstanding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Top 10 by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByClient} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} style={{ cursor: 'pointer' }}
                  onClick={(d) => handleClientClick({ id: d.id, display_name: d.name, total_invoiced: d.total })} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Top Outstanding Amounts</CardTitle>
          </CardHeader>
          <CardContent>
            {outstandingClients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No outstanding amounts</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={outstandingClients} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="display_name" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `€${v.toLocaleString()}`} />
                  <Bar dataKey="outstanding_amount" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Clients Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Top Clients by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">#</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Name</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Type</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Revenue</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((client, i) => (
                  <tr
                    key={client.id}
                    className="border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleClientClick(client)}
                  >
                    <td className="py-2.5 px-3 text-sm text-muted-foreground">{i + 1}</td>
                    <td className="py-2.5 px-3 text-sm font-medium">{client.display_name}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="text-[10px] capitalize">{client.client_type}</Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="text-[10px] capitalize">{client.status}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-sm text-right font-medium">€{client.total_invoiced.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-sm text-right">
                      {client.outstanding_amount > 0 ? (
                        <span className="text-destructive font-medium">€{client.outstanding_amount.toLocaleString()}</span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-muted ${color || ''}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
