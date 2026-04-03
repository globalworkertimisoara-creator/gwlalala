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
import { ArrowLeft, FolderOpen, FileText, DollarSign, AlertTriangle, Trash2, Plus, MessageSquare, Upload, Link as LinkIcon, Receipt, Activity, Pencil } from 'lucide-react';
import { useClient, useUpdateClient, useUpdateClientStatus, useUpdateCompany } from '@/hooks/useClients';
import { useClientProjects, useLinkClientToProject, useUnlinkClientFromProject } from '@/hooks/useClientProjects';
import { useClientNotes, useCreateClientNote, useDeleteClientNote } from '@/hooks/useClientNotes';
import { useClientActivityLog } from '@/hooks/useClientActivityLog';
import { useClientInvoices, useCreateClientInvoice } from '@/hooks/useClientInvoices';
import { useClientDocuments, useUploadClientDocument, useDeleteClientDocument } from '@/hooks/useClientDocuments';
import { CLIENT_STATUS_CONFIG, CLIENT_TYPE_CONFIG, getClientDisplayName, sanitizeTextInput, type ClientStatus } from '@/types/client';
import { formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useDropzone } from 'react-dropzone';

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
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

          {/* Quick-action bar */}
          <div className="flex gap-2 mb-4">
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

const isValidUrl = (url: string) => !url || /^https?:\/\//.test(url);
const isValidEmail = (email: string) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

function OverviewTab({ client, companyData }: { client: any; companyData: any }) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const updateClient = useUpdateClient();
  const updateCompany = useUpdateCompany();

  const startEdit = (section: string, data: Record<string, any>) => {
    setEditingSection(section);
    setEditData(data);
  };

  const updateField = (key: string, value: any) => {
    setEditData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (section: string) => {
    // Validate emails
    const emailFields = ['primary_contact_email', 'hr_contact_email', 'billing_contact_email', 'billing_email', 'email'];
    for (const field of emailFields) {
      if (editData[field] && !isValidEmail(editData[field])) return;
    }
    // Validate URLs
    const urlFields = ['website', 'linkedin_url'];
    for (const field of urlFields) {
      if (editData[field] && !isValidUrl(editData[field])) return;
    }

    if (client.client_type === 'company' && companyData) {
      // Company sections update the companies table
      const companySections = ['contact', 'company_details', 'address', 'hr', 'billing_contact'];
      if (companySections.includes(section)) {
        updateCompany.mutate(
          { id: companyData.id, clientId: client.id, ...editData },
          { onSuccess: () => setEditingSection(null) }
        );
        return;
      }
    }
    // Individual client or client-level fields
    updateClient.mutate(
      { id: client.id, ...editData },
      { onSuccess: () => setEditingSection(null) }
    );
  };

  const EditActions = ({ section }: { section: string }) => (
    <div className="flex justify-end gap-2 mt-3">
      <Button variant="outline" size="sm" onClick={() => setEditingSection(null)}>Cancel</Button>
      <Button size="sm" onClick={() => handleSave(section)}>Save</Button>
    </div>
  );

  const EditButton = ({ section, data }: { section: string; data: Record<string, any> }) => (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(section, data)}>
      <Pencil className="h-3.5 w-3.5" />
    </Button>
  );

  if (client.client_type === 'company' && companyData) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {/* Contact Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Contact</CardTitle>
            <EditButton section="contact" data={{
              primary_contact_name: companyData.primary_contact_name || '',
              primary_contact_position: companyData.primary_contact_position || '',
              primary_contact_email: companyData.primary_contact_email || '',
              primary_contact_phone: companyData.primary_contact_phone || '',
            }} />
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

        {/* Company Details Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Company Details</CardTitle>
            <EditButton section="company_details" data={{
              legal_name: companyData.legal_name || '',
              registration_number: companyData.registration_number || '',
              industry: companyData.industry || '',
              company_size: companyData.company_size || '',
              website: companyData.website || '',
              linkedin_url: companyData.linkedin_url || '',
              founded_year: companyData.founded_year || '',
              description: companyData.description || '',
            }} />
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {editingSection === 'company_details' ? (
              <div className="space-y-2">
                <Input placeholder="Legal Name" maxLength={100} value={editData.legal_name || ''} onChange={e => updateField('legal_name', e.target.value)} className="h-8" />
                <Input placeholder="Registration Number" maxLength={50} value={editData.registration_number || ''} onChange={e => updateField('registration_number', e.target.value)} className="h-8" />
                <Input placeholder="Industry" maxLength={100} value={editData.industry || ''} onChange={e => updateField('industry', e.target.value)} className="h-8" />
                <Select value={editData.company_size || undefined} onValueChange={v => updateField('company_size', v)}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Company Size" /></SelectTrigger>
                  <SelectContent>
                    {['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
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

        {/* Address Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Address</CardTitle>
            <EditButton section="address" data={{
              headquarters_address: companyData.headquarters_address || '',
              headquarters_city: companyData.headquarters_city || '',
              headquarters_country: companyData.headquarters_country || '',
              postal_code: companyData.postal_code || '',
            }} />
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

        {/* HR Contact Card */}
        {(companyData.hr_contact_name || editingSection === 'hr') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">HR Contact</CardTitle>
              <EditButton section="hr" data={{
                hr_contact_name: companyData.hr_contact_name || '',
                hr_contact_email: companyData.hr_contact_email || '',
              }} />
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

        {/* Billing Contact Card */}
        {(companyData.billing_contact_name || editingSection === 'billing_contact') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Billing Contact</CardTitle>
              <EditButton section="billing_contact" data={{
                billing_contact_name: companyData.billing_contact_name || '',
                billing_contact_email: companyData.billing_contact_email || '',
              }} />
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
      {/* Personal Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Personal Info</CardTitle>
          <EditButton section="personal" data={{
            first_name: client.first_name || '',
            last_name: client.last_name || '',
            email: client.email || '',
            phone: client.phone || '',
            date_of_birth: client.date_of_birth || '',
            nationality: client.nationality || '',
          }} />
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

      {/* Address */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Address</CardTitle>
          <EditButton section="ind_address" data={{
            address_line1: client.address_line1 || '',
            address_line2: client.address_line2 || '',
            city: client.city || '',
            country: client.country || '',
            postal_code: client.postal_code || '',
          }} />
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

      {/* ID Document */}
      {(client.id_document_type || editingSection === 'id_doc') && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">ID Document</CardTitle>
            <EditButton section="id_doc" data={{
              id_document_type: client.id_document_type || '',
              id_document_number: client.id_document_number || '',
              id_document_expiry: client.id_document_expiry || '',
            }} />
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {editingSection === 'id_doc' ? (
              <div className="space-y-2">
                <Select value={editData.id_document_type || undefined} onValueChange={v => updateField('id_document_type', v)}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="Document Type" /></SelectTrigger>
                  <SelectContent>
                    {['passport', 'national_id', 'drivers_license', 'residence_permit'].map(t => (
                      <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
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

      {/* Billing Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Billing Info</CardTitle>
          <EditButton section="ind_billing" data={{
            billing_name: client.billing_name || '',
            billing_email: client.billing_email || '',
            billing_address: client.billing_address || '',
            tax_id: client.tax_id || '',
          }} />
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
    company_updated: Pencil,
  };

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
