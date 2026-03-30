import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Upload, Trash2, FileText, Download, DollarSign, Activity, FolderKanban, Link2, Unlink, X, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { useContractDocuments, useUploadContractDocument, useDeleteContractDocument } from '@/hooks/useContractDocuments';
import { useSalesCommissions, useCreateCommission, useSalesStaff, type SalesCommission } from '@/hooks/useSalesCommissions';
import { useUpdateContract, useLinkContractToProject } from '@/hooks/useContracts';
import type { Contract } from '@/types/contract';
import { useProjects } from '@/hooks/useProjects';
import { usePartyNameLookup, useSalesPersonLookup } from '@/hooks/useContractParties';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useContractActivityLog } from '@/hooks/useContractActivityLog';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800',
  signed: 'bg-green-100 text-green-800',
  active: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-destructive/10 text-destructive',
  terminated: 'bg-red-100 text-red-800',
};

const typeLabels: Record<string, string> = {
  recruitment: 'Recruitment',
  partnership: 'Partnership',
  consultancy: 'Consultancy',
  service: 'Service',
  employer_agreement: 'Employer Agreement',
  agency_agreement: 'Agency Agreement',
  worker_contract: 'Worker Contract',
  service_agreement: 'Service Agreement',
};

interface ContractDetailPanelProps {
  contract: Contract;
  onClose: () => void;
}

