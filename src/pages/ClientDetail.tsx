import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, FolderOpen, FileText, DollarSign, AlertTriangle, Trash2, Plus, MessageSquare, Upload, Link as LinkIcon, Receipt, Activity, Pencil, Calendar, Users, Link2, Shield, Star, Building2, GitBranch, UserPlus, Handshake, X, Eye, ChevronDown, ChevronUp, Folder } from 'lucide-react';
import { useClient, useUpdateClient, useUpdateClientStatus, useUpdateCompany } from '@/hooks/useClients';
import { useClientProjects, useLinkClientToProject, useUnlinkClientFromProject } from '@/hooks/useClientProjects';
import { useClientNotes, useCreateClientNote, useDeleteClientNote } from '@/hooks/useClientNotes';
import { useClientActivityLog } from '@/hooks/useClientActivityLog';
import { useClientInvoices, useCreateClientInvoice } from '@/hooks/useClientInvoices';
import {
  useClientContacts, useCreateClientContact, useUpdateClientContact, useDeleteClientContact,
  useClientMeetings, useCreateClientMeeting, useUpdateClientMeeting,
  useClientRelationships, useCreateClientRelationship, useDeleteClientRelationship,
  useClientCustomFields, useUpsertClientCustomField, useDeleteClientCustomField,
  useClientDocuments, useUploadClientDocument, useDeleteClientDocument,
} from '@/hooks/useClientCRM';
import {
  CLIENT_STATUS_CONFIG, CLIENT_TYPE_CONFIG, getClientDisplayName, sanitizeTextInput, type ClientStatus,
  PAYMENT_TERMS_OPTIONS, CURRENCY_OPTIONS, PRIORITY_LEVELS, COMMUNICATION_CHANNELS, MEETING_STATUS_CONFIG, DOCUMENT_FOLDERS,
} from '@/types/client';
import { useClients } from '@/hooks/useClients';
import { formatDistanceToNow, format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useDropzone } from 'react-dropzone';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState('overview');

  const isValidUUID = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  useEffect(() => {
    if (!isValidUUID) {
      navigate('/clients', { replace: true });
    }
  }, [isValidUUID, navigate]);

  const { data: client, isLoading } = useClient(isValidUUID ? id! : '');
  const updateStatus = useUpdateClientStatus();

  if (!isValidUUID) return null;
  if (isLoading) return <AppLayout><div className="p-6 text-muted-foreground">Loading...</div></AppLayout>;
  if (!client) return <AppLayout><div className="p-6 text-muted-foreground">Client not found</div></AppLayout>;

  const companyData = (client as any).companies;
  const displayName = getClientDisplayName(client as any, companyData?.company_name);

  const priorityConfig = PRIORITY_LEVELS.find(p => p.value === client.priority_level);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] overflow-y-auto">
        <div className="px-6 py-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/clients')} className="mb-4 gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Clients
          </Button>

          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                {client.priority_level && client.priority_level !== 'standard' && priorityConfig && (
                  <Badge className={priorityConfig.color}>
                    {priorityConfig.value === 'vip' && <Star className="h-3 w-3 mr-1" />}
                    {priorityConfig.label}
                  </Badge>
                )}
              </div>
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
            {can('editClients') && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/clients/${client.id}/edit`)}>
                <Pencil className="h-3.5 w-3.5" /> Edit Client
              </Button>
            )}
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setActiveTab('notes')}>
              <MessageSquare className="h-3.5 w-3.5" /> Add Note
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setActiveTab('documents')}>
              <Upload className="h-3.5 w-3.5" /> Upload Document
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setActiveTab('projects')}>
              <LinkIcon className="h-3.5 w-3.5" /> Link Project
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setActiveTab('billing')}>
              <Receipt className="h-3.5 w-3.5" /> Create Invoice
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="meetings">Meetings</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="contracts">Contracts</TabsTrigger>
              <TabsTrigger value="relationships">Relationships</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="custom_fields">Custom Fields</TabsTrigger>
              <TabsTrigger value="notes">Notes & Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <OverviewTab client={client} companyData={companyData} />
            </TabsContent>
            <TabsContent value="contacts" className="mt-4">
              <ContactsTab clientId={client.id} />
            </TabsContent>
            <TabsContent value="meetings" className="mt-4">
              <MeetingsTab clientId={client.id} />
            </TabsContent>
            <TabsContent value="projects" className="mt-4">
              <ProjectsTab clientId={client.id} />
            </TabsContent>
            <TabsContent value="contracts" className="mt-4">
              <ContractsTab clientId={client.id} companyId={client.company_id} />
            </TabsContent>
            <TabsContent value="relationships" className="mt-4">
              <RelationshipsTab clientId={client.id} />
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              <DocumentsTab clientId={client.id} userId={user?.id} />
            </TabsContent>
            <TabsContent value="billing" className="mt-4">
              <BillingTab clientId={client.id} />
            </TabsContent>
            <TabsContent value="custom_fields" className="mt-4">
              <CustomFieldsTab clientId={client.id} />
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

const isValidUrl = (url: string) => !url || /^https?:\/\//.test(url);
const isValidEmail = (email: string) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function getRiskColor(score: number | null | undefined) {
  if (!score) return 'text-muted-foreground';
  if (score <= 3) return 'text-green-600';
  if (score <= 6) return 'text-amber-600';
  return 'text-red-600';
}
function getRiskLabel(score: number | null | undefined) {
  if (!score) return '';
  if (score <= 3) return 'Low';
  if (score <= 6) return 'Medium';
  return 'High';
}
function getPayScoreColor(score: number | null | undefined) {
  if (!score) return 'text-muted-foreground';
  if (score >= 7) return 'text-green-600';
  if (score >= 4) return 'text-amber-600';
  return 'text-red-600';
}
function getPayScoreLabel(score: number | null | undefined) {
  if (!score) return '';
  if (score >= 7) return 'Good';
  if (score >= 4) return 'Fair';
  return 'Poor';
}

function OverviewTab({ client, companyData }: { client: any; companyData: any }) {
  const { can } = usePermissions();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const updateClient = useUpdateClient();
  const updateCompany = useUpdateCompany();

  const startEdit = (section: string, data: Record<string, any>) => {
    setEditingSection(section);
    setEditData(data);
  };
  const updateField = (key: string, value: any) => setEditData(prev => ({ ...prev, [key]: value }));

  const handleSave = (section: string) => {
    const emailFields = ['primary_contact_email', 'hr_contact_email', 'billing_contact_email', 'billing_email', 'email'];
    for (const field of emailFields) {
      if (editData[field] && !isValidEmail(editData[field])) return;
    }
    const urlFields = ['website', 'linkedin_url'];
    for (const field of urlFields) {
      if (editData[field] && !isValidUrl(editData[field])) return;
    }

    const sanitizedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(editData)) {
      sanitizedData[key] = typeof value === 'string' ? sanitizeTextInput(value) : value;
    }

    if (client.client_type === 'company' && companyData) {
      const companySections = ['contact', 'company_details', 'address', 'hr', 'billing_contact'];
      if (companySections.includes(section)) {
        updateCompany.mutate({ id: companyData.id, clientId: client.id, ...sanitizedData }, { onSuccess: () => setEditingSection(null) });
        return;
      }
    }
    updateClient.mutate({ id: client.id, ...sanitizedData }, { onSuccess: () => setEditingSection(null) });
  };

  const EditActions = ({ section }: { section: string }) => (
    <div className="flex justify-end gap-2 mt-3">
      <Button variant="outline" size="sm" onClick={() => setEditingSection(null)}>Cancel</Button>
      <Button size="sm" onClick={() => handleSave(section)}>Save</Button>
    </div>
  );

  const EditButton = ({ section, data }: { section: string; data: Record<string, any> }) => {
    if (!can('editClients')) return null;
    return (
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(section, data)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    );
  };

  const riskProfileCard = (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Client Profile</CardTitle>
        <EditButton section="profile" data={{
          priority_level: client.priority_level || 'standard',
          risk_score: client.risk_score || 5,
          payment_score: client.payment_score || 5,
          credit_limit: client.credit_limit || 0,
          currency: client.currency || 'EUR',
          payment_terms: client.payment_terms || '',
          vat_number: client.vat_number || '',
          vat_verified: client.vat_verified || false,
          preferred_communication: client.preferred_communication || 'email',
          sla_terms: client.sla_terms || '',
        }} />
      </CardHeader>
      <CardContent>
        {editingSection === 'profile' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Priority Level</Label>
                <Select value={editData.priority_level} onValueChange={v => updateField('priority_level', v)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_LEVELS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Preferred Communication</Label>
                <Select value={editData.preferred_communication} onValueChange={v => updateField('preferred_communication', v)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMMUNICATION_CHANNELS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Risk Score: {editData.risk_score}/10</Label>
                <Slider value={[editData.risk_score]} onValueChange={([v]) => updateField('risk_score', v)} min={1} max={10} step={1} className="mt-2" />
              </div>
              <div>
                <Label className="text-xs">Payment Score: {editData.payment_score}/10</Label>
                <Slider value={[editData.payment_score]} onValueChange={([v]) => updateField('payment_score', v)} min={1} max={10} step={1} className="mt-2" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Credit Limit</Label>
                <Input type="number" maxLength={15} value={editData.credit_limit} onChange={e => updateField('credit_limit', Number(e.target.value))} className="h-8" />
              </div>
              <div>
                <Label className="text-xs">Currency</Label>
                <Select value={editData.currency} onValueChange={v => updateField('currency', v)}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Payment Terms</Label>
                <Select value={editData.payment_terms || undefined} onValueChange={v => updateField('payment_terms', v)}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{PAYMENT_TERMS_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">VAT Number</Label>
                <Input maxLength={50} value={editData.vat_number} onChange={e => updateField('vat_number', e.target.value)} className="h-8" />
              </div>
              <div>
                <Label className="text-xs">SLA Terms</Label>
                <Input maxLength={500} value={editData.sla_terms} onChange={e => updateField('sla_terms', e.target.value)} className="h-8" />
              </div>
            </div>
            <EditActions section="profile" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Risk Score</p>
                <p className={`text-xl font-bold ${getRiskColor(client.risk_score)}`}>{client.risk_score || '—'}/10</p>
                <p className={`text-xs ${getRiskColor(client.risk_score)}`}>{getRiskLabel(client.risk_score)}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Pay Score</p>
                <p className={`text-xl font-bold ${getPayScoreColor(client.payment_score)}`}>{client.payment_score || '—'}/10</p>
                <p className={`text-xs ${getPayScoreColor(client.payment_score)}`}>{getPayScoreLabel(client.payment_score)}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Credit Limit</p>
                <p className="text-xl font-bold">{client.credit_limit ? `€${Number(client.credit_limit).toLocaleString()}` : '—'}</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Currency</p>
                <p className="text-xl font-bold">{client.currency || 'EUR'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {client.payment_terms && <span>Payment: {PAYMENT_TERMS_OPTIONS.find(p => p.value === client.payment_terms)?.label || client.payment_terms}</span>}
              {client.vat_number && <span>VAT: {client.vat_number} {client.vat_verified ? '✓' : '✗'}</span>}
              {client.preferred_communication && <span>Comms: {COMMUNICATION_CHANNELS.find(c => c.value === client.preferred_communication)?.label}</span>}
              {client.sla_terms && <span>SLA: {client.sla_terms}</span>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (client.client_type === 'company' && companyData) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {riskProfileCard}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Contact</CardTitle>
            <EditButton section="contact" data={{ primary_contact_name: companyData.primary_contact_name || '', primary_contact_position: companyData.primary_contact_position || '', primary_contact_email: companyData.primary_contact_email || '', primary_contact_phone: companyData.primary_contact_phone || '' }} />
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {editingSection === 'contact' ? (
              <div className="space-y-2">
                <Input placeholder="Name" maxLength={100} value={editData.primary_contact_name || ''} onChange={e => updateField('primary_contact_name', e.target.value)} className="h-8" />
                <Input placeholder="Position" maxLength={100} value={editData.primary_contact_position || ''} onChange={e => updateField('primary_contact_position', e.target.value)} className="h-8" />
                <Input placeholder="Email" type="email" maxLength={254} value={editData.primary_contact_email || ''} onChange={e => updateField('primary_contact_email', e.target.value)} className="h-8" />
                {editData.primary_contact_email && !isValidEmail(editData.primary_contact_email) && <p className="text-xs text-destructive">Invalid email</p>}
                <Input placeholder="Phone" maxLength={20} value={editData.primary_contact_phone || ''} onChange={e => updateField('primary_contact_phone', e.target.value)} className="h-8" />
                <EditActions section="contact" />
              </div>
            ) : (
              <>
                <p>{companyData.primary_contact_name} — {companyData.primary_contact_position}</p>
                <p className="text-muted-foreground">{companyData.primary_contact_email}</p>
                <p className="text-muted-foreground">{companyData.primary_contact_phone}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Company Details</CardTitle>
            <EditButton section="company_details" data={{ legal_name: companyData.legal_name || '', registration_number: companyData.registration_number || '', industry: companyData.industry || '', company_size: companyData.company_size || '', website: companyData.website || '', linkedin_url: companyData.linkedin_url || '', founded_year: companyData.founded_year || '', description: companyData.description || '' }} />
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {editingSection === 'company_details' ? (
              <div className="space-y-2">
                <Input placeholder="Legal Name" maxLength={100} value={editData.legal_name || ''} onChange={e => updateField('legal_name', e.target.value)} className="h-8" />
                <Input placeholder="Registration Number" maxLength={50} value={editData.registration_number || ''} onChange={e => updateField('registration_number', e.target.value)} className="h-8" />
                <Input placeholder="Industry" maxLength={100} value={editData.industry || ''} onChange={e => updateField('industry', e.target.value)} className="h-8" />
                <Select value={editData.company_size || undefined} onValueChange={v => updateField('company_size', v)}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Company Size" /></SelectTrigger>
                  <SelectContent>{['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Website (https://...)" maxLength={500} value={editData.website || ''} onChange={e => updateField('website', e.target.value)} className="h-8" />
                {editData.website && !isValidUrl(editData.website) && <p className="text-xs text-destructive">Must start with http:// or https://</p>}
                <Input placeholder="LinkedIn URL (https://...)" maxLength={500} value={editData.linkedin_url || ''} onChange={e => updateField('linkedin_url', e.target.value)} className="h-8" />
                {editData.linkedin_url && !isValidUrl(editData.linkedin_url) && <p className="text-xs text-destructive">Must start with http:// or https://</p>}
                <Input placeholder="Founded Year" maxLength={4} value={editData.founded_year || ''} onChange={e => updateField('founded_year', e.target.value)} className="h-8" />
                <Textarea placeholder="Description" maxLength={2000} value={editData.description || ''} onChange={e => updateField('description', e.target.value)} rows={2} />
                <EditActions section="company_details" />
              </div>
            ) : (
              <>
                {companyData.legal_name && <p>Legal: {companyData.legal_name}</p>}
                {companyData.registration_number && <p>Reg: {companyData.registration_number}</p>}
                {companyData.industry && <p>Industry: {companyData.industry}</p>}
                {companyData.company_size && <p>Size: {companyData.company_size}</p>}
                {companyData.website && <p>Web: {companyData.website}</p>}
                {companyData.linkedin_url && <p>LinkedIn: {companyData.linkedin_url}</p>}
                {companyData.founded_year && <p>Founded: {companyData.founded_year}</p>}
                {companyData.description && <p className="text-muted-foreground">{companyData.description}</p>}
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Address</CardTitle>
            <EditButton section="address" data={{ headquarters_address: companyData.headquarters_address || '', headquarters_city: companyData.headquarters_city || '', headquarters_country: companyData.headquarters_country || '', postal_code: companyData.postal_code || '' }} />
          </CardHeader>
          <CardContent className="text-sm">
            {editingSection === 'address' ? (
              <div className="space-y-2">
                <Input placeholder="Address" maxLength={500} value={editData.headquarters_address || ''} onChange={e => updateField('headquarters_address', e.target.value)} className="h-8" />
                <Input placeholder="City" maxLength={100} value={editData.headquarters_city || ''} onChange={e => updateField('headquarters_city', e.target.value)} className="h-8" />
                <Input placeholder="Country" maxLength={100} value={editData.headquarters_country || ''} onChange={e => updateField('headquarters_country', e.target.value)} className="h-8" />
                <Input placeholder="Postal Code" maxLength={20} value={editData.postal_code || ''} onChange={e => updateField('postal_code', e.target.value)} className="h-8" />
                <EditActions section="address" />
              </div>
            ) : (
              <>
                <p>{companyData.headquarters_address}</p>
                <p>{companyData.headquarters_city}, {companyData.headquarters_country} {companyData.postal_code}</p>
              </>
            )}
          </CardContent>
        </Card>
        {(companyData.hr_contact_name || editingSection === 'hr') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">HR Contact</CardTitle>
              <EditButton section="hr" data={{ hr_contact_name: companyData.hr_contact_name || '', hr_contact_email: companyData.hr_contact_email || '' }} />
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {editingSection === 'hr' ? (
                <div className="space-y-2">
                  <Input placeholder="Name" maxLength={100} value={editData.hr_contact_name || ''} onChange={e => updateField('hr_contact_name', e.target.value)} className="h-8" />
                  <Input placeholder="Email" type="email" maxLength={254} value={editData.hr_contact_email || ''} onChange={e => updateField('hr_contact_email', e.target.value)} className="h-8" />
                  {editData.hr_contact_email && !isValidEmail(editData.hr_contact_email) && <p className="text-xs text-destructive">Invalid email</p>}
                  <EditActions section="hr" />
                </div>
              ) : (
                <>
                  <p>{companyData.hr_contact_name}</p>
                  <p className="text-muted-foreground">{companyData.hr_contact_email}</p>
                </>
              )}
            </CardContent>
          </Card>
        )}
        {(companyData.billing_contact_name || editingSection === 'billing_contact') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Billing Contact</CardTitle>
              <EditButton section="billing_contact" data={{ billing_contact_name: companyData.billing_contact_name || '', billing_contact_email: companyData.billing_contact_email || '' }} />
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {editingSection === 'billing_contact' ? (
                <div className="space-y-2">
                  <Input placeholder="Name" maxLength={100} value={editData.billing_contact_name || ''} onChange={e => updateField('billing_contact_name', e.target.value)} className="h-8" />
                  <Input placeholder="Email" type="email" maxLength={254} value={editData.billing_contact_email || ''} onChange={e => updateField('billing_contact_email', e.target.value)} className="h-8" />
                  {editData.billing_contact_email && !isValidEmail(editData.billing_contact_email) && <p className="text-xs text-destructive">Invalid email</p>}
                  <EditActions section="billing_contact" />
                </div>
              ) : (
                <>
                  <p>{companyData.billing_contact_name}</p>
                  <p className="text-muted-foreground">{companyData.billing_contact_email}</p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Individual client
  return (
    <div className="grid grid-cols-2 gap-4">
      {riskProfileCard}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Personal Info</CardTitle>
          <EditButton section="personal" data={{ first_name: client.first_name || '', last_name: client.last_name || '', email: client.email || '', phone: client.phone || '', date_of_birth: client.date_of_birth || '', nationality: client.nationality || '' }} />
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          {editingSection === 'personal' ? (
            <div className="space-y-2">
              <Input placeholder="First Name" maxLength={100} value={editData.first_name || ''} onChange={e => updateField('first_name', e.target.value)} className="h-8" />
              <Input placeholder="Last Name" maxLength={100} value={editData.last_name || ''} onChange={e => updateField('last_name', e.target.value)} className="h-8" />
              <Input placeholder="Email" type="email" maxLength={254} value={editData.email || ''} onChange={e => updateField('email', e.target.value)} className="h-8" />
              {editData.email && !isValidEmail(editData.email) && <p className="text-xs text-destructive">Invalid email</p>}
              <Input placeholder="Phone" maxLength={20} value={editData.phone || ''} onChange={e => updateField('phone', e.target.value)} className="h-8" />
              <Input placeholder="Date of Birth" type="date" value={editData.date_of_birth || ''} onChange={e => updateField('date_of_birth', e.target.value)} className="h-8" />
              <Input placeholder="Nationality" maxLength={100} value={editData.nationality || ''} onChange={e => updateField('nationality', e.target.value)} className="h-8" />
              <EditActions section="personal" />
            </div>
          ) : (
            <>
              <p>{client.first_name} {client.last_name}</p>
              <p className="text-muted-foreground">{client.email}</p>
              {client.phone && <p className="text-muted-foreground">{client.phone}</p>}
              {client.date_of_birth && <p>DOB: {client.date_of_birth}</p>}
              {client.nationality && <p>Nationality: {client.nationality}</p>}
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Address</CardTitle>
          <EditButton section="ind_address" data={{ address_line1: client.address_line1 || '', address_line2: client.address_line2 || '', city: client.city || '', country: client.country || '', postal_code: client.postal_code || '' }} />
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          {editingSection === 'ind_address' ? (
            <div className="space-y-2">
              <Input placeholder="Address Line 1" maxLength={500} value={editData.address_line1 || ''} onChange={e => updateField('address_line1', e.target.value)} className="h-8" />
              <Input placeholder="Address Line 2" maxLength={500} value={editData.address_line2 || ''} onChange={e => updateField('address_line2', e.target.value)} className="h-8" />
              <Input placeholder="City" maxLength={100} value={editData.city || ''} onChange={e => updateField('city', e.target.value)} className="h-8" />
              <Input placeholder="Country" maxLength={100} value={editData.country || ''} onChange={e => updateField('country', e.target.value)} className="h-8" />
              <Input placeholder="Postal Code" maxLength={20} value={editData.postal_code || ''} onChange={e => updateField('postal_code', e.target.value)} className="h-8" />
              <EditActions section="ind_address" />
            </div>
          ) : (
            <>
              {client.address_line1 && <p>{client.address_line1}</p>}
              {client.address_line2 && <p>{client.address_line2}</p>}
              <p>{[client.city, client.country, client.postal_code].filter(Boolean).join(', ')}</p>
            </>
          )}
        </CardContent>
      </Card>
      {(client.id_document_type || editingSection === 'id_doc') && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">ID Document</CardTitle>
            <EditButton section="id_doc" data={{ id_document_type: client.id_document_type || '', id_document_number: client.id_document_number || '', id_document_expiry: client.id_document_expiry || '' }} />
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {editingSection === 'id_doc' ? (
              <div className="space-y-2">
                <Select value={editData.id_document_type || undefined} onValueChange={v => updateField('id_document_type', v)}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Document Type" /></SelectTrigger>
                  <SelectContent>{['passport', 'national_id', 'drivers_license', 'residence_permit'].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Document Number" maxLength={50} value={editData.id_document_number || ''} onChange={e => updateField('id_document_number', e.target.value)} className="h-8" />
                <Input placeholder="Expiry Date" type="date" value={editData.id_document_expiry || ''} onChange={e => updateField('id_document_expiry', e.target.value)} className="h-8" />
                <EditActions section="id_doc" />
              </div>
            ) : (
              <>
                <p>Type: {client.id_document_type}</p>
                <p>Number: {client.id_document_number}</p>
                {client.id_document_expiry && <p>Expires: {client.id_document_expiry}</p>}
              </>
            )}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Billing Info</CardTitle>
          <EditButton section="ind_billing" data={{ billing_name: client.billing_name || '', billing_email: client.billing_email || '', billing_address: client.billing_address || '', tax_id: client.tax_id || '' }} />
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          {editingSection === 'ind_billing' ? (
            <div className="space-y-2">
              <Input placeholder="Billing Name" maxLength={100} value={editData.billing_name || ''} onChange={e => updateField('billing_name', e.target.value)} className="h-8" />
              <Input placeholder="Billing Email" type="email" maxLength={254} value={editData.billing_email || ''} onChange={e => updateField('billing_email', e.target.value)} className="h-8" />
              {editData.billing_email && !isValidEmail(editData.billing_email) && <p className="text-xs text-destructive">Invalid email</p>}
              <Input placeholder="Billing Address" maxLength={500} value={editData.billing_address || ''} onChange={e => updateField('billing_address', e.target.value)} className="h-8" />
              <Input placeholder="Tax ID" maxLength={50} value={editData.tax_id || ''} onChange={e => updateField('tax_id', e.target.value)} className="h-8" />
              <EditActions section="ind_billing" />
            </div>
          ) : (
            <>
              {client.billing_name && <p>{client.billing_name}</p>}
              {client.billing_email && <p className="text-muted-foreground">{client.billing_email}</p>}
              {client.billing_address && <p>{client.billing_address}</p>}
              {client.tax_id && <p>Tax ID: {client.tax_id}</p>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Contacts Tab ─────────────────────────────────────────
function ContactsTab({ clientId }: { clientId: string }) {
  const { can } = usePermissions();
  const { data: contacts = [] } = useClientContacts(clientId);
  const createContact = useCreateClientContact();
  const updateContact = useUpdateClientContact();
  const deleteContact = useDeleteClientContact();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const startAdd = () => { setForm({ client_id: clientId }); setEditId(null); setShowForm(true); };
  const startEditContact = (c: any) => { setForm({ ...c }); setEditId(c.id); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name?.trim()) return;
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(form)) {
      sanitized[key] = typeof value === 'string' ? sanitizeTextInput(value) : value;
    }
    if (editId) {
      await updateContact.mutateAsync({ id: editId, client_id: clientId, name: sanitized.name, email: sanitized.email, phone: sanitized.phone, position: sanitized.position, department: sanitized.department, contact_type: sanitized.contact_type || 'general', is_primary: sanitized.is_primary || false, notes: sanitized.notes });
    } else {
      await createContact.mutateAsync({ client_id: clientId, name: sanitized.name, email: sanitized.email, phone: sanitized.phone, position: sanitized.position, department: sanitized.department, contact_type: sanitized.contact_type || 'general', is_primary: sanitized.is_primary || false, notes: sanitized.notes });
    }
    setShowForm(false); setForm({});
  };

  return (
    <div className="space-y-4">
      {can('editClients') && (
        <div className="flex justify-end">
          <Button size="sm" className="gap-1" onClick={startAdd}><Plus className="h-4 w-4" /> Add Contact</Button>
        </div>
      )}
      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Name *</Label><Input maxLength={100} value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-8" /></div>
              <div><Label className="text-xs">Email</Label><Input maxLength={254} type="email" value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="h-8" /></div>
              <div><Label className="text-xs">Phone</Label><Input maxLength={20} value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="h-8" /></div>
              <div><Label className="text-xs">Position</Label><Input maxLength={100} value={form.position || ''} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} className="h-8" /></div>
              <div><Label className="text-xs">Department</Label><Input maxLength={100} value={form.department || ''} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="h-8" /></div>
              <div><Label className="text-xs">Type</Label>
                <Select value={form.contact_type || 'general'} onValueChange={v => setForm(p => ({ ...p, contact_type: v }))}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{['general', 'billing', 'technical', 'hr', 'legal'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={!form.name?.trim()}>{editId ? 'Update' : 'Add'}</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {contacts.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground text-center py-8">No contacts added yet</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Email</th>
              <th className="text-left px-4 py-2 font-medium">Phone</th>
              <th className="text-left px-4 py-2 font-medium">Position</th>
              <th className="text-left px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2"></th>
            </tr></thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium flex items-center gap-1">
                    {c.is_primary && <Star className="h-3 w-3 text-amber-500" />}
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone || '—'}</td>
                  <td className="px-4 py-3">{c.position || '—'}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{c.contact_type || 'general'}</Badge></td>
                  <td className="px-4 py-3">
                    {can('editClients') && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditContact(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Contact</AlertDialogTitle>
                              <AlertDialogDescription>Are you sure you want to remove this contact?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteContact.mutate({ id: c.id, client_id: clientId })}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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

// ─── Meetings Tab ─────────────────────────────────────────
function MeetingsTab({ clientId }: { clientId: string }) {
  const { can } = usePermissions();
  const { data: meetings = [] } = useClientMeetings(clientId);
  const createMeeting = useCreateClientMeeting();
  const updateMeeting = useUpdateClientMeeting();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const handleCreate = async () => {
    if (!form.title?.trim() || !form.meeting_date) return;
    await createMeeting.mutateAsync({
      client_id: clientId,
      title: sanitizeTextInput(form.title),
      meeting_date: form.meeting_date,
      duration_minutes: Number(form.duration_minutes) || 60,
      meeting_type: form.meeting_type || 'video',
      location: form.location ? sanitizeTextInput(form.location) : null,
      agenda: form.agenda ? sanitizeTextInput(form.agenda) : null,
      status: 'scheduled',
    });
    setForm({}); setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {can('editClients') && (
        <div className="flex justify-end">
          <Button size="sm" className="gap-1" onClick={() => setShowForm(true)}><Calendar className="h-4 w-4" /> Schedule Meeting</Button>
        </div>
      )}
      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Title *</Label><Input maxLength={200} value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="h-8" /></div>
              <div><Label className="text-xs">Date *</Label><Input type="datetime-local" value={form.meeting_date || ''} onChange={e => setForm(p => ({ ...p, meeting_date: e.target.value }))} className="h-8" /></div>
              <div><Label className="text-xs">Duration (min)</Label><Input type="number" maxLength={4} value={form.duration_minutes || 60} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} className="h-8" /></div>
              <div><Label className="text-xs">Type</Label>
                <Select value={form.meeting_type || 'video'} onValueChange={v => setForm(p => ({ ...p, meeting_type: v }))}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{['in_person', 'video', 'phone', 'other'].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label className="text-xs">Location</Label><Input maxLength={200} value={form.location || ''} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="h-8" /></div>
              <div className="col-span-2"><Label className="text-xs">Agenda</Label><Textarea maxLength={2000} value={form.agenda || ''} onChange={e => setForm(p => ({ ...p, agenda: e.target.value }))} rows={2} /></div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={!form.title?.trim() || !form.meeting_date}>Schedule</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {meetings.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground text-center py-8">No meetings scheduled</p>
      ) : (
        <div className="grid gap-3">
          {meetings.map(m => {
            const statusConfig = MEETING_STATUS_CONFIG[m.status as keyof typeof MEETING_STATUS_CONFIG];
            return (
              <Card key={m.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{m.title}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(m.meeting_date), 'PPP p')} • {m.duration_minutes} min</p>
                      {m.location && <p className="text-sm text-muted-foreground">{m.location}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{m.meeting_type?.replace(/_/g, ' ')}</Badge>
                      {statusConfig && <Badge className={statusConfig.color}>{statusConfig.label}</Badge>}
                    </div>
                  </div>
                  {m.outcome && <p className="text-sm mt-2 border-t pt-2">Outcome: {m.outcome}</p>}
                  {can('editClients') && m.status === 'scheduled' && (
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => updateMeeting.mutate({ id: m.id, client_id: clientId, status: 'completed' })}>Complete</Button>
                      <Button variant="outline" size="sm" onClick={() => updateMeeting.mutate({ id: m.id, client_id: clientId, status: 'cancelled' })}>Cancel</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Relationships Tab (15e enhanced) ─────────────────────
const RELATIONSHIP_TYPE_CONFIG: Record<string, { label: string; groupLabel: string; icon: any; color: string }> = {
  parent: { label: 'Parent Company', groupLabel: 'Parent Companies', icon: Building2, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  subsidiary: { label: 'Subsidiary', groupLabel: 'Subsidiaries', icon: GitBranch, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  referral: { label: 'Referral', groupLabel: 'Referrals', icon: UserPlus, color: 'text-green-600 bg-green-50 border-green-200' },
  partner: { label: 'Partner', groupLabel: 'Partners', icon: Handshake, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  related: { label: 'Related', groupLabel: 'Related', icon: Link2, color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

function RelationshipsTab({ clientId }: { clientId: string }) {
  const { can } = usePermissions();
  const navigate = useNavigate();
  const { data: relationships } = useClientRelationships(clientId);
  const createRel = useCreateClientRelationship();
  const deleteRel = useDeleteClientRelationship();
  const { data: allClients = [] } = useClients();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  // Merge outgoing relationships (this is the primary direction)
  const allRels = relationships?.outgoing || [];

  // Fetch related client names
  const relClientIds = allRels.map(r => r.related_client_id);
  const { data: relClients = [] } = useQuery({
    queryKey: ['rel-client-names', relClientIds],
    queryFn: async () => {
      if (relClientIds.length === 0) return [];
      const { data } = await supabase.from('clients').select('id, first_name, last_name, status, client_type, company_id').in('id', relClientIds);
      // Also fetch company names
      const companyIds = (data || []).filter(c => c.company_id).map(c => c.company_id!);
      const { data: companies } = companyIds.length > 0
        ? await supabase.from('companies').select('id, company_name').in('id', companyIds)
        : { data: [] };
      const companyMap = new Map((companies || []).map(c => [c.id, c.company_name]));
      return (data || []).map(c => ({
        ...c,
        display_name: c.client_type === 'company' ? (companyMap.get(c.company_id!) || 'Unknown') : `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      }));
    },
    enabled: relClientIds.length > 0,
  });

  const clientMap = new Map(relClients.map(c => [c.id, c]));

  // Group by type
  const grouped = ['parent', 'subsidiary', 'referral', 'partner', 'related'].map(type => ({
    type,
    config: RELATIONSHIP_TYPE_CONFIG[type],
    items: allRels.filter(r => r.relationship_type === type),
  }));

  const handleCreate = async () => {
    if (!form.related_client_id || !form.relationship_type) return;
    await createRel.mutateAsync({
      client_id: clientId,
      related_client_id: form.related_client_id,
      relationship_type: form.relationship_type,
      notes: form.notes ? sanitizeTextInput(form.notes) : null,
    });
    setForm({}); setShowDialog(false);
  };

  const filteredClients = allClients.filter(c => c.id !== clientId);

  return (
    <div className="space-y-4">
      {can('editClients') && (
        <div className="flex justify-end">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Add Relationship</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Relationship</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Relationship Type</Label>
                  <Select value={form.relationship_type || ''} onValueChange={v => setForm(p => ({ ...p, relationship_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(RELATIONSHIP_TYPE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Client</Label>
                  <Select value={form.related_client_id || ''} onValueChange={v => setForm(p => ({ ...p, related_client_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                    <SelectContent>
                      {filteredClients.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.display_name} ({c.client_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Textarea maxLength={2000} value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!form.related_client_id || !form.relationship_type}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {grouped.map(({ type, config, items }) => {
        const Icon = config.icon;
        return (
          <div key={type} className="border rounded-lg p-4">
            <h3 className="text-sm font-medium flex items-center gap-2 mb-3">
              <Icon className="h-4 w-4" /> {config.groupLabel}
            </h3>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">(No {config.groupLabel.toLowerCase()} yet)</p>
            ) : (
              <div className="space-y-2">
                {items.map(rel => {
                  const relClient = clientMap.get(rel.related_client_id);
                  return (
                    <div key={rel.id} className="flex items-center justify-between p-2 border rounded-lg bg-muted/30">
                      <div className="flex-1">
                        <button onClick={() => navigate(`/clients/${rel.related_client_id}`)} className="text-sm font-medium text-primary hover:underline">
                          {relClient?.display_name || 'Unknown'}
                        </button>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                          {relClient?.status && <span>Status: {relClient.status}</span>}
                          <span>Since: {format(new Date(rel.created_at), 'MMM yyyy')}</span>
                        </div>
                        {rel.notes && <p className="text-xs text-muted-foreground mt-1">"{rel.notes}"</p>}
                      </div>
                      {can('editClients') && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><X className="h-3.5 w-3.5 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Relationship</AlertDialogTitle>
                              <AlertDialogDescription>Remove this relationship? This will also remove the inverse relationship on the related client.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteRel.mutate({ id: rel.id, client_id: clientId, related_client_id: rel.related_client_id, relationship_type: rel.relationship_type })}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Custom Fields Tab ────────────────────────────────────
function CustomFieldsTab({ clientId }: { clientId: string }) {
  const { can } = usePermissions();
  const { data: fields = [] } = useClientCustomFields(clientId);
  const upsertField = useUpsertClientCustomField();
  const deleteField = useDeleteClientCustomField();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const handleSave = async () => {
    if (!form.field_name?.trim()) return;
    await upsertField.mutateAsync({
      client_id: clientId,
      field_name: sanitizeTextInput(form.field_name),
      field_value: sanitizeTextInput(form.field_value || ''),
      field_type: form.field_type || 'text',
    });
    setForm({}); setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {can('editClients') && (
        <div className="flex justify-end">
          <Button size="sm" className="gap-1" onClick={() => { setForm({}); setShowForm(true); }}><Plus className="h-4 w-4" /> Add Field</Button>
        </div>
      )}
      {showForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Field Name *</Label><Input maxLength={100} value={form.field_name || ''} onChange={e => setForm(p => ({ ...p, field_name: e.target.value }))} className="h-8" /></div>
              <div><Label className="text-xs">Value</Label><Input maxLength={500} value={form.field_value || ''} onChange={e => setForm(p => ({ ...p, field_value: e.target.value }))} className="h-8" /></div>
              <div><Label className="text-xs">Type</Label>
                <Select value={form.field_type || 'text'} onValueChange={v => setForm(p => ({ ...p, field_type: v }))}>
                  <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{['text', 'number', 'date', 'boolean', 'url'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={!form.field_name?.trim()}>Save</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {fields.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground text-center py-8">No custom fields yet</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2 font-medium">Field Name</th>
              <th className="text-left px-4 py-2 font-medium">Value</th>
              <th className="text-left px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2"></th>
            </tr></thead>
            <tbody>
              {fields.map(f => (
                <tr key={f.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{f.field_name}</td>
                  <td className="px-4 py-3">{f.field_value || '—'}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{f.field_type}</Badge></td>
                  <td className="px-4 py-3">
                    {can('editClients') && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setForm({ field_name: f.field_name, field_value: f.field_value, field_type: f.field_type }); setShowForm(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteField.mutate({ id: f.id, client_id: clientId })}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </div>
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

// ─── Documents Tab (15f enhanced with folders & versioning) ─
function DocumentsTab({ clientId, userId }: { clientId: string; userId?: string }) {
  const { can } = usePermissions();
  const [activeFolder, setActiveFolder] = useState('all');
  const { data: docs = [] } = useClientDocuments(clientId, activeFolder);
  const { data: allDocs = [] } = useClientDocuments(clientId, 'all');
  const uploadDoc = useUploadClientDocument();
  const deleteDoc = useDeleteClientDocument();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState<Record<string, any>>({ folder: 'general', doc_type: 'other' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parentDoc, setParentDoc] = useState<any>(null);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  // Folder counts
  const folderCounts = DOCUMENT_FOLDERS.reduce((acc, f) => {
    acc[f] = allDocs.filter(d => d.folder === f).length;
    return acc;
  }, {} as Record<string, number>);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setUploadForm(p => ({ ...p, name: acceptedFiles[0].name.replace(/\.[^.]+$/, ''), folder: activeFolder !== 'all' ? activeFolder : 'general' }));
      setParentDoc(null);
      setUploadOpen(true);
    }
  }, [activeFolder]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxSize: 10 * 1024 * 1024 });

  const handleUpload = async () => {
    if (!selectedFile) return;
    await uploadDoc.mutateAsync({
      client_id: clientId,
      file: selectedFile,
      name: sanitizeTextInput(uploadForm.name || selectedFile.name),
      doc_type: uploadForm.doc_type || 'other',
      folder: uploadForm.folder || 'general',
      description: uploadForm.description ? sanitizeTextInput(uploadForm.description) : undefined,
      parent_document_id: parentDoc?.parent_document_id || parentDoc?.id || undefined,
      version: parentDoc ? (parentDoc.version || 1) + 1 : 1,
    });
    setSelectedFile(null); setUploadForm({ folder: 'general', doc_type: 'other' }); setParentDoc(null); setUploadOpen(false);
  };

  const startNewVersion = (doc: any) => {
    setParentDoc(doc);
    setUploadForm({ name: doc.name, folder: doc.folder || 'general', doc_type: doc.doc_type, description: '' });
    setSelectedFile(null);
    setUploadOpen(true);
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return '📊';
    if (['doc', 'docx', 'txt'].includes(ext || '')) return '📝';
    return '📁';
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Group: show only root docs (no parent_document_id) and latest versions
  const rootDocs = docs.filter(d => !d.parent_document_id);
  const versionCounts = new Map<string, number>();
  for (const d of allDocs) {
    const rootId = d.parent_document_id || d.id;
    versionCounts.set(rootId, (versionCounts.get(rootId) || 0) + 1);
  }

  return (
    <div className="flex gap-4">
      {/* Folder sidebar */}
      <div className="w-48 shrink-0 border rounded-lg p-3 space-y-1">
        <p className="text-xs font-medium text-muted-foreground mb-2">Folders</p>
        <button onClick={() => setActiveFolder('all')} className={`w-full text-left text-sm px-2 py-1.5 rounded flex items-center justify-between ${activeFolder === 'all' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}>
          <span className="flex items-center gap-1.5"><Folder className="h-3.5 w-3.5" /> All</span>
          <span className="text-xs text-muted-foreground">{allDocs.length}</span>
        </button>
        {DOCUMENT_FOLDERS.map(f => (
          <button key={f} onClick={() => setActiveFolder(f)} className={`w-full text-left text-sm px-2 py-1.5 rounded flex items-center justify-between capitalize ${activeFolder === f ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}>
            <span className="flex items-center gap-1.5"><Folder className="h-3.5 w-3.5" /> {f}</span>
            <span className="text-xs text-muted-foreground">{folderCounts[f] || 0}</span>
          </button>
        ))}
      </div>

      {/* Document grid */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Documents {activeFolder !== 'all' && `in: ${activeFolder}`}</h3>
          {can('editClients') && (
            <Button size="sm" className="gap-1" onClick={() => { setParentDoc(null); setUploadForm({ folder: activeFolder !== 'all' ? activeFolder : 'general', doc_type: 'other' }); setUploadOpen(true); }}>
              <Upload className="h-4 w-4" /> Upload Document
            </Button>
          )}
        </div>

        {/* Drop zone */}
        {can('editClients') && (
          <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'}`}>
            <input {...getInputProps()} />
            <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Drop files here or click to upload (max 10MB)</p>
          </div>
        )}

        {/* Upload dialog */}
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{parentDoc ? 'Upload New Version' : 'Upload Document'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {!selectedFile && (
                <div>
                  <Label className="text-xs">File</Label>
                  <Input type="file" onChange={e => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg" />
                </div>
              )}
              {selectedFile && <p className="text-sm">Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})</p>}
              <div><Label className="text-xs">Document Name</Label><Input maxLength={200} value={uploadForm.name || ''} onChange={e => setUploadForm(p => ({ ...p, name: e.target.value }))} className="h-8" /></div>
              <div><Label className="text-xs">Description</Label><Textarea maxLength={2000} value={uploadForm.description || ''} onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Folder</Label>
                  <Select value={uploadForm.folder} onValueChange={v => setUploadForm(p => ({ ...p, folder: v }))}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{DOCUMENT_FOLDERS.map(f => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Document Type</Label>
                  <Select value={uploadForm.doc_type} onValueChange={v => setUploadForm(p => ({ ...p, doc_type: v }))}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{['contract', 'invoice', 'report', 'proposal', 'correspondence', 'id_document', 'other'].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
                <Button onClick={handleUpload} disabled={!selectedFile || uploadDoc.isPending}>Upload</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Document cards */}
        {rootDocs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No documents in this folder</p>
        ) : (
          <div className="space-y-3">
            {rootDocs.map(doc => {
              const verCount = versionCounts.get(doc.id) || 1;
              const isExpanded = expandedVersions.has(doc.id);
              return (
                <Card key={doc.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <span className="text-2xl">{getFileIcon(doc.name)}</span>
                        <div>
                          <p className="font-medium text-sm">{doc.name} v{doc.version || 1}</p>
                          {doc.description && <p className="text-xs text-muted-foreground truncate max-w-md">{doc.description}</p>}
                          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                            <span>{formatFileSize(doc.file_size)}</span>
                            {verCount > 1 && (
                              <button className="text-primary hover:underline flex items-center gap-0.5" onClick={() => setExpandedVersions(prev => { const next = new Set(prev); next.has(doc.id) ? next.delete(doc.id) : next.add(doc.id); return next; })}>
                                {verCount} versions {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </button>
                            )}
                            <span>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {can('editClients') && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => startNewVersion(doc)}>New Version</Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                  <AlertDialogDescription>Delete this document and all its versions?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteDoc.mutate({ id: doc.id, client_id: clientId, storage_path: doc.storage_path })}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Version history */}
                    {isExpanded && <VersionHistory rootId={doc.id} />}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function VersionHistory({ rootId }: { rootId: string }) {
  const { data: versions = [] } = useQuery({
    queryKey: ['client-document-versions', rootId],
    queryFn: async () => {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rootId)) return [];
      const { data } = await supabase.from('client_documents').select('*').or(`id.eq.${rootId},parent_document_id.eq.${rootId}`).order('version', { ascending: false });
      return data || [];
    },
  });

  return (
    <div className="mt-3 border-t pt-3 space-y-1">
      {versions.map(v => (
        <div key={v.id} className="flex items-center justify-between text-xs text-muted-foreground px-2 py-1 hover:bg-muted/30 rounded">
          <span>v{v.version || 1} — {format(new Date(v.created_at), 'PP')} — {v.file_size ? `${(v.file_size / 1024).toFixed(0)} KB` : '—'}</span>
        </div>
      ))}
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
              <SelectContent>{availableProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {p.employer_name}</SelectItem>)}</SelectContent>
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
                    <td className="px-4 py-3"><button onClick={() => navigate(`/projects/${cp.project_id}`)} className="text-primary hover:underline font-medium">{project?.name || 'Unknown'}</button></td>
                    <td className="px-4 py-3"><Badge variant="outline">{project?.status}</Badge></td>
                    <td className="px-4 py-3 capitalize">{cp.role}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDistanceToNow(new Date(cp.created_at), { addSuffix: true })}</td>
                    <td className="px-4 py-3"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => unlinkProject.mutate({ clientId, projectId: cp.project_id })}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></td>
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
              <div><Label className="text-xs">Invoice Number</Label><Input value={invoiceForm.invoice_number || ''} onChange={e => setInvoiceForm(p => ({ ...p, invoice_number: e.target.value }))} className="h-9" maxLength={50} /></div>
              <div><Label className="text-xs">Description</Label><Textarea value={invoiceForm.description || ''} onChange={e => setInvoiceForm(p => ({ ...p, description: e.target.value }))} rows={2} maxLength={2000} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Amount</Label><Input type="number" value={invoiceForm.total_amount || ''} onChange={e => setInvoiceForm(p => ({ ...p, total_amount: e.target.value }))} className="h-9" /></div>
                <div><Label className="text-xs">Currency</Label>
                  <Select value={invoiceForm.currency || 'EUR'} onValueChange={v => setInvoiceForm(p => ({ ...p, currency: v }))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
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
    company_updated: Pencil,
    meeting_scheduled: Calendar,
    relationship_added: Link2,
  };

  const timeline = [
    ...notes.map(n => ({ type: 'note' as const, ...n, created_at: n.created_at })),
    ...activities.map(a => ({ type: 'activity' as const, ...a, created_at: a.created_at })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea placeholder="Add a note about this client..." value={noteContent} onChange={e => setNoteContent(e.target.value)} maxLength={5000} rows={2} className="flex-1" />
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
