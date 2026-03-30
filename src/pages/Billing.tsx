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
  Loader2, AlertTriangle, Receipt,
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

  // Stats
  const totalAmount = records.reduce((s, r) => s + Number(r.total_amount), 0);
  const draftCount = records.filter(r => r.status === 'draft').length;
  const activeCount = records.filter(r => r.status === 'in_progress' || r.status === 'agreed').length;
  const completedCount = records.filter(r => r.status === 'completed').length;

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] flex overflow-hidden">
        {/* Main content */}
        <div className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ${selectedRecord ? 'w-[65%]' : 'w-full'}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-foreground">Billing</h1>
                <p className="text-xs text-muted-foreground">Track payments, milestones, and billing agreements</p>
              </div>
            </div>

            {/* Stat chips + action */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50">
                  <span className="text-lg font-bold">{records.length}</span>
                  <span className="text-xs text-muted-foreground">Records</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50">
                  <span className="text-lg font-bold">{activeCount}</span>
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50">
                  <span className="text-lg font-bold text-green-700">{completedCount}</span>
                  <span className="text-xs text-muted-foreground">Completed</span>
                </div>
              </div>
              {can('manageBilling') && (
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8">
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> New Record
                    </Button>
                  </DialogTrigger>
                  <CreateBillingDialog onClose={() => setShowCreateDialog(false)} />
                </Dialog>
              )}
            </div>
          </div>

          {/* Records list */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" /> Billing Records
                <Badge variant="secondary" className="text-[10px] ml-1">{records.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className={selectedRecord ? 'h-[calc(100vh-220px)]' : 'h-[calc(100vh-200px)]'}>
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
                        className={`w-full text-left px-4 py-2.5 hover:bg-accent transition-colors ${
                          selectedRecord?.id === record.id ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-medium text-xs truncate">
                            {(record.candidate as any)?.full_name || 'Unknown Candidate'}
                          </span>
                          <Badge className={`text-[10px] ${STATUS_COLORS[record.status] || ''}`}>
                            {record.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground truncate">
                            {(record.agency as any)?.company_name || 'Unknown Agency'}
                          </span>
                          <span className="text-xs font-semibold">
                            {Number(record.total_amount).toLocaleString()} {record.currency}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
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
        {selectedRecord && (
          <div className="w-[35%] border-l bg-muted/30 overflow-y-auto">
            <BillingDetail record={selectedRecord} onUpdate={setSelectedRecord} onClose={() => setSelectedRecord(null)} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function BillingDetail({ record, onUpdate, onClose }: { record: BillingRecord; onUpdate: (r: BillingRecord) => void; onClose: () => void }) {
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
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Billing Record</p>
          <h3 className="text-sm font-semibold">{(record.candidate as any)?.full_name}</h3>
          <p className="text-xs text-muted-foreground">
            {(record.agency as any)?.company_name}
            {record.job && ` · ${(record.job as any)?.title}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={STATUS_COLORS[record.status] || ''}>{record.status}</Badge>
          {can('manageBilling') && (
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs">Edit</Button>
              </DialogTrigger>
              <EditBillingDialog
                record={record}
                onClose={() => setShowEditDialog(false)}
                onUpdated={onUpdate}
              />
            </Dialog>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>×</Button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-background border">
          <p className="text-[10px] text-muted-foreground">Total</p>
          <p className="text-sm font-bold">{Number(record.total_amount).toLocaleString()} {record.currency}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-background border">
          <p className="text-[10px] text-muted-foreground">Paid</p>
          <p className="text-sm font-bold text-green-700">{totalPaid.toLocaleString()} {record.currency}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-background border">
          <p className="text-[10px] text-muted-foreground">Progress</p>
          <p className="text-sm font-bold">{Math.min(totalPercentage, 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-8">
          <TabsTrigger value="payments" className="text-xs h-6">
            <DollarSign className="h-3 w-3 mr-1" /> Payments
          </TabsTrigger>
          <TabsTrigger value="log" className="text-xs h-6">
            <History className="h-3 w-3 mr-1" /> Log
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs h-6">
            <MessageSquare className="h-3 w-3 mr-1" /> Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-3">
          <PaymentMilestones
            billingRecordId={record.id}
            totalAmount={Number(record.total_amount)}
            currency={record.currency}
            payments={payments}
          />
        </TabsContent>

        <TabsContent value="log" className="mt-3">
          <ScrollArea className="h-[320px]">
            <div className="space-y-2">
              {changeLog.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No changes logged</p>
              ) : (
                changeLog.map((log) => (
                  <div key={log.id} className="border rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">{log.action}</Badge>
                        <span className="text-[10px] font-medium">{log.changed_by_name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(log.created_at), 'dd MMM HH:mm')}
                      </span>
                    </div>
                    {log.field_changed && (
                      <p className="text-[10px]">
                        <span className="text-muted-foreground">{log.field_changed}:</span>{' '}
                        <span className="line-through text-destructive">{log.old_value}</span>{' → '}
                        <span className="text-green-700">{log.new_value}</span>
                      </p>
                    )}
                    {log.note && <p className="text-[10px] text-muted-foreground">{log.note}</p>}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="notes" className="mt-3">
          <BillingNotesSection billingRecordId={record.id} notes={notes} />
        </TabsContent>
      </Tabs>
    </div>
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
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred. Please try again.' });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[50px] text-xs"
        />
        <Button onClick={handleSubmit} disabled={addNote.isPending || !content.trim()} className="shrink-0" size="sm">
          {addNote.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
        </Button>
      </div>
      <ScrollArea className="h-[260px]">
        <div className="space-y-2">
          {notes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No notes yet</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium">{note.created_by_name}</span>
                    <Badge variant="secondary" className="text-[10px]">{note.created_by_role}</Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(note.created_at), 'dd MMM HH:mm')}
                  </span>
                </div>
                <p className="text-xs">{note.content}</p>
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
        <DialogTitle className="text-sm">New Billing Record</DialogTitle>
        <DialogDescription className="text-xs">Create a billing record for a candidate</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Candidate</Label>
          <Select value={candidateId} onValueChange={setCandidateId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select candidate" /></SelectTrigger>
            <SelectContent>
              {candidates.map((c: any) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">{c.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Agency</Label>
          <Select value={agencyId} onValueChange={setAgencyId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select agency" /></SelectTrigger>
            <SelectContent>
              {agencies.map((a: any) => (
                <SelectItem key={a.id} value={a.id} className="text-xs">{a.company_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Total Amount</Label>
            <Input type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="0.00" className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR" className="text-xs">EUR</SelectItem>
                <SelectItem value="USD" className="text-xs">USD</SelectItem>
                <SelectItem value="GBP" className="text-xs">GBP</SelectItem>
                <SelectItem value="RON" className="text-xs">RON</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Description (optional)</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Billing description..." className="text-xs min-h-[50px]" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={createRecord.isPending || !candidateId || !agencyId || !totalAmount}>
          {createRecord.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
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
        <DialogTitle className="text-sm">Edit Billing Record</DialogTitle>
        <DialogDescription className="text-xs">
          Changes to agreed amounts will trigger notifications to both parties
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Total Amount ({record.currency})</Label>
          <Input type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} className="h-8 text-xs" />
          {parseFloat(totalAmount) !== Number(record.total_amount) && record.status === 'agreed' && (
            <p className="text-[10px] text-destructive flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Changing an agreed amount will notify both parties
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft" className="text-xs">Draft</SelectItem>
              <SelectItem value="agreed" className="text-xs">Agreed</SelectItem>
              <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
              <SelectItem value="completed" className="text-xs">Completed</SelectItem>
              <SelectItem value="disputed" className="text-xs">Disputed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="text-xs min-h-[50px]" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={updateRecord.isPending}>
          {updateRecord.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
