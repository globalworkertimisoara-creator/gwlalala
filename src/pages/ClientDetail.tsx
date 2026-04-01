import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FolderOpen, FileText, DollarSign, AlertTriangle, Trash2, Plus, MessageSquare, Upload, Link as LinkIcon, Receipt, Activity } from 'lucide-react';
import { useClient, useUpdateClientStatus } from '@/hooks/useClients';
import { useClientProjects, useLinkClientToProject, useUnlinkClientFromProject } from '@/hooks/useClientProjects';
import { useClientNotes, useCreateClientNote, useDeleteClientNote } from '@/hooks/useClientNotes';
import { useClientActivityLog } from '@/hooks/useClientActivityLog';
import { useClientInvoices, useCreateClientInvoice } from '@/hooks/useClientInvoices';
import { useClientDocuments, useUploadClientDocument, useDeleteClientDocument } from '@/hooks/useClientDocuments';
import { CLIENT_STATUS_CONFIG, CLIENT_TYPE_CONFIG, getClientDisplayName, type ClientStatus } from '@/types/client';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useDropzone } from 'react-dropzone';
import { useCallback } from 'react';

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: client, isLoading } = useClient(id!);
  const updateStatus = useUpdateClientStatus();

  if (isLoading) return <AppLayout><div className="p-6 text-muted-foreground">Loading...</div></AppLayout>;
  if (!client) return <AppLayout><div className="p-6 text-muted-foreground">Client not found</div></AppLayout>;

  const companyData = (client as any).companies;
  const displayName = getClientDisplayName(client as any, companyData?.company_name);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] overflow-y-auto">
        <div className="px-6 py-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/clients')} className="mb-4 gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Clients
          </Button>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <div className="flex gap-2 mt-2">
                <Badge className={CLIENT_TYPE_CONFIG[client.client_type as keyof typeof CLIENT_TYPE_CONFIG]?.color}>
                  {CLIENT_TYPE_CONFIG[client.client_type as keyof typeof CLIENT_TYPE_CONFIG]?.label}
                </Badge>
                <Select value={client.status} onValueChange={(v) => updateStatus.mutate({ id: client.id, status: v as ClientStatus })}>
                  <SelectTrigger className="h-6 w-auto border-0 p-0">
                    <Badge className={CLIENT_STATUS_CONFIG[client.status as keyof typeof CLIENT_STATUS_CONFIG]?.color}>
                      {CLIENT_STATUS_CONFIG[client.status as keyof typeof CLIENT_STATUS_CONFIG]?.label}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CLIENT_STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {client.client_type === 'individual' && (
                <p className="text-sm text-muted-foreground mt-1">{client.email} {client.phone && `• ${client.phone}`}</p>
              )}
              {client.client_type === 'company' && companyData && (
                <p className="text-sm text-muted-foreground mt-1">{companyData.industry} • {companyData.headquarters_city}, {companyData.headquarters_country}</p>
              )}
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="contracts">Contracts</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="notes">Notes & Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <OverviewTab client={client} companyData={companyData} />
            </TabsContent>
            <TabsContent value="projects" className="mt-4">
              <ProjectsTab clientId={client.id} />
            </TabsContent>
            <TabsContent value="contracts" className="mt-4">
              <ContractsTab clientId={client.id} companyId={client.company_id} />
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              <DocumentsTab clientId={client.id} userId={user?.id} />
            </TabsContent>
            <TabsContent value="billing" className="mt-4">
              <BillingTab clientId={client.id} />
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
              <NotesTab clientId={client.id} userId={user?.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

function OverviewTab({ client, companyData }: { client: any; companyData: any }) {
  if (client.client_type === 'company' && companyData) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle className="text-sm">Contact</CardTitle></CardHeader><CardContent className="text-sm space-y-1">
          <p>{companyData.primary_contact_name} — {companyData.primary_contact_position}</p>
          <p className="text-muted-foreground">{companyData.primary_contact_email}</p>
          <p className="text-muted-foreground">{companyData.primary_contact_phone}</p>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Company Details</CardTitle></CardHeader><CardContent className="text-sm space-y-1">
          {companyData.legal_name && <p>Legal: {companyData.legal_name}</p>}
          {companyData.registration_number && <p>Reg: {companyData.registration_number}</p>}
          {companyData.industry && <p>Industry: {companyData.industry}</p>}
          {companyData.company_size && <p>Size: {companyData.company_size}</p>}
          {companyData.website && <p>Web: {companyData.website}</p>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Address</CardTitle></CardHeader><CardContent className="text-sm">
          <p>{companyData.headquarters_address}</p>
          <p>{companyData.headquarters_city}, {companyData.headquarters_country} {companyData.postal_code}</p>
        </CardContent></Card>
        {companyData.billing_contact_name && (
          <Card><CardHeader><CardTitle className="text-sm">Billing Contact</CardTitle></CardHeader><CardContent className="text-sm">
            <p>{companyData.billing_contact_name}</p>
            <p className="text-muted-foreground">{companyData.billing_contact_email}</p>
          </CardContent></Card>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card><CardHeader><CardTitle className="text-sm">Personal Info</CardTitle></CardHeader><CardContent className="text-sm space-y-1">
        <p>{client.first_name} {client.last_name}</p>
        <p className="text-muted-foreground">{client.email}</p>
        {client.phone && <p className="text-muted-foreground">{client.phone}</p>}
        {client.date_of_birth && <p>DOB: {client.date_of_birth}</p>}
        {client.nationality && <p>Nationality: {client.nationality}</p>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">Address</CardTitle></CardHeader><CardContent className="text-sm space-y-1">
        {client.address_line1 && <p>{client.address_line1}</p>}
        {client.address_line2 && <p>{client.address_line2}</p>}
        <p>{[client.city, client.country, client.postal_code].filter(Boolean).join(', ')}</p>
      </CardContent></Card>
      {client.id_document_type && (
        <Card><CardHeader><CardTitle className="text-sm">ID Document</CardTitle></CardHeader><CardContent className="text-sm space-y-1">
          <p>Type: {client.id_document_type}</p>
          <p>Number: {client.id_document_number}</p>
          {client.id_document_expiry && <p>Expires: {client.id_document_expiry}</p>}
        </CardContent></Card>
      )}
      <Card><CardHeader><CardTitle className="text-sm">Billing Info</CardTitle></CardHeader><CardContent className="text-sm space-y-1">
        {client.billing_name && <p>{client.billing_name}</p>}
        {client.billing_email && <p className="text-muted-foreground">{client.billing_email}</p>}
        {client.billing_address && <p>{client.billing_address}</p>}
        {client.tax_id && <p>Tax ID: {client.tax_id}</p>}
      </CardContent></Card>
    </div>
  );
}

function ProjectsTab({ clientId }: { clientId: string }) {
  const navigate = useNavigate();
  const { data: clientProjects = [] } = useClientProjects(clientId);
  const linkProject = useLinkClientToProject();
  const unlinkProject = useUnlinkClientFromProject();
  const [linkOpen, setLinkOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects-for-linking'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('id, name, status, employer_name').order('name');
      return data || [];
    },
  });

  const linkedProjectIds = new Set(clientProjects.map(cp => cp.project_id));
  const availableProjects = allProjects.filter(p => !linkedProjectIds.has(p.id));

  const handleLink = async () => {
    if (!selectedProjectId) return;
    await linkProject.mutateAsync({ clientId, projectId: selectedProjectId });
    setSelectedProjectId('');
    setLinkOpen(false);
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1"><LinkIcon className="h-4 w-4" /> Link Project</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Link to Project</DialogTitle></DialogHeader>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger><SelectValue placeholder="Select a project..." /></SelectTrigger>
              <SelectContent>
                {availableProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {p.employer_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={handleLink} disabled={!selectedProjectId || linkProject.isPending}>Link</Button>
          </DialogContent>
        </Dialog>
      </div>
      {clientProjects.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No projects linked yet</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2 font-medium">Project</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Role</th>
              <th className="text-left px-4 py-2 font-medium">Linked</th>
              <th className="px-4 py-2"></th>
            </tr></thead>
            <tbody>
              {clientProjects.map(cp => {
                const project = (cp as any).projects;
                return (
                  <tr key={cp.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/projects/${cp.project_id}`)} className="text-primary hover:underline font-medium">
                        {project?.name || 'Unknown'}
                      </button>
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline">{project?.status}</Badge></td>
                    <td className="px-4 py-3 capitalize">{cp.role}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDistanceToNow(new Date(cp.created_at), { addSuffix: true })}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => unlinkProject.mutate({ clientId, projectId: cp.project_id })}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ContractsTab({ clientId, companyId }: { clientId: string; companyId: string | null }) {
  const { data: contracts = [] } = useQuery({
    queryKey: ['client-contracts', clientId, companyId],
    queryFn: async () => {
      let query = supabase.from('contracts').select('*').order('created_at', { ascending: false });
      if (companyId) {
        query = query.or(`party_id.eq.${clientId},party_id.eq.${companyId}`);
      } else {
        query = query.eq('party_id', clientId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });

  return contracts.length === 0 ? (
    <p className="text-sm text-muted-foreground text-center py-8">No contracts found</p>
  ) : (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="border-b bg-muted/50">
          <th className="text-left px-4 py-2 font-medium">Contract</th>
          <th className="text-left px-4 py-2 font-medium">Title</th>
          <th className="text-left px-4 py-2 font-medium">Status</th>
          <th className="text-right px-4 py-2 font-medium">Value</th>
        </tr></thead>
        <tbody>
          {contracts.map(c => (
            <tr key={c.id} className="border-b hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{c.contract_number || '—'}</td>
              <td className="px-4 py-3">{c.title}</td>
              <td className="px-4 py-3"><Badge variant="outline">{c.status}</Badge></td>
              <td className="px-4 py-3 text-right">{c.total_value ? `€${Number(c.total_value).toLocaleString()}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocumentsTab({ clientId, userId }: { clientId: string; userId?: string }) {
  const { data: docs = [] } = useClientDocuments(clientId);
  const uploadDoc = useUploadClientDocument();
  const deleteDoc = useDeleteClientDocument();
  const [docType, setDocType] = useState('other');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (file.size > 10 * 1024 * 1024) continue;
      uploadDoc.mutate({ clientId, file, docType });
    }
  }, [clientId, docType, uploadDoc]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxSize: 10 * 1024 * 1024 });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <Select value={docType} onValueChange={setDocType}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="passport">Passport</SelectItem>
            <SelectItem value="national_id">National ID</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="invoice">Invoice</SelectItem>
            <SelectItem value="visa">Visa</SelectItem>
            <SelectItem value="work_permit">Work Permit</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'}`}>
        <input {...getInputProps()} />
        <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Drop files here or click to upload (max 10MB)</p>
      </div>
      {docs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded yet</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Type</th>
              <th className="text-left px-4 py-2 font-medium">Size</th>
              <th className="text-left px-4 py-2 font-medium">Uploaded</th>
              <th className="px-4 py-2"></th>
            </tr></thead>
            <tbody>
              {docs.map(doc => (
                <tr key={doc.id} className="border-b">
                  <td className="px-4 py-3">{doc.name}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{doc.doc_type}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</td>
                  <td className="px-4 py-3">
                    {doc.uploaded_by === userId && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteDoc.mutate({ id: doc.id, storagePath: doc.storage_path })}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BillingTab({ clientId }: { clientId: string }) {
  const { data: invoices = [] } = useClientInvoices(clientId);
  const createInvoice = useCreateClientInvoice();
  const [createOpen, setCreateOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState<Record<string, any>>({});

  const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.total_amount), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + Number(i.paid_amount), 0);

  const handleCreate = async () => {
    await createInvoice.mutateAsync({
      client_id: clientId,
      invoice_number: invoiceForm.invoice_number || null,
      description: invoiceForm.description || null,
      total_amount: Number(invoiceForm.total_amount) || 0,
      subtotal: Number(invoiceForm.total_amount) || 0,
      currency: invoiceForm.currency || 'EUR',
      status: 'draft',
      issue_date: invoiceForm.issue_date || null,
      due_date: invoiceForm.due_date || null,
    });
    setInvoiceForm({});
    setCreateOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">€{totalInvoiced.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Invoiced</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-green-600">€{totalPaid.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Paid</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className={`text-2xl font-bold ${totalInvoiced - totalPaid > 0 ? 'text-destructive' : ''}`}>€{(totalInvoiced - totalPaid).toLocaleString()}</p><p className="text-xs text-muted-foreground">Outstanding</p></CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Create Invoice</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Invoice Number</Label><Input value={invoiceForm.invoice_number || ''} onChange={e => setInvoiceForm(p => ({ ...p, invoice_number: e.target.value }))} className="h-9" /></div>
              <div><Label className="text-xs">Description</Label><Textarea value={invoiceForm.description || ''} onChange={e => setInvoiceForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Amount</Label><Input type="number" value={invoiceForm.total_amount || ''} onChange={e => setInvoiceForm(p => ({ ...p, total_amount: e.target.value }))} className="h-9" /></div>
                <div><Label className="text-xs">Currency</Label>
                  <Select value={invoiceForm.currency || 'EUR'} onValueChange={v => setInvoiceForm(p => ({ ...p, currency: v }))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="EUR">EUR</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="GBP">GBP</SelectItem><SelectItem value="RON">RON</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Issue Date</Label><Input type="date" value={invoiceForm.issue_date || ''} onChange={e => setInvoiceForm(p => ({ ...p, issue_date: e.target.value }))} className="h-9" /></div>
                <div><Label className="text-xs">Due Date</Label><Input type="date" value={invoiceForm.due_date || ''} onChange={e => setInvoiceForm(p => ({ ...p, due_date: e.target.value }))} className="h-9" /></div>
              </div>
              <Button onClick={handleCreate} disabled={createInvoice.isPending} className="w-full">Create Invoice</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No invoices yet</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2 font-medium">Invoice #</th>
              <th className="text-left px-4 py-2 font-medium">Description</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-right px-4 py-2 font-medium">Amount</th>
              <th className="text-right px-4 py-2 font-medium">Paid</th>
            </tr></thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{inv.invoice_number || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{inv.description || '—'}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{inv.status}</Badge></td>
                  <td className="px-4 py-3 text-right">{inv.currency} {Number(inv.total_amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{inv.currency} {Number(inv.paid_amount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NotesTab({ clientId, userId }: { clientId: string; userId?: string }) {
  const { data: notes = [] } = useClientNotes(clientId);
  const { data: activities = [] } = useClientActivityLog(clientId);
  const createNote = useCreateClientNote();
  const deleteNote = useDeleteClientNote();
  const [noteContent, setNoteContent] = useState('');

  const handleSubmit = async () => {
    if (!noteContent.trim()) return;
    await createNote.mutateAsync({ clientId, content: noteContent });
    setNoteContent('');
  };

  const actionIcons: Record<string, typeof Activity> = {
    created: Plus,
    status_changed: Activity,
    note_added: MessageSquare,
    document_uploaded: Upload,
    project_linked: LinkIcon,
    invoice_created: Receipt,
  };

  // Merge notes and activities into timeline
  const timeline = [
    ...notes.map(n => ({ type: 'note' as const, ...n, created_at: n.created_at })),
    ...activities.map(a => ({ type: 'activity' as const, ...a, created_at: a.created_at })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a note about this client..."
          value={noteContent}
          onChange={e => setNoteContent(e.target.value)}
          rows={2}
          className="flex-1"
        />
        <Button onClick={handleSubmit} disabled={!noteContent.trim() || createNote.isPending}>Add Note</Button>
      </div>

      {timeline.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No activity yet</p>
      ) : (
        <div className="space-y-3">
          {timeline.map(item => {
            if (item.type === 'note') {
              return (
                <div key={`note-${item.id}`} className="flex gap-3 p-3 border rounded-lg">
                  <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{(item as any).content}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</p>
                  </div>
                  {(item as any).created_by === userId && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteNote.mutate(item.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              );
            }
            const IconComp = actionIcons[(item as any).action] || Activity;
            return (
              <div key={`act-${item.id}`} className="flex gap-3 p-3 border rounded-lg bg-muted/30">
                <IconComp className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm capitalize">{((item as any).action || '').replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ClientDetail;
