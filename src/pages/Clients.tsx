import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Handshake, Plus, Search, X } from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { CLIENT_STATUS_CONFIG, CLIENT_TYPE_CONFIG, type ClientStatus, type ClientType, type ClientWithMetrics } from '@/types/client';
import { formatDistanceToNow } from 'date-fns';

const Clients = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<ClientWithMetrics | null>(null);

  const { data: clients = [], isLoading } = useClients({
    status: statusFilter !== 'all' ? statusFilter as ClientStatus : undefined,
    client_type: typeFilter !== 'all' ? typeFilter as ClientType : undefined,
    search: search || undefined,
  });

  const statusCounts = clients.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] flex overflow-hidden">
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${selectedClient ? 'max-w-[65%]' : ''}`}>
          <div className="px-6 pt-6 pb-4 border-b bg-background">
            <div className="flex items-center justify-between mb-4">
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

            <div className="flex gap-2 flex-wrap mb-4">
              <Badge variant="outline" className="cursor-pointer" onClick={() => setStatusFilter('all')}>
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
            </div>
          </div>

          <div className="p-6">
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
                      <th className="text-left px-4 py-2 font-medium">Type</th>
                      <th className="text-left px-4 py-2 font-medium">Status</th>
                      <th className="text-left px-4 py-2 font-medium">Contact</th>
                      <th className="text-right px-4 py-2 font-medium">Projects</th>
                      <th className="text-right px-4 py-2 font-medium">Revenue</th>
                      <th className="text-left px-4 py-2 font-medium">Created</th>
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
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={CLIENT_TYPE_CONFIG[client.client_type]?.color}>
                            {CLIENT_TYPE_CONFIG[client.client_type]?.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={CLIENT_STATUS_CONFIG[client.status]?.color}>
                            {CLIENT_STATUS_CONFIG[client.status]?.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{client.email || '—'}</td>
                        <td className="px-4 py-3 text-right">{client.project_count}</td>
                        <td className="px-4 py-3 text-right">€{client.total_invoiced.toLocaleString()}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(client.created_at), { addSuffix: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

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
    </AppLayout>
  );
};

export default Clients;
