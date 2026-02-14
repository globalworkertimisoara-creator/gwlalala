import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DollarSign, Plus, FileText, History, MessageSquare,
  Loader2, AlertTriangle, Milestone,
} from 'lucide-react';
import { PaymentMilestones } from '@/components/billing/PaymentMilestones';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import {
  useBillingRecords, useBillingPayments, useBillingChangeLog,
  useBillingNotes, useCreateBillingRecord, useUpdateBillingRecord,
  useCreateBillingPayment, useAddBillingNote,
  type BillingRecord,
} from '@/hooks/useBilling';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  agreed: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  disputed: 'bg-destructive/10 text-destructive',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-destructive/10 text-destructive',
  refunded: 'bg-violet-100 text-violet-800',
};

export default function Billing() {
  const { user, isAdmin } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: records = [], isLoading } = useBillingRecords();

  if (!can('viewBilling')) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view billing.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="h-7 w-7" />
              Billing
            </h1>
            <p className="text-muted-foreground">
              Track candidate payments, payment milestones, and billing agreements
            </p>
          </div>
          {can('manageBilling') && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> New Billing Record
                </Button>
              </DialogTrigger>
              <CreateBillingDialog onClose={() => setShowCreateDialog(false)} />
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Records list */}
          <div className="xl:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Billing Records</CardTitle>
                <CardDescription>{records.length} records</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : records.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No billing records yet</p>
                  ) : (
                    <div className="divide-y">
                      {records.map((record) => (
                        <button
                          key={record.id}
                          onClick={() => setSelectedRecord(record)}
                          className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors ${
                            selectedRecord?.id === record.id ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm truncate">
                              {(record.candidate as any)?.full_name || 'Unknown Candidate'}
                            </span>
                            <Badge className={`text-[10px] ${STATUS_COLORS[record.status] || ''}`}>
                              {record.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground truncate">
                              {(record.agency as any)?.company_name || 'Unknown Agency'}
                            </span>
                            <span className="text-sm font-semibold">
                              {Number(record.total_amount).toLocaleString()} {record.currency}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(record.created_at), 'dd MMM yyyy')}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Detail panel */}
          <div className="xl:col-span-2">
            {selectedRecord ? (
              <BillingDetail record={selectedRecord} onUpdate={setSelectedRecord} />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-[600px]">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a billing record to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function BillingDetail({ record, onUpdate }: { record: BillingRecord; onUpdate: (r: BillingRecord) => void }) {
  const { can } = usePermissions();
  const { data: payments = [] } = useBillingPayments(record.id);
  const { data: changeLog = [] } = useBillingChangeLog(record.id);
  const { data: notes = [] } = useBillingNotes(record.id);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPercentage = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.percentage), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {(record.candidate as any)?.full_name}
            </CardTitle>
            <CardDescription>
              {(record.agency as any)?.company_name}
              {record.job && ` • ${(record.job as any)?.title}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={STATUS_COLORS[record.status] || ''}>
              {record.status}
            </Badge>
            {can('manageBilling') && (
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">Edit</Button>
                </DialogTrigger>
                <EditBillingDialog
                  record={record}
                  onClose={() => setShowEditDialog(false)}
                  onUpdated={onUpdate}
                />
              </Dialog>
            )}
          </div>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className="text-lg font-bold">{Number(record.total_amount).toLocaleString()} {record.currency}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-lg font-bold text-green-700">{totalPaid.toLocaleString()} {record.currency}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="text-lg font-bold">{Math.min(totalPercentage, 100).toFixed(1)}%</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="payments">
              <DollarSign className="h-4 w-4 mr-1" /> Payments
            </TabsTrigger>
            <TabsTrigger value="log">
              <History className="h-4 w-4 mr-1" /> Change Log
            </TabsTrigger>
            <TabsTrigger value="notes">
              <MessageSquare className="h-4 w-4 mr-1" /> Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-4">
            <PaymentMilestones
              billingRecordId={record.id}
              totalAmount={Number(record.total_amount)}
              currency={record.currency}
              payments={payments}
            />
          </TabsContent>

          <TabsContent value="log" className="mt-4">
            <ScrollArea className="h-[380px]">
              <div className="space-y-3">
                {changeLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No changes logged</p>
                ) : (
                  changeLog.map((log) => (
                    <div key={log.id} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{log.action}</Badge>
                          <span className="text-xs font-medium">{log.changed_by_name}</span>
                          <Badge variant="secondary" className="text-[10px]">{log.changed_by_role}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), 'dd MMM yyyy HH:mm')}
                        </span>
                      </div>
                      {log.field_changed && (
                        <p className="text-xs">
                          <span className="text-muted-foreground">{log.field_changed}:</span>{' '}
                          <span className="line-through text-destructive">{log.old_value}</span>{' → '}
                          <span className="text-green-700">{log.new_value}</span>
                        </p>
                      )}
                      {log.note && <p className="text-xs text-muted-foreground">{log.note}</p>}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <BillingNotesSection billingRecordId={record.id} notes={notes} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function BillingNotesSection({ billingRecordId, notes }: { billingRecordId: string; notes: any[] }) {
  const [content, setContent] = useState('');
  const addNote = useAddBillingNote();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim()) return;
    try {
      await addNote.mutateAsync({ billing_record_id: billingRecordId, content: content.trim() });
      setContent('');
      toast({ title: 'Note added' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[60px]"
        />
        <Button onClick={handleSubmit} disabled={addNote.isPending || !content.trim()} className="shrink-0">
          {addNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
        </Button>
      </div>
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{note.created_by_name}</span>
                    <Badge variant="secondary" className="text-[10px]">{note.created_by_role}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(note.created_at), 'dd MMM yyyy HH:mm')}
                  </span>
                </div>
                <p className="text-sm">{note.content}</p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function CreateBillingDialog({ onClose }: { onClose: () => void }) {
  const createRecord = useCreateBillingRecord();
  const { toast } = useToast();
  const [candidateId, setCandidateId] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [description, setDescription] = useState('');

  // Fetch candidates and agencies for dropdowns
  const { data: candidates = [] } = useQuery({
    queryKey: ['billing-candidates'],
    queryFn: async () => {
      const { data } = await supabase.from('candidates').select('id, full_name, email').order('full_name');
      return data || [];
    },
  });

  const { data: agencies = [] } = useQuery({
    queryKey: ['billing-agencies'],
    queryFn: async () => {
      const { data } = await supabase.from('agency_profiles').select('id, company_name').order('company_name');
      return data || [];
    },
  });

  const handleSubmit = async () => {
    if (!candidateId || !agencyId || !totalAmount) return;
    try {
      await createRecord.mutateAsync({
        candidate_id: candidateId,
        agency_id: agencyId,
        total_amount: parseFloat(totalAmount),
        currency,
        description: description || undefined,
      });
      toast({ title: 'Billing record created' });
      onClose();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>New Billing Record</DialogTitle>
        <DialogDescription>Create a billing record for a candidate</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Candidate</Label>
          <Select value={candidateId} onValueChange={setCandidateId}>
            <SelectTrigger><SelectValue placeholder="Select candidate" /></SelectTrigger>
            <SelectContent>
              {candidates.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Agency</Label>
          <Select value={agencyId} onValueChange={setAgencyId}>
            <SelectTrigger><SelectValue placeholder="Select agency" /></SelectTrigger>
            <SelectContent>
              {agencies.map((a: any) => (
                <SelectItem key={a.id} value={a.id}>{a.company_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-2">
            <Label>Total Amount</Label>
            <Input type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="RON">RON</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description (optional)</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Billing description..." />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={createRecord.isPending || !candidateId || !agencyId || !totalAmount}>
          {createRecord.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function EditBillingDialog({ record, onClose, onUpdated }: { record: BillingRecord; onClose: () => void; onUpdated: (r: BillingRecord) => void }) {
  const updateRecord = useUpdateBillingRecord();
  const { toast } = useToast();
  const [totalAmount, setTotalAmount] = useState(String(record.total_amount));
  const [status, setStatus] = useState(record.status);
  const [description, setDescription] = useState(record.description || '');

  const handleSubmit = async () => {
    try {
      const updates: Record<string, any> = {};
      if (parseFloat(totalAmount) !== Number(record.total_amount)) updates.total_amount = parseFloat(totalAmount);
      if (status !== record.status) updates.status = status;
      if (description !== (record.description || '')) updates.description = description;

      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      await updateRecord.mutateAsync({ id: record.id, updates, oldRecord: record });
      onUpdated({ ...record, ...updates } as BillingRecord);
      toast({ title: 'Billing record updated' });
      onClose();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Billing Record</DialogTitle>
        <DialogDescription>
          Changes to agreed amounts will trigger notifications to both parties
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Total Amount ({record.currency})</Label>
          <Input type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
          {parseFloat(totalAmount) !== Number(record.total_amount) && record.status === 'agreed' && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Changing an agreed amount will notify both parties
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="agreed">Agreed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={updateRecord.isPending}>
          {updateRecord.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