export function ContractDetailPanel({ contract, onClose }: ContractDetailPanelProps) {
  const navigate = useNavigate();
  const partyLookup = usePartyNameLookup();
  const salesLookup = useSalesPersonLookup();
  const updateContract = useUpdateContract();
  const { toast } = useToast();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    project: true,
    commissions: false,
    documents: false,
    activity: false,
  });

  const partyName = partyLookup.get(contract.party_id) || contract.party_id;
  const salesName = contract.sales_person_id ? (salesLookup.get(contract.sales_person_id) || '—') : '—';
  const progress = getProgress(contract);
  const daysLeft = contract.end_date ? differenceInDays(new Date(contract.end_date), new Date()) : null;

  const handleStatusChange = async (newStatus: string) => {
    await updateContract.mutateAsync({ id: contract.id, status: newStatus, _oldContract: contract } as any);
    toast({ title: 'Status updated' });
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col h-full border-l bg-card">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b bg-muted/30">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-base truncate pr-2">{contract.title}</h3>
          {contract.contract_number && (
            <p className="text-xs font-mono text-primary mt-0.5">{contract.contract_number}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Badge className={`text-[10px] ${statusColors[contract.status] || 'bg-muted'}`}>{contract.status}</Badge>
            <span className="text-xs text-muted-foreground">{typeLabels[contract.contract_type] || contract.contract_type}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/contracts?highlight=${contract.id}`)} title="Open full view">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {progress !== null && (
        <div className="px-4 py-2 border-b bg-muted/10">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>
              {progress}%
              {daysLeft !== null && daysLeft > 0 && ` · ${daysLeft}d left`}
              {daysLeft !== null && daysLeft <= 0 && ' · Expired'}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
          {/* Details Section */}
          <SectionHeader title="Details" expanded={expandedSections.details} onToggle={() => toggleSection('details')} />
          {expandedSections.details && (
            <div className="pb-3 space-y-2.5 text-sm">
              <DetailRow label="Party" value={partyName} sub={contract.party_type} />
              <DetailRow label="Sales Person" value={salesName} />
              <DetailRow label="Value" value={contract.total_value ? `€${contract.total_value.toLocaleString()}` : '—'} />
              <DetailRow label="Start" value={contract.start_date ? format(new Date(contract.start_date), 'MMM d, yyyy') : '—'} />
              <DetailRow label="End" value={contract.end_date ? format(new Date(contract.end_date), 'MMM d, yyyy') : '—'} />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Status</span>
                <Select value={contract.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-7 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['draft', 'sent', 'signed', 'active', 'expired', 'terminated'].map(s => (
                      <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {contract.notes && (
                <div>
                  <span className="text-muted-foreground text-xs">Notes</span>
                  <p className="text-xs mt-0.5 text-foreground/80">{contract.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Linked Project */}
          <SectionHeader title="Linked Project" expanded={expandedSections.project} onToggle={() => toggleSection('project')} />
          {expandedSections.project && (
            <div className="pb-3">
              <PanelLinkedProject contract={contract} onNavigate={onClose} />
            </div>
          )}

          {/* Commissions */}
          <SectionHeader title="Commissions" expanded={expandedSections.commissions} onToggle={() => toggleSection('commissions')} />
          {expandedSections.commissions && (
            <div className="pb-3">
              <PanelCommissions contract={contract} />
            </div>
          )}

          {/* Documents */}
          <SectionHeader title="Documents" expanded={expandedSections.documents} onToggle={() => toggleSection('documents')} />
          {expandedSections.documents && (
            <div className="pb-3">
              <PanelDocuments contractId={contract.id} />
            </div>
          )}

          {/* Activity */}
          <SectionHeader title="Activity" expanded={expandedSections.activity} onToggle={() => toggleSection('activity')} />
          {expandedSections.activity && (
            <div className="pb-3">
              <PanelActivity contractId={contract.id} />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function SectionHeader({ title, expanded, onToggle }: { title: string; expanded: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border-b"
    >
      {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      <span className="uppercase tracking-wide">{title}</span>
    </button>
  );
}

function DetailRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="text-right">
        <span className="text-xs font-medium">{value}</span>
        {sub && <span className="text-[10px] text-muted-foreground ml-1 capitalize">({sub})</span>}
      </div>
    </div>
  );
}

function PanelLinkedProject({ contract, onNavigate }: { contract: Contract; onNavigate: () => void }) {
  const { data: projects = [] } = useProjects();
  const linkContract = useLinkContractToProject();
  const navigate = useNavigate();
  const { toast } = useToast();

  const linkedProject = contract.project_id ? projects.find(p => p.id === contract.project_id) : null;

  const handleLink = async (projectId: string) => {
    const value = projectId === 'none' ? null : projectId;
    await linkContract.mutateAsync({ contractId: contract.id, projectId: value });
    toast({ title: value ? 'Linked' : 'Unlinked' });
  };

  if (linkedProject) {
    return (
      <div className="flex items-center justify-between rounded-md border p-2">
        <button
          className="text-left min-w-0"
          onClick={() => { onNavigate(); navigate(`/projects/${linkedProject.id}`); }}
        >
          <p className="text-xs font-medium text-primary hover:underline truncate">{linkedProject.name}</p>
          <p className="text-[10px] text-muted-foreground">{linkedProject.employer_name}</p>
        </button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => handleLink('none')} disabled={linkContract.isPending}>
          <Unlink className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Select value="none" onValueChange={handleLink}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder="Link to project" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No project</SelectItem>
        {projects.map(p => (
          <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PanelCommissions({ contract }: { contract: Contract }) {
  const { data: commissions = [], isLoading } = useSalesCommissions(contract.id);
  const createCommission = useCreateCommission();
  const { data: salesStaff = [] } = useSalesStaff();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [salesPersonId, setSalesPersonId] = useState('');

  const handleAdd = async () => {
    const numAmount = parseFloat(amount);
    if (!salesPersonId || isNaN(numAmount) || numAmount <= 0) return;
    await createCommission.mutateAsync({
      contract_id: contract.id,
      project_id: contract.project_id || undefined,
      sales_person_id: salesPersonId,
      commission_amount: numAmount,
      currency: 'EUR',
    });
    setAmount('');
    setSalesPersonId('');
    toast({ title: 'Commission added' });
  };

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin mx-auto my-2" />;

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <Select value={salesPersonId} onValueChange={setSalesPersonId}>
          <SelectTrigger className="h-7 text-[11px] flex-1"><SelectValue placeholder="Person" /></SelectTrigger>
          <SelectContent>
            {salesStaff.map(s => (
              <SelectItem key={s.user_id} value={s.user_id} className="text-xs">{s.full_name || 'Unknown'}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="number" placeholder="€" value={amount} onChange={e => setAmount(e.target.value)} className="h-7 w-20 text-xs" />
        <Button size="sm" onClick={handleAdd} disabled={createCommission.isPending} className="h-7 px-2 text-xs">Add</Button>
      </div>
      {commissions.length === 0 ? (
        <p className="text-[11px] text-muted-foreground text-center py-1">No commissions</p>
      ) : (
        <div className="space-y-1">
          {commissions.map((c: SalesCommission) => (
            <div key={c.id} className="flex items-center justify-between text-xs px-1">
              <span className="font-medium">{c.commission_amount.toLocaleString()} {c.currency}</span>
              <Badge variant="secondary" className="text-[9px] px-1 py-0">{c.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PanelDocuments({ contractId }: { contractId: string }) {
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
          toast({ title: 'Upload failed', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
        }
      }
    },
    disabled: uploadDoc.isPending,
  });

  const handleDownload = async (doc: { storage_path: string; file_name: string }) => {
    const { data, error } = await supabase.storage.from('contract-documents').download(doc.storage_path);
    if (error) { toast({ title: 'Download failed', variant: 'destructive' }); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin mx-auto my-2" />;

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`rounded border-2 border-dashed p-3 text-center text-xs cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'
        }`}
      >
        <input {...getInputProps()} />
        {uploadDoc.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
        ) : (
          <p className="text-muted-foreground">{isDragActive ? 'Drop here' : 'Drop files or click'}</p>
        )}
      </div>
      {docs.length === 0 ? (
        <p className="text-[11px] text-muted-foreground text-center py-1">No documents</p>
      ) : (
        <div className="space-y-1">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center justify-between rounded border px-2 py-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] truncate">{doc.file_name}</span>
              </div>
              <div className="flex gap-0.5 shrink-0">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDownload(doc)}>
                  <Download className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteDoc.mutateAsync({ id: doc.id, storagePath: doc.storage_path, contractId })}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PanelActivity({ contractId }: { contractId: string }) {
  const { data: entries = [], isLoading } = useContractActivityLog(contractId);

  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin mx-auto my-2" />;
  if (entries.length === 0) return <p className="text-[11px] text-muted-foreground text-center py-1">No activity</p>;

  return (
    <div className="space-y-1.5">
      {entries.slice(0, 10).map(entry => (
        <div key={entry.id} className="text-[11px]">
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[9px] px-1 py-0">{entry.action.replace('_', ' ')}</Badge>
            <span className="text-muted-foreground ml-auto">{format(new Date(entry.created_at), 'MMM d, HH:mm')}</span>
          </div>
          <p className="text-foreground/80 mt-0.5">{entry.summary}</p>
        </div>
      ))}
      {entries.length > 10 && (
        <p className="text-[10px] text-muted-foreground text-center">+{entries.length - 10} more</p>
      )}
    </div>
  );
}

function getProgress(c: Contract): number | null {
  if (!c.start_date || !c.end_date) return null;
  const start = new Date(c.start_date).getTime();
  const end = new Date(c.end_date).getTime();
  const now = Date.now();
  if (now < start) return 0;
  if (now > end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}
