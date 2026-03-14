import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, Trash2, FileText, Download, DollarSign, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useContractDocuments, useUploadContractDocument, useDeleteContractDocument } from '@/hooks/useContractDocuments';
import { useSalesCommissions, useCreateCommission, useSalesStaff, type SalesCommission } from '@/hooks/useSalesCommissions';
import { useUpdateContract, type Contract } from '@/hooks/useContracts';
import { usePartyNameLookup, useSalesPersonLookup } from '@/hooks/useContractParties';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useContractActivityLog } from '@/hooks/useContractActivityLog';

const fileTypeLabels: Record<string, string> = {
  main_contract: 'Main Contract',
  amendment: 'Amendment',
  annex: 'Annex',
  addendum: 'Addendum',
  other: 'Other',
};

const commissionStatusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  earned: 'bg-green-100 text-green-800',
  partial: 'bg-blue-100 text-blue-800',
  frozen: 'bg-sky-100 text-sky-800',
  forfeited: 'bg-red-100 text-red-800',
};

interface ContractDetailDialogProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContractDetailDialog({ contract, open, onOpenChange }: ContractDetailDialogProps) {
  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {contract.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <ContractMetadata contract={contract} />
          <SalesPersonSection contract={contract} />
          <CommissionSection contract={contract} />
          <DocumentsSection contractId={contract.id} />
          <ContractActivitySection contractId={contract.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContractMetadata({ contract }: { contract: Contract }) {
  const updateContract = useUpdateContract();
  const partyLookup = usePartyNameLookup();
  const salesLookup = useSalesPersonLookup();
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: string) => {
    await updateContract.mutateAsync({ id: contract.id, status: newStatus, _oldContract: contract } as any);
    toast({ title: 'Status updated' });
  };

  const partyName = partyLookup.get(contract.party_id) || contract.party_id;
  const salesName = contract.sales_person_id ? (salesLookup.get(contract.sales_person_id) || '—') : '—';

  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{contract.contract_type}</span></div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Status:</span>
        <Select value={contract.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-7 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['draft', 'sent', 'signed', 'active', 'expired', 'terminated'].map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div><span className="text-muted-foreground">Party:</span> <span className="font-medium">{partyName}</span> <span className="text-muted-foreground capitalize text-xs">({contract.party_type})</span></div>
      <div><span className="text-muted-foreground">Sales Person:</span> <span className="font-medium">{salesName}</span></div>
      <div><span className="text-muted-foreground">Value:</span> <span className="font-medium">{contract.total_value ? `${contract.total_value.toLocaleString()} ${contract.currency}` : '—'}</span></div>
      <div><span className="text-muted-foreground">Start:</span> <span>{contract.start_date ? format(new Date(contract.start_date), 'MMM d, yyyy') : '—'}</span></div>
      <div><span className="text-muted-foreground">End:</span> <span>{contract.end_date ? format(new Date(contract.end_date), 'MMM d, yyyy') : '—'}</span></div>
      {contract.notes && (
        <div className="col-span-2"><span className="text-muted-foreground">Notes:</span> <span>{contract.notes}</span></div>
      )}
    </div>
  );
}

function SalesPersonSection({ contract }: { contract: Contract }) {
  const { data: salesStaff = [] } = useSalesStaff();
  const updateContract = useUpdateContract();
  const { toast } = useToast();

  const handleChange = async (salesPersonId: string) => {
    const value = salesPersonId === 'none' ? null : salesPersonId;
    await updateContract.mutateAsync({ id: contract.id, sales_person_id: value, _oldContract: contract } as any);
    toast({ title: 'Sales person updated' });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Sales Person</CardTitle>
      </CardHeader>
      <CardContent>
        <Select
          value={(contract as any).sales_person_id || 'none'}
          onValueChange={handleChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Assign sales person" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No sales person</SelectItem>
            {salesStaff.map((s) => (
              <SelectItem key={s.user_id} value={s.user_id}>
                {s.full_name || s.user_id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

function CommissionSection({ contract }: { contract: Contract }) {
  const { data: commissions = [], isLoading } = useSalesCommissions(contract.id);
  const createCommission = useCreateCommission();
  const { data: salesStaff = [] } = useSalesStaff();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [salesPersonId, setSalesPersonId] = useState('');

  const handleAdd = async () => {
    const numAmount = parseFloat(amount);
    if (!salesPersonId || isNaN(numAmount) || numAmount <= 0) {
      toast({ title: 'Please fill in valid commission details', variant: 'destructive' });
      return;
    }
    await createCommission.mutateAsync({
      contract_id: contract.id,
      project_id: contract.project_id || undefined,
      sales_person_id: salesPersonId,
      commission_amount: numAmount,
      currency,
    });
    setAmount('');
    setSalesPersonId('');
    toast({ title: 'Commission added' });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Commissions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add commission form */}
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <Label className="text-xs">Sales Person</Label>
            <Select value={salesPersonId} onValueChange={setSalesPersonId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {salesStaff.map((s) => (
                  <SelectItem key={s.user_id} value={s.user_id}>{s.full_name || 'Unknown'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-24">
            <Label className="text-xs">Amount</Label>
            <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9" />
          </div>
          <div className="w-20">
            <Label className="text-xs">Currency</Label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-9" />
          </div>
          <Button size="sm" onClick={handleAdd} disabled={createCommission.isPending} className="h-9">
            {createCommission.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
          </Button>
        </div>

        {/* Commission list */}
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : commissions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No commissions yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Original</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((c: SalesCommission) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.commission_amount.toLocaleString()} {c.currency}</TableCell>
                  <TableCell>
                    <Badge className={commissionStatusColors[c.status] || 'bg-muted'}>{c.status}</Badge>
                  </TableCell>
                  <TableCell>{c.original_amount ? `${c.original_amount.toLocaleString()} ${c.currency}` : '—'}</TableCell>
                  <TableCell>{format(new Date(c.created_at), 'MMM d, yyyy')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function DocumentsSection({ contractId }: { contractId: string }) {
  const { data: docs = [], isLoading } = useContractDocuments(contractId);
  const uploadDoc = useUploadContractDocument();
  const deleteDoc = useDeleteContractDocument();
  const { toast } = useToast();
  const [fileType, setFileType] = useState('other');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (files) => {
      for (const file of files) {
        try {
          await uploadDoc.mutateAsync({ contractId, file, fileType });
          toast({ title: `${file.name} uploaded` });
        } catch (err: any) {
          toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
        }
      }
    },
    disabled: uploadDoc.isPending,
  });

  const handleDownload = async (doc: { storage_path: string; file_name: string }) => {
    const { data, error } = await supabase.storage
      .from('contract-documents')
      .download(doc.storage_path);
    if (error) {
      toast({ title: 'Download failed', variant: 'destructive' });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (doc: { id: string; storage_path: string }) => {
    await deleteDoc.mutateAsync({ id: doc.id, storagePath: doc.storage_path, contractId });
    toast({ title: 'Document deleted' });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File type selector + drop zone */}
        <div className="flex gap-2 items-end">
          <div className="w-40">
            <Label className="text-xs">Document Type</Label>
            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="main_contract">Main Contract</SelectItem>
                <SelectItem value="amendment">Amendment</SelectItem>
                <SelectItem value="annex">Annex</SelectItem>
                <SelectItem value="addendum">Addendum</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          {...getRootProps()}
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
          } ${uploadDoc.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          {uploadDoc.isPending ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {isDragActive ? 'Drop files here' : 'Drag & drop or click to upload'}
              </p>
            </>
          )}
        </div>

        {/* Document list */}
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : docs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No documents attached</p>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {fileTypeLabels[doc.file_type] || doc.file_type}
                      {doc.file_size && ` · ${(doc.file_size / 1024).toFixed(0)} KB`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(doc)}
                    disabled={deleteDoc.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContractActivitySection({ contractId }: { contractId: string }) {
  const { data: entries = [], isLoading } = useContractActivityLog(contractId);

  const actionColors: Record<string, string> = {
    status_change: 'bg-blue-100 text-blue-800',
    field_update: 'bg-teal-100 text-teal-800',
    document_upload: 'bg-purple-100 text-purple-800',
    document_delete: 'bg-red-100 text-red-800',
    commission_added: 'bg-emerald-100 text-emerald-800',
    created: 'bg-green-100 text-green-800',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Activity Log
          {entries.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">({entries.length})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No activity recorded yet.</p>
        ) : (
          <div className="relative space-y-0">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
            {entries.map((entry) => (
              <div key={entry.id} className="relative flex gap-3 py-2.5">
                <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-primary/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 ${actionColors[entry.action] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {entry.action.replace('_', ' ')}
                    </Badge>
                    {entry.actor_name && (
                      <span className="text-[11px] font-medium text-foreground">{entry.actor_name}</span>
                    )}
                    <span className="text-[11px] text-muted-foreground ml-auto whitespace-nowrap">
                      {format(new Date(entry.created_at), 'MMM d, yyyy · HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-0.5">{entry.summary}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
