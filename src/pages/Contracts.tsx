import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import { useContracts, useExpiringContracts, useCreateContract, type CreateContractInput, type Contract } from '@/hooks/useContracts';
import { useSalesStaff } from '@/hooks/useSalesCommissions';
import { ContractDetailDialog } from '@/components/contracts/ContractDetailDialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800',
  signed: 'bg-green-100 text-green-800',
  active: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-destructive/10 text-destructive',
  terminated: 'bg-red-100 text-red-800',
};

const typeLabels: Record<string, string> = {
  employer_agreement: 'Employer Agreement',
  agency_agreement: 'Agency Agreement',
  worker_contract: 'Worker Contract',
  service_agreement: 'Service Agreement',
};

export default function Contracts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const highlightId = searchParams.get('highlight');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const filters: any = {};
  if (typeFilter !== 'all') filters.contract_type = typeFilter;
  if (statusFilter !== 'all') filters.status = statusFilter;

  const { data: contracts = [], isLoading } = useContracts(Object.keys(filters).length > 0 ? filters : undefined);
  const { data: expiring = [] } = useExpiringContracts(30);
  const createContract = useCreateContract();
  const { data: salesStaff = [] } = useSalesStaff();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState<CreateContractInput>({
    contract_type: 'employer_agreement',
    party_type: 'employer',
    party_id: '',
    title: '',
  });

  // Auto-open highlighted contract from query param
  useEffect(() => {
    if (highlightId && contracts.length > 0 && !detailOpen) {
      const found = contracts.find(c => c.id === highlightId);
      if (found) {
        setSelectedContract(found);
        setDetailOpen(true);
      }
    }
  }, [highlightId, contracts]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.party_id.trim()) return;
    await createContract.mutateAsync(form);
    setForm({ contract_type: 'employer_agreement', party_type: 'employer', party_id: '', title: '' });
    setDialogOpen(false);
  };

  const handleDetailClose = (open: boolean) => {
    setDetailOpen(open);
    if (!open && highlightId) {
      setSearchParams({}, { replace: true });
    }
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Back link when coming from Sales Analytics */}
        {highlightId && (
          <Button
            variant="ghost"
            className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/sales-analytics')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sales Analytics
          </Button>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Contract Management</h1>
            <p className="text-muted-foreground">Track agreements with agencies, employers, and workers</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New Contract</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Contract</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Contract Type</Label>
                    <Select value={form.contract_type} onValueChange={v => setForm(p => ({ ...p, contract_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employer_agreement">Employer Agreement</SelectItem>
                        <SelectItem value="agency_agreement">Agency Agreement</SelectItem>
                        <SelectItem value="worker_contract">Worker Contract</SelectItem>
                        <SelectItem value="service_agreement">Service Agreement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Party Type</Label>
                    <Select value={form.party_type} onValueChange={v => setForm(p => ({ ...p, party_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employer">Employer</SelectItem>
                        <SelectItem value="agency">Agency</SelectItem>
                        <SelectItem value="worker">Worker</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Party ID</Label>
                  <Input value={form.party_id} onChange={e => setForm(p => ({ ...p, party_id: e.target.value }))} placeholder="UUID of the company, agency, or candidate" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" value={form.start_date || ''} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input type="date" value={form.end_date || ''} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Value</Label>
                    <Input type="number" value={form.total_value || ''} onChange={e => setForm(p => ({ ...p, total_value: parseFloat(e.target.value) || undefined }))} />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Input value={form.currency || 'EUR'} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Sales Person</Label>
                  <Select value={(form as any).sales_person_id || 'none'} onValueChange={v => setForm(p => ({ ...p, sales_person_id: v === 'none' ? undefined : v } as any))}>
                    <SelectTrigger><SelectValue placeholder="Select sales person" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {salesStaff.map(s => (
                        <SelectItem key={s.user_id} value={s.user_id}>{s.full_name || s.user_id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={createContract.isPending}>
                    {createContract.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Contract
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Expiring Contracts Alert */}
        {expiring.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">{expiring.length} contract{expiring.length > 1 ? 's' : ''} expiring within 30 days</p>
              </div>
              <div className="mt-2 space-y-1">
                {expiring.slice(0, 3).map(c => (
                  <p key={c.id} className="text-sm text-amber-700">
                    {c.title} — expires {format(new Date(c.end_date!), 'MMM d, yyyy')}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="employer_agreement">Employer Agreement</SelectItem>
                  <SelectItem value="agency_agreement">Agency Agreement</SelectItem>
                  <SelectItem value="worker_contract">Worker Contract</SelectItem>
                  <SelectItem value="service_agreement">Service Agreement</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contracts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No contracts found</p>
                <p className="text-sm">Create your first contract to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map(c => (
                      <TableRow key={c.id} className={cn("hover:bg-muted/50 cursor-pointer", highlightId === c.id && "ring-2 ring-primary/50 bg-primary/5")} onClick={() => { setSelectedContract(c); setDetailOpen(true); }}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {c.title}
                          </div>
                        </TableCell>
                        <TableCell>{typeLabels[c.contract_type] || c.contract_type}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{c.party_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[c.status] || 'bg-muted'}>{c.status}</Badge>
                        </TableCell>
                        <TableCell>{c.total_value ? `${c.total_value.toLocaleString()} ${c.currency}` : '—'}</TableCell>
                        <TableCell>{c.start_date ? format(new Date(c.start_date), 'MMM d, yyyy') : '—'}</TableCell>
                        <TableCell>{c.end_date ? format(new Date(c.end_date), 'MMM d, yyyy') : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        <ContractDetailDialog contract={selectedContract} open={detailOpen} onOpenChange={setDetailOpen} />
      </div>
    </AppLayout>
  );
}
