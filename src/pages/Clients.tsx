import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Handshake, Plus, Search, X, Users, UserCheck, DollarSign, AlertTriangle, TrendingUp, Settings2 } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { useClientsByStatus, useClientAcquisitionTrend } from '@/hooks/useClientAnalytics';
import { CLIENT_STATUS_CONFIG, CLIENT_TYPE_CONFIG, type ClientStatus, type ClientType, type ClientWithMetrics } from '@/types/client';
import { formatDistanceToNow } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  lead: '#60a5fa',
  active: '#4ade80',
  on_hold: '#facc15',
  inactive: '#9ca3af',
  churned: '#f87171',
};

const Clients = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<ClientWithMetrics | null>(null);
  const [columnVisibility, setColumnVisibility] = useState({
    type: true,
    status: true,
    contact: true,
    projects: true,
    revenue: true,
    created: true,
  });

  const { data: clients = [], isLoading } = useClients({
    status: statusFilter !== 'all' ? statusFilter as ClientStatus : undefined,
    client_type: typeFilter !== 'all' ? typeFilter as ClientType : undefined,
    search: search || undefined,
  });

  const { data: statusData = [] } = useClientsByStatus();
  const { data: acquisitionData = [] } = useClientAcquisitionTrend();

  const statusCounts = clients.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // KPI calculations
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const totalRevenue = clients.reduce((sum, c) => sum + c.total_invoiced, 0);
  const totalOutstanding = clients.reduce((sum, c) => sum + c.outstanding_amount, 0);
  const avgRevenue = totalClients > 0 ? totalRevenue / totalClients : 0;

  const statusTotal = statusData.reduce((sum, d) => sum + d.count, 0);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] overflow-y-auto">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Handshake className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Clients</h1>
                <p className="text-sm text-muted-foreground">Manage company and individual clients</p>
              </div>
            </div>
            <Button onClick={() => navigate('/clients/new')} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Add Client
            </Button>
          </div>
        </div>

        {/* TOP ZONE: Dashboard Overview */}
        <div className="px-6 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KPICard icon={Users} label="Total Clients" value={totalClients.toString()} />
            <KPICard icon={UserCheck} label="Active Clients" value={activeClients.toString()} className="text-green-600" />
            <KPICard icon={DollarSign} label="Total Revenue" value={`€${totalRevenue.toLocaleString()}`} className="text-blue-600" />
            <KPICard icon={AlertTriangle} label="Outstanding" value={`€${totalOutstanding.toLocaleString()}`} className={totalOutstanding > 0 ? 'text-red-600' : ''} />
            <KPICard icon={TrendingUp} label="Avg Revenue/Client" value={`€${Math.round(avgRevenue).toLocaleString()}`} className="text-purple-600" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Pie Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Clients by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {statusData.map((entry) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#9ca3af'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [value, CLIENT_STATUS_CONFIG[name as ClientStatus]?.label || name]} />
                      <Legend formatter={(value: string) => CLIENT_STATUS_CONFIG[value as ClientStatus]?.label || value} />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
                        {statusTotal}
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Acquisition Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Client Acquisition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={acquisitionData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="company" stackId="1" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} name="Company" />
                      <Area type="monotone" dataKey="individual" stackId="1" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} name="Individual" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* BOTTOM ZONE: Client Management */}
        <div className="border-t mt-6">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Client Management</h2>
              <Button onClick={() => navigate('/clients/new')} size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Add Client
              </Button>
            </div>

            {/* Status filter badges */}
            <div className="flex gap-2 flex-wrap mb-4">
              <Badge variant="outline" className={`cursor-pointer ${statusFilter === 'all' ? 'bg-muted' : ''}`} onClick={() => setStatusFilter('all')}>
                All {clients.length}
              </Badge>
              {Object.entries(CLIENT_STATUS_CONFIG).map(([key, config]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className={`cursor-pointer ${statusFilter === key ? config.color : ''}`}
                  onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                >
                  {config.label} {statusCounts[key] || 0}
                </Badge>
              ))}
            </div>

            {/* Search + Type filter + Column toggle */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {Object.entries({ type: 'Type', status: 'Status', contact: 'Contact', projects: 'Projects', revenue: 'Revenue', created: 'Created' }).map(([key, label]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={columnVisibility[key as keyof typeof columnVisibility]}
                      onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, [key]: !!checked }))}
                    >
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Split panel area */}
          <div className="flex overflow-hidden" style={{ minHeight: '500px' }}>
            {/* Left: table */}
            <div className={`flex-1 overflow-y-auto px-6 ${selectedClient ? 'max-w-[65%]' : ''}`}>
              {isLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading clients...</p>
              ) : clients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No clients found</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-2 font-medium">Name</th>
                        {columnVisibility.type && <th className="text-left px-4 py-2 font-medium">Type</th>}
                        {columnVisibility.status && <th className="text-left px-4 py-2 font-medium">Status</th>}
                        {columnVisibility.contact && <th className="text-left px-4 py-2 font-medium">Contact</th>}
                        {columnVisibility.projects && <th className="text-right px-4 py-2 font-medium">Projects</th>}
                        {columnVisibility.revenue && <th className="text-right px-4 py-2 font-medium">Revenue</th>}
                        {columnVisibility.created && <th className="text-left px-4 py-2 font-medium">Created</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client) => (
                        <tr
                          key={client.id}
                          onClick={() => setSelectedClient(client)}
                          className={`border-b cursor-pointer hover:bg-muted/30 transition-colors ${selectedClient?.id === client.id ? 'bg-muted/50' : ''}`}
                        >
                          <td className="px-4 py-3 font-medium">{client.display_name}</td>
                          {columnVisibility.type && (
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={CLIENT_TYPE_CONFIG[client.client_type]?.color}>
                                {CLIENT_TYPE_CONFIG[client.client_type]?.label}
                              </Badge>
                            </td>
                          )}
                          {columnVisibility.status && (
                            <td className="px-4 py-3">
                              <Badge variant="outline" className={CLIENT_STATUS_CONFIG[client.status]?.color}>
                                {CLIENT_STATUS_CONFIG[client.status]?.label}
                              </Badge>
                            </td>
                          )}
                          {columnVisibility.contact && <td className="px-4 py-3 text-muted-foreground">{client.email || '—'}</td>}
                          {columnVisibility.projects && <td className="px-4 py-3 text-right">{client.project_count}</td>}
                          {columnVisibility.revenue && <td className="px-4 py-3 text-right">€{client.total_invoiced.toLocaleString()}</td>}
                          {columnVisibility.created && (
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {formatDistanceToNow(new Date(client.created_at), { addSuffix: true })}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right: detail panel */}
            {selectedClient && (
              <div className="w-[35%] border-l bg-background overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg">{selectedClient.display_name}</h2>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedClient(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2 mb-4">
                  <Badge variant="outline" className={CLIENT_TYPE_CONFIG[selectedClient.client_type]?.color}>
                    {CLIENT_TYPE_CONFIG[selectedClient.client_type]?.label}
                  </Badge>
                  <Badge variant="outline" className={CLIENT_STATUS_CONFIG[selectedClient.status]?.color}>
                    {CLIENT_STATUS_CONFIG[selectedClient.status]?.label}
                  </Badge>
                </div>
                <div className="space-y-3 text-sm">
                  {selectedClient.email && <div><span className="text-muted-foreground">Email:</span> {selectedClient.email}</div>}
                  {selectedClient.phone && <div><span className="text-muted-foreground">Phone:</span> {selectedClient.phone}</div>}
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <div className="border rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold">{selectedClient.project_count}</p>
                      <p className="text-xs text-muted-foreground">Projects</p>
                    </div>
                    <div className="border rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold">€{selectedClient.total_invoiced.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/clients/${selectedClient.id}`)}>
                    View Details
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

function KPICard({ icon: Icon, label, value, className = '' }: { icon: any; label: string; value: string; className?: string }) {
  return (
    <Card className="flex-1">
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className={`h-4 w-4 ${className || 'text-primary'}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Clients;
