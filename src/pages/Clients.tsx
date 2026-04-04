import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Handshake, Plus, Search, X, Users, UserCheck, DollarSign, AlertTriangle, TrendingUp, Settings2, Eye, Pencil, Trash2, ArrowUpDown, Download, Star } from 'lucide-react';
import { useClients, useUpdateClient, useDeleteClient, useStaffProfiles } from '@/hooks/useClients';
import { useClientsByStatus, useClientAcquisitionTrend } from '@/hooks/useClientAnalytics';
import { CLIENT_STATUS_CONFIG, CLIENT_TYPE_CONFIG, PRIORITY_LEVELS, PAYMENT_TERMS_OPTIONS, type ClientStatus, type ClientType, type ClientWithMetrics, isValidStatusTransition } from '@/types/client';
import { formatDistanceToNow } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const STATUS_COLORS: Record<string, string> = {
  lead: '#60a5fa',
  active: '#4ade80',
  on_hold: '#facc15',
  inactive: '#9ca3af',
  churned: '#f87171',
};

function getRiskColor(score: number | null | undefined) {
  if (!score) return '';
  if (score <= 3) return 'text-green-600';
  if (score <= 6) return 'text-amber-600';
  return 'text-red-600';
}

const Clients = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [riskRange, setRiskRange] = useState<string>('all');
  const [assignedTo, setAssignedTo] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedClient, setSelectedClient] = useState<ClientWithMetrics | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columnVisibility, setColumnVisibility] = useState({
    type: true,
    status: true,
    priority: true,
    risk: true,
    contact: false,
    projects: false,
    revenue: false,
    outstanding: true,
    lastActivity: true,
    paymentTerms: false,
    currency: false,
    assignedTo: false,
    contacts: false,
    created: false,
  });

  const { data: clients = [], isLoading } = useClients({
    status: statusFilter !== 'all' ? statusFilter as ClientStatus : undefined,
    client_type: typeFilter !== 'all' ? typeFilter as ClientType : undefined,
    search: search || undefined,
    priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    riskRange: riskRange !== 'all' ? riskRange : undefined,
    assignedTo: assignedTo !== 'all' ? assignedTo : undefined,
    sortBy,
    sortDirection,
  });

  const { data: statusData = [] } = useClientsByStatus();
  const { data: acquisitionData = [] } = useClientAcquisitionTrend();
  const { data: staffProfiles = [] } = useStaffProfiles();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const statusCounts = clients.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const totalRevenue = clients.reduce((sum, c) => sum + c.total_invoiced, 0);
  const totalOutstanding = clients.reduce((sum, c) => sum + c.outstanding_amount, 0);
  const avgRevenue = totalClients > 0 ? totalRevenue / totalClients : 0;
  const statusTotal = statusData.reduce((sum, d) => sum + d.count, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === clients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clients.map(c => c.id)));
    }
  };

  const handleBulkStatusChange = async (newStatus: ClientStatus) => {
    let success = 0, skipped = 0;
    for (const id of selectedIds) {
      const client = clients.find(c => c.id === id);
      if (client && isValidStatusTransition(client.status, newStatus)) {
        await updateClient.mutateAsync({ id, status: newStatus }).catch(() => { skipped++; });
        success++;
      } else {
        skipped++;
      }
    }
    toast({ title: `${success} updated, ${skipped} skipped` });
    setSelectedIds(new Set());
  };

  const handleBulkAssign = async (userId: string) => {
    for (const id of selectedIds) {
      await updateClient.mutateAsync({ id, assigned_to: userId }).catch(() => {});
    }
    toast({ title: `Assigned ${selectedIds.size} clients` });
    setSelectedIds(new Set());
  };

  const exportCSV = () => {
    const selected = clients.filter(c => selectedIds.has(c.id));
    const headers = ['Name', 'Type', 'Status', 'Priority', 'Risk Score', 'Payment Terms', 'Currency', 'Outstanding', 'Email', 'Phone', 'Created Date'];
    const rows = selected.map(c => [
      c.display_name,
      c.client_type,
      c.status,
      c.priority_level || '',
      c.risk_score?.toString() || '',
      c.payment_terms || '',
      c.currency || '',
      c.outstanding_amount.toString(),
      c.email || '',
      c.phone || '',
      c.created_at,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KPICard icon={Users} label="Total Clients" value={totalClients.toString()} />
            <KPICard icon={UserCheck} label="Active Clients" value={activeClients.toString()} className="text-green-600" />
            <KPICard icon={DollarSign} label="Total Revenue" value={`€${totalRevenue.toLocaleString()}`} className="text-blue-600" />
            <KPICard icon={AlertTriangle} label="Outstanding" value={`€${totalOutstanding.toLocaleString()}`} className={totalOutstanding > 0 ? 'text-red-600' : ''} />
            <KPICard icon={TrendingUp} label="Avg Revenue/Client" value={`€${Math.round(avgRevenue).toLocaleString()}`} className="text-purple-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Clients by Status</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                        {statusData.map((entry) => <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#9ca3af'} />)}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [value, CLIENT_STATUS_CONFIG[name as ClientStatus]?.label || name]} />
                      <Legend formatter={(value: string) => CLIENT_STATUS_CONFIG[value as ClientStatus]?.label || value} />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">{statusTotal}</text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Client Acquisition</CardTitle></CardHeader>
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
            <div className="flex gap-2 flex-wrap mb-3">
              <Badge variant="outline" className={`cursor-pointer ${statusFilter === 'all' ? 'bg-muted' : ''}`} onClick={() => setStatusFilter('all')}>All {clients.length}</Badge>
              {Object.entries(CLIENT_STATUS_CONFIG).map(([key, config]) => (
                <Badge key={key} variant="outline" className={`cursor-pointer ${statusFilter === key ? config.color : ''}`} onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}>
                  {config.label} {statusCounts[key] || 0}
                </Badge>
              ))}
            </div>

            {/* Priority filter badges */}
            <div className="flex gap-2 flex-wrap mb-4">
              <Badge variant="outline" className={`cursor-pointer ${priorityFilter === 'all' ? 'bg-muted' : ''}`} onClick={() => setPriorityFilter('all')}>All Priorities</Badge>
              {PRIORITY_LEVELS.map(p => (
                <Badge key={p.value} variant="outline" className={`cursor-pointer ${priorityFilter === p.value ? p.color : ''}`} onClick={() => setPriorityFilter(priorityFilter === p.value ? 'all' : p.value)}>
                  {p.value === 'vip' && <Star className="h-3 w-3 mr-1" />}{p.label}
                </Badge>
              ))}
            </div>

            {/* Search + filters */}
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskRange} onValueChange={setRiskRange}>
                <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Risk" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk</SelectItem>
                  <SelectItem value="low">Low (1-3)</SelectItem>
                  <SelectItem value="medium">Medium (4-6)</SelectItem>
                  <SelectItem value="high">High (7-10)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Assigned To" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {staffProfiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || 'Unknown'}</SelectItem>)}
                </SelectContent>
              </Select>
              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1 text-xs"><ArrowUpDown className="h-3.5 w-3.5" /> Sort</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {[
                    { label: 'Name (A-Z)', sort: 'name', dir: 'asc' as const },
                    { label: 'Name (Z-A)', sort: 'name', dir: 'desc' as const },
                    { label: 'Newest', sort: 'created_at', dir: 'desc' as const },
                    { label: 'Oldest', sort: 'created_at', dir: 'asc' as const },
                    { label: 'Risk (High→Low)', sort: 'risk_score', dir: 'desc' as const },
                    { label: 'Risk (Low→High)', sort: 'risk_score', dir: 'asc' as const },
                    { label: 'Outstanding (High→Low)', sort: 'outstanding_amount', dir: 'desc' as const },
                    { label: 'Outstanding (Low→High)', sort: 'outstanding_amount', dir: 'asc' as const },
                  ].map(opt => (
                    <DropdownMenuCheckboxItem key={`${opt.sort}-${opt.dir}`} checked={sortBy === opt.sort && sortDirection === opt.dir} onCheckedChange={() => { setSortBy(opt.sort); setSortDirection(opt.dir); }}>
                      {opt.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9"><Settings2 className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {Object.entries({ type: 'Type', status: 'Status', priority: 'Priority', risk: 'Risk', contact: 'Contact', projects: 'Projects', revenue: 'Revenue', outstanding: 'Outstanding', lastActivity: 'Last Activity', paymentTerms: 'Payment Terms', currency: 'Currency', assignedTo: 'Assigned To', contacts: 'Contacts', created: 'Created' }).map(([key, label]) => (
                    <DropdownMenuCheckboxItem key={key} checked={columnVisibility[key as keyof typeof columnVisibility]} onCheckedChange={(checked) => setColumnVisibility(prev => ({ ...prev, [key]: !!checked }))}>
                      {label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Bulk actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 mt-3 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">{selectedIds.size} selected</span>
                {can('editClients') && (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Change Status</Button></DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {Object.entries(CLIENT_STATUS_CONFIG).map(([key, config]) => (
                          <DropdownMenuCheckboxItem key={key} onCheckedChange={() => handleBulkStatusChange(key as ClientStatus)}>{config.label}</DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Assign To</Button></DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {staffProfiles.map(p => (
                          <DropdownMenuCheckboxItem key={p.user_id} onCheckedChange={() => handleBulkAssign(p.user_id)}>{p.full_name || 'Unknown'}</DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
                <Button variant="outline" size="sm" className="gap-1" onClick={exportCSV}><Download className="h-3.5 w-3.5" /> Export CSV</Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
              </div>
            )}
          </div>

          {/* Split panel area */}
          <div className="flex overflow-hidden" style={{ minHeight: '500px' }}>
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
                        <th className="px-3 py-2 w-10"><Checkbox checked={selectedIds.size === clients.length && clients.length > 0} onCheckedChange={toggleSelectAll} /></th>
                        <th className="text-left px-4 py-2 font-medium">Name</th>
                        {columnVisibility.type && <th className="text-left px-4 py-2 font-medium">Type</th>}
                        {columnVisibility.status && <th className="text-left px-4 py-2 font-medium">Status</th>}
                        {columnVisibility.priority && <th className="text-left px-4 py-2 font-medium">Priority</th>}
                        {columnVisibility.risk && <th className="text-center px-4 py-2 font-medium">Risk</th>}
                        {columnVisibility.contact && <th className="text-left px-4 py-2 font-medium">Contact</th>}
                        {columnVisibility.projects && <th className="text-right px-4 py-2 font-medium">Projects</th>}
                        {columnVisibility.revenue && <th className="text-right px-4 py-2 font-medium">Revenue</th>}
                        {columnVisibility.outstanding && <th className="text-right px-4 py-2 font-medium">Outstanding</th>}
                        {columnVisibility.lastActivity && <th className="text-left px-4 py-2 font-medium">Last Activity</th>}
                        {columnVisibility.paymentTerms && <th className="text-left px-4 py-2 font-medium">Terms</th>}
                        {columnVisibility.currency && <th className="text-left px-4 py-2 font-medium">Currency</th>}
                        {columnVisibility.contacts && <th className="text-center px-4 py-2 font-medium">Contacts</th>}
                        {columnVisibility.created && <th className="text-left px-4 py-2 font-medium">Created</th>}
                        <th className="px-4 py-2 w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client) => {
                        const priorityConfig = PRIORITY_LEVELS.find(p => p.value === client.priority_level);
                        return (
                          <tr
                            key={client.id}
                            onClick={() => setSelectedClient(client)}
                            className={`border-b cursor-pointer hover:bg-muted/30 transition-colors group ${selectedClient?.id === client.id ? 'bg-muted/50' : ''}`}
                          >
                            <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                              <Checkbox checked={selectedIds.has(client.id)} onCheckedChange={() => toggleSelect(client.id)} />
                            </td>
                            <td className="px-4 py-3 font-medium">{client.display_name}</td>
                            {columnVisibility.type && (
                              <td className="px-4 py-3"><Badge variant="outline" className={CLIENT_TYPE_CONFIG[client.client_type]?.color}>{CLIENT_TYPE_CONFIG[client.client_type]?.label}</Badge></td>
                            )}
                            {columnVisibility.status && (
                              <td className="px-4 py-3"><Badge variant="outline" className={CLIENT_STATUS_CONFIG[client.status]?.color}>{CLIENT_STATUS_CONFIG[client.status]?.label}</Badge></td>
                            )}
                            {columnVisibility.priority && (
                              <td className="px-4 py-3">
                                {priorityConfig ? (
                                  <Badge className={priorityConfig.color}>
                                    {priorityConfig.value === 'vip' && <Star className="h-3 w-3 mr-1" />}
                                    {priorityConfig.label}
                                  </Badge>
                                ) : <span className="text-muted-foreground">—</span>}
                              </td>
                            )}
                            {columnVisibility.risk && (
                              <td className={`px-4 py-3 text-center font-medium ${getRiskColor(client.risk_score)}`}>{client.risk_score || '—'}</td>
                            )}
                            {columnVisibility.contact && <td className="px-4 py-3 text-muted-foreground">{client.email || '—'}</td>}
                            {columnVisibility.projects && <td className="px-4 py-3 text-right">{client.project_count}</td>}
                            {columnVisibility.revenue && <td className="px-4 py-3 text-right">€{client.total_invoiced.toLocaleString()}</td>}
                            {columnVisibility.outstanding && (
                              <td className={`px-4 py-3 text-right font-medium ${client.outstanding_amount > 0 ? 'text-destructive' : ''}`}>
                                {client.currency || '€'}{client.outstanding_amount.toLocaleString()}
                              </td>
                            )}
                            {columnVisibility.lastActivity && (
                              <td className="px-4 py-3 text-muted-foreground text-xs">
                                {client.last_activity ? formatDistanceToNow(new Date(client.last_activity), { addSuffix: true }) : '—'}
                              </td>
                            )}
                            {columnVisibility.paymentTerms && (
                              <td className="px-4 py-3 text-xs">{PAYMENT_TERMS_OPTIONS.find(p => p.value === client.payment_terms)?.label || '—'}</td>
                            )}
                            {columnVisibility.currency && <td className="px-4 py-3 text-xs">{client.currency || '—'}</td>}
                            {columnVisibility.contacts && (
                              <td className="px-4 py-3 text-center">{client.contact_count ? <Badge variant="outline">{client.contact_count}</Badge> : '—'}</td>
                            )}
                            {columnVisibility.created && (
                              <td className="px-4 py-3 text-muted-foreground text-xs">{formatDistanceToNow(new Date(client.created_at), { addSuffix: true })}</td>
                            )}
                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/clients/${client.id}`)}><Eye className="h-3.5 w-3.5" /></Button>
                                {can('editClients') && (
                                  <>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/clients/${client.id}/edit`)}><Pencil className="h-3.5 w-3.5" /></Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Client</AlertDialogTitle>
                                          <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => deleteClient.mutate(client.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
                  <Button variant="ghost" size="icon" onClick={() => setSelectedClient(null)}><X className="h-4 w-4" /></Button>
                </div>
                <div className="flex gap-2 mb-4 flex-wrap">
                  <Badge variant="outline" className={CLIENT_TYPE_CONFIG[selectedClient.client_type]?.color}>{CLIENT_TYPE_CONFIG[selectedClient.client_type]?.label}</Badge>
                  <Badge variant="outline" className={CLIENT_STATUS_CONFIG[selectedClient.status]?.color}>{CLIENT_STATUS_CONFIG[selectedClient.status]?.label}</Badge>
                  {selectedClient.priority_level && selectedClient.priority_level !== 'standard' && (
                    <Badge className={PRIORITY_LEVELS.find(p => p.value === selectedClient.priority_level)?.color || ''}>
                      {PRIORITY_LEVELS.find(p => p.value === selectedClient.priority_level)?.label}
                    </Badge>
                  )}
                </div>
                <div className="space-y-3 text-sm">
                  {selectedClient.email && <div><span className="text-muted-foreground">Email:</span> {selectedClient.email}</div>}
                  {selectedClient.phone && <div><span className="text-muted-foreground">Phone:</span> {selectedClient.phone}</div>}
                  {selectedClient.risk_score && <div><span className="text-muted-foreground">Risk:</span> <span className={getRiskColor(selectedClient.risk_score)}>{selectedClient.risk_score}/10</span></div>}
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
                  <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/clients/${selectedClient.id}`)}>View Details</Button>
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
