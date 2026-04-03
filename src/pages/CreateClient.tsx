import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building2, UserRound, Search, PlusCircle } from 'lucide-react';
import { useCreateClient, useUpdateClient, useUpdateCompany, useClient } from '@/hooks/useClients';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ClientType } from '@/types/client';
import { sanitizeTextInput } from '@/types/client';

type CompanyMode = 'existing' | 'new';

const CreateClient = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isValidUUID = editId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editId);
  const isEditMode = !!isValidUUID;

  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const updateCompany = useUpdateCompany();
  const { data: existingClient, isLoading: loadingClient } = useClient(isEditMode ? editId! : '');

  const [clientType, setClientType] = useState<ClientType>('company');
  const [companyMode, setCompanyMode] = useState<CompanyMode>('existing');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  // Redirect if invalid UUID in edit mode
  useEffect(() => {
    if (editId && !isValidUUID) {
      navigate('/clients', { replace: true });
    }
  }, [editId, isValidUUID, navigate]);

  // Pre-fill form in edit mode
  useEffect(() => {
    if (isEditMode && existingClient) {
      const client = existingClient as any;
      const company = client.companies;

      setClientType(client.client_type);

      if (client.client_type === 'company' && company) {
        setCompanyMode('existing');
        setFormData({
          company_id: client.company_id,
          company_name: company.company_name || '',
          legal_name: company.legal_name || '',
          industry: company.industry || '',
          company_size: company.company_size || '',
          founded_year: company.founded_year?.toString() || '',
          registration_number: company.registration_number || '',
          website: company.website || '',
          linkedin_url: company.linkedin_url || '',
          description: company.description || '',
          primary_contact_name: company.primary_contact_name || '',
          primary_contact_email: company.primary_contact_email || '',
          primary_contact_phone: company.primary_contact_phone || '',
          primary_contact_position: company.primary_contact_position || '',
          hr_contact_name: company.hr_contact_name || '',
          hr_contact_email: company.hr_contact_email || '',
          headquarters_address: company.headquarters_address || '',
          headquarters_city: company.headquarters_city || '',
          headquarters_country: company.headquarters_country || '',
          postal_code: company.postal_code || '',
          billing_contact_name: company.billing_contact_name || '',
          billing_contact_email: company.billing_contact_email || '',
          status: client.status || 'lead',
          source: client.source || '',
          notes: client.notes || '',
        });
      } else {
        setFormData({
          first_name: client.first_name || '',
          last_name: client.last_name || '',
          email: client.email || '',
          phone: client.phone || '',
          date_of_birth: client.date_of_birth || '',
          nationality: client.nationality || '',
          address_line1: client.address_line1 || '',
          city: client.city || '',
          country: client.country || '',
          postal_code: client.postal_code || '',
          id_document_type: client.id_document_type || '',
          id_document_number: client.id_document_number || '',
          billing_name: client.billing_name || '',
          billing_email: client.billing_email || '',
          tax_id: client.tax_id || '',
          status: client.status || 'lead',
          source: client.source || '',
          notes: client.notes || '',
        });
      }
    }
  }, [isEditMode, existingClient]);

  const { data: existingCompanyClientIds = [] } = useQuery({
    queryKey: ['existing-company-client-ids'],
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('company_id').eq('client_type', 'company').not('company_id', 'is', null);
      return (data || []).map(c => c.company_id);
    },
    enabled: !isEditMode,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-for-client'],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('*').order('company_name');
      return data || [];
    },
    enabled: !isEditMode,
  });

  const handleCompanySelect = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setFormData(prev => ({
        ...prev,
        company_id: companyId,
        company_name: company.company_name || '',
        legal_name: company.legal_name || '',
        industry: company.industry || '',
        company_size: company.company_size || '',
        founded_year: company.founded_year?.toString() || '',
        registration_number: company.registration_number || '',
        website: company.website || '',
        linkedin_url: company.linkedin_url || '',
        description: company.description || '',
        primary_contact_name: company.primary_contact_name || '',
        primary_contact_email: company.primary_contact_email || '',
        primary_contact_phone: company.primary_contact_phone || '',
        primary_contact_position: company.primary_contact_position || '',
        hr_contact_name: company.hr_contact_name || '',
        hr_contact_email: company.hr_contact_email || '',
        headquarters_address: company.headquarters_address || '',
        headquarters_city: company.headquarters_city || '',
        headquarters_country: company.headquarters_country || '',
        postal_code: company.postal_code || '',
        billing_contact_name: company.billing_contact_name || '',
        billing_contact_email: company.billing_contact_email || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditMode && editId) {
        // Edit mode
        if (clientType === 'company' && (existingClient as any)?.company_id) {
          await updateCompany.mutateAsync({
            id: (existingClient as any).company_id,
            clientId: editId,
            legal_name: formData.legal_name || null,
            industry: formData.industry || null,
            company_size: formData.company_size || null,
            founded_year: formData.founded_year ? Number(formData.founded_year) : null,
            registration_number: formData.registration_number || null,
            website: formData.website || null,
            linkedin_url: formData.linkedin_url || null,
            description: formData.description || null,
            primary_contact_name: formData.primary_contact_name,
            primary_contact_email: formData.primary_contact_email,
            primary_contact_phone: formData.primary_contact_phone || null,
            primary_contact_position: formData.primary_contact_position || null,
            hr_contact_name: formData.hr_contact_name || null,
            hr_contact_email: formData.hr_contact_email || null,
            headquarters_address: formData.headquarters_address || null,
            headquarters_city: formData.headquarters_city || null,
            headquarters_country: formData.headquarters_country,
            postal_code: formData.postal_code || null,
            billing_contact_name: formData.billing_contact_name || null,
            billing_contact_email: formData.billing_contact_email || null,
          });
        }

        const clientUpdates: Record<string, any> = {
          status: formData.status || 'lead',
          source: formData.source || null,
          notes: formData.notes || null,
        };

        if (clientType === 'individual') {
          Object.assign(clientUpdates, {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone || null,
            date_of_birth: formData.date_of_birth || null,
            nationality: formData.nationality || null,
            address_line1: formData.address_line1 || null,
            city: formData.city || null,
            country: formData.country || null,
            postal_code: formData.postal_code || null,
            id_document_type: formData.id_document_type || null,
            id_document_number: formData.id_document_number || null,
            billing_name: formData.billing_name || null,
            billing_email: formData.billing_email || null,
            tax_id: formData.tax_id || null,
          });
        }

        await updateClient.mutateAsync({ id: editId, ...clientUpdates });
        navigate(`/clients/${editId}`);
        return;
      }

      // Create mode — existing logic
      const input: Record<string, any> = {
        client_type: clientType,
        status: formData.status || 'lead',
        source: formData.source || null,
        notes: formData.notes ? sanitizeTextInput(formData.notes) : null,
      };

      if (clientType === 'company') {
        let companyId = formData.company_id;

        if (companyMode === 'new') {
          if (!formData.company_name || !formData.primary_contact_name || !formData.primary_contact_email || !formData.headquarters_country) return;

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({
              company_name: sanitizeTextInput(formData.company_name),
              legal_name: formData.legal_name ? sanitizeTextInput(formData.legal_name) : null,
              industry: formData.industry ? sanitizeTextInput(formData.industry) : null,
              company_size: formData.company_size || null,
              founded_year: formData.founded_year ? Number(formData.founded_year) : null,
              registration_number: formData.registration_number ? sanitizeTextInput(formData.registration_number) : null,
              website: formData.website || null,
              linkedin_url: formData.linkedin_url || null,
              description: formData.description ? sanitizeTextInput(formData.description) : null,
              primary_contact_name: sanitizeTextInput(formData.primary_contact_name),
              primary_contact_email: formData.primary_contact_email,
              primary_contact_phone: formData.primary_contact_phone || null,
              primary_contact_position: formData.primary_contact_position ? sanitizeTextInput(formData.primary_contact_position) : null,
              hr_contact_name: formData.hr_contact_name ? sanitizeTextInput(formData.hr_contact_name) : null,
              hr_contact_email: formData.hr_contact_email || null,
              headquarters_address: formData.headquarters_address ? sanitizeTextInput(formData.headquarters_address) : null,
              headquarters_city: formData.headquarters_city ? sanitizeTextInput(formData.headquarters_city) : null,
              headquarters_country: sanitizeTextInput(formData.headquarters_country),
              postal_code: formData.postal_code ? sanitizeTextInput(formData.postal_code) : null,
              billing_contact_name: formData.billing_contact_name ? sanitizeTextInput(formData.billing_contact_name) : null,
              billing_contact_email: formData.billing_contact_email || null,
              created_by: user.id,
            })
            .select()
            .single();

          if (companyError || !newCompany) {
            toast({ title: 'Error', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
            return;
          }
          companyId = newCompany.id;
        } else if (companyMode === 'existing' && formData.company_id) {
          await supabase
            .from('companies')
            .update({
              legal_name: formData.legal_name ? sanitizeTextInput(formData.legal_name) : null,
              industry: formData.industry ? sanitizeTextInput(formData.industry) : null,
              company_size: formData.company_size || null,
              founded_year: formData.founded_year ? Number(formData.founded_year) : null,
              registration_number: formData.registration_number ? sanitizeTextInput(formData.registration_number) : null,
              website: formData.website || null,
              linkedin_url: formData.linkedin_url || null,
              description: formData.description ? sanitizeTextInput(formData.description) : null,
              primary_contact_phone: formData.primary_contact_phone || null,
              primary_contact_position: formData.primary_contact_position ? sanitizeTextInput(formData.primary_contact_position) : null,
              hr_contact_name: formData.hr_contact_name ? sanitizeTextInput(formData.hr_contact_name) : null,
              hr_contact_email: formData.hr_contact_email || null,
              headquarters_address: formData.headquarters_address ? sanitizeTextInput(formData.headquarters_address) : null,
              headquarters_city: formData.headquarters_city ? sanitizeTextInput(formData.headquarters_city) : null,
              postal_code: formData.postal_code ? sanitizeTextInput(formData.postal_code) : null,
              billing_contact_name: formData.billing_contact_name ? sanitizeTextInput(formData.billing_contact_name) : null,
              billing_contact_email: formData.billing_contact_email || null,
            })
            .eq('id', formData.company_id);

          // Check if this company already has a client record
          if (existingCompanyClientIds.includes(formData.company_id)) {
            const { data: existingClientRecord } = await supabase
              .from('clients')
              .select('id')
              .eq('company_id', formData.company_id)
              .eq('client_type', 'company')
              .single();

            if (existingClientRecord) {
              toast({ title: 'Company details updated', description: 'Redirecting to existing client record.' });
              navigate(`/clients/${existingClientRecord.id}`);
              setSubmitting(false);
              return;
            }
          }

          companyId = formData.company_id;
        } else {
          return;
        }

        input.company_id = companyId;
      } else {
        if (!formData.first_name || !formData.last_name || !formData.email) return;
        Object.assign(input, {
          first_name: sanitizeTextInput(formData.first_name),
          last_name: sanitizeTextInput(formData.last_name),
          email: formData.email,
          phone: formData.phone || null,
          date_of_birth: formData.date_of_birth || null,
          nationality: formData.nationality ? sanitizeTextInput(formData.nationality) : null,
          address_line1: formData.address_line1 ? sanitizeTextInput(formData.address_line1) : null,
          city: formData.city ? sanitizeTextInput(formData.city) : null,
          country: formData.country ? sanitizeTextInput(formData.country) : null,
          postal_code: formData.postal_code ? sanitizeTextInput(formData.postal_code) : null,
          id_document_type: formData.id_document_type || null,
          id_document_number: formData.id_document_number ? sanitizeTextInput(formData.id_document_number) : null,
          billing_name: formData.billing_name ? sanitizeTextInput(formData.billing_name) : null,
          billing_email: formData.billing_email || null,
          tax_id: formData.tax_id ? sanitizeTextInput(formData.tax_id) : null,
        });
      }

      const result = await createClient.mutateAsync(input);
      if (result) navigate(`/clients/${result.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

  const isValidUrl = (url: string) => !url || /^https?:\/\//.test(url);
  const isValidEmail = (email: string) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const companyUrlsValid = isValidUrl(formData.website || '') && isValidUrl(formData.linkedin_url || '');
  const companyEmailsValid = isValidEmail(formData.primary_contact_email || '') && isValidEmail(formData.billing_contact_email || '');

  const companyFormValid = clientType === 'company' && companyUrlsValid && companyEmailsValid && (
    isEditMode
      ? !!formData.company_id
      : companyMode === 'existing'
        ? !!formData.company_id
        : !!(formData.company_name && formData.primary_contact_name && formData.primary_contact_email && formData.headquarters_country)
  );
  const individualFormValid = clientType === 'individual' && !!(formData.first_name && formData.last_name && formData.email);
  const isMutating = submitting || createClient.isPending || updateClient.isPending || updateCompany.isPending;
  const canSubmit = !isMutating && (companyFormValid || individualFormValid);

  // Loading/access states for edit mode
  if (isEditMode && loadingClient) {
    return <AppLayout><div className="p-6 text-muted-foreground">Loading client...</div></AppLayout>;
  }
  if (isEditMode && !loadingClient && !existingClient) {
    return <AppLayout><div className="p-6 text-muted-foreground">Client not found</div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(isEditMode ? `/clients/${editId}` : '/clients')} className="mb-4 gap-1">
            <ArrowLeft className="h-4 w-4" /> {isEditMode ? 'Back to Client' : 'Back to Clients'}
          </Button>

          <h1 className="text-xl font-bold mb-6">{isEditMode ? 'Edit Client' : 'New Client'}</h1>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {(['company', 'individual'] as ClientType[]).map(type => (
              <button
                key={type}
                type="button"
                disabled={isEditMode}
                onClick={() => { if (!isEditMode) { setClientType(type); setFormData({}); setCompanyMode('existing'); } }}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                  clientType === type ? 'border-primary bg-primary/5' : 'border-muted'
                } ${isEditMode ? 'opacity-60 cursor-not-allowed' : 'hover:border-muted-foreground/30'}`}
              >
                {type === 'company' ? <Building2 className="h-6 w-6" /> : <UserRound className="h-6 w-6" />}
                <span className="font-medium capitalize">{type}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {clientType === 'company' ? (
              <>
                {/* Company mode selector — hidden in edit mode */}
                {!isEditMode && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => { setCompanyMode('existing'); setFormData({}); }}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors text-sm ${companyMode === 'existing' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'}`}
                    >
                      <Search className="h-4 w-4" />
                      <span className="font-medium">Select Existing</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCompanyMode('new'); setFormData({}); }}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors text-sm ${companyMode === 'new' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'}`}
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span className="font-medium">Create New</span>
                    </button>
                  </div>
                )}

                {/* Existing company selector — hidden in edit mode */}
                {!isEditMode && companyMode === 'existing' && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Select Company</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs">Company *</Label>
                        {companies.length === 0 ? (
                          <div className="rounded-md border border-dashed p-4 text-center space-y-2">
                            <p className="text-sm text-muted-foreground">
                              No available companies found. All existing companies are already clients.
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => { setCompanyMode('new'); setFormData({}); }}
                              className="gap-1.5"
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                              Create New Company
                            </Button>
                          </div>
                        ) : (
                          <Select value={formData.company_id || undefined} onValueChange={handleCompanySelect}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Choose a company..." /></SelectTrigger>
                            <SelectContent>
                              {companies.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.company_name} — {c.headquarters_city || 'N/A'}, {c.headquarters_country || 'N/A'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {formData.company_id && (
                          <Badge variant="outline" className="mt-2 text-[10px]">Editing will update the existing company record</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Company detail fields — shown when new OR when existing selected OR in edit mode */}
                {(isEditMode || companyMode === 'new' || formData.company_id) && (
                  <>
                    <Card>
                      <CardHeader><CardTitle className="text-sm">Company Info</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Label className="text-xs">Company Name *</Label>
                          <Input maxLength={200} value={formData.company_name || ''} onChange={e => update('company_name', e.target.value)} className="h-9" disabled={isEditMode} />
                        </div>
                        <div><Label className="text-xs">Legal Name</Label><Input maxLength={200} value={formData.legal_name || ''} onChange={e => update('legal_name', e.target.value)} className="h-9" /></div>
                        <div><Label className="text-xs">Industry</Label><Input maxLength={100} value={formData.industry || ''} onChange={e => update('industry', e.target.value)} className="h-9" /></div>
                        <div>
                          <Label className="text-xs">Company Size</Label>
                          <Select value={formData.company_size || undefined} onValueChange={v => update('company_size', v)}>
                            <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-10">1-10</SelectItem>
                              <SelectItem value="11-50">11-50</SelectItem>
                              <SelectItem value="51-200">51-200</SelectItem>
                              <SelectItem value="201-500">201-500</SelectItem>
                              <SelectItem value="501-1000">501-1000</SelectItem>
                              <SelectItem value="1000+">1000+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label className="text-xs">Founded Year</Label><Input type="number" min={1800} max={new Date().getFullYear()} value={formData.founded_year || ''} onChange={e => update('founded_year', e.target.value)} className="h-9" /></div>
                        <div><Label className="text-xs">Registration Number</Label><Input maxLength={50} value={formData.registration_number || ''} onChange={e => update('registration_number', e.target.value)} className="h-9" /></div>
                        <div><Label className="text-xs">Website</Label><Input maxLength={500} value={formData.website || ''} onChange={e => update('website', e.target.value)} className="h-9" placeholder="https://..." /></div>
                        <div><Label className="text-xs">LinkedIn URL</Label><Input maxLength={500} value={formData.linkedin_url || ''} onChange={e => update('linkedin_url', e.target.value)} className="h-9" placeholder="https://..." /></div>
                        <div className="col-span-2"><Label className="text-xs">Description</Label><Textarea maxLength={2000} value={formData.description || ''} onChange={e => update('description', e.target.value)} rows={3} /></div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-sm">Primary Contact</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-2 gap-3">
                        <div><Label className="text-xs">Contact Name *</Label><Input maxLength={100} value={formData.primary_contact_name || ''} onChange={e => update('primary_contact_name', e.target.value)} className="h-9" /></div>
                        <div><Label className="text-xs">Contact Email *</Label><Input maxLength={254} type="email" value={formData.primary_contact_email || ''} onChange={e => update('primary_contact_email', e.target.value)} className="h-9" /></div>
                        <div><Label className="text-xs">Contact Phone</Label><Input maxLength={20} value={formData.primary_contact_phone || ''} onChange={e => update('primary_contact_phone', e.target.value)} className="h-9" /></div>
                        <div><Label className="text-xs">Contact Position</Label><Input maxLength={100} value={formData.primary_contact_position || ''} onChange={e => update('primary_contact_position', e.target.value)} className="h-9" /></div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-sm">HR Contact</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-2 gap-3">
                        <div><Label className="text-xs">HR Contact Name</Label><Input maxLength={100} value={formData.hr_contact_name || ''} onChange={e => update('hr_contact_name', e.target.value)} className="h-9" /></div>
                        <div><Label className="text-xs">HR Contact Email</Label><Input maxLength={254} type="email" value={formData.hr_contact_email || ''} onChange={e => update('hr_contact_email', e.target.value)} className="h-9" /></div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-sm">Headquarters Address</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-2 gap-3">
                        <div className="col-span-2"><Label className="text-xs">Address</Label><Input maxLength={500} value={formData.headquarters_address || ''} onChange={e => update('headquarters_address', e.target.value)} className="h-9" /></div>
                        <div><Label className="text-xs">City</Label><Input maxLength={100} value={formData.headquarters_city || ''} onChange={e => update('headquarters_city', e.target.value)} className="h-9" /></div>
                        <div><Label className="text-xs">Country *</Label><Input maxLength={100} value={formData.headquarters_country || ''} onChange={e => update('headquarters_country', e.target.value)} className="h-9" /></div>
                        <div><Label className="text-xs">Postal Code</Label><Input maxLength={20} value={formData.postal_code || ''} onChange={e => update('postal_code', e.target.value)} className="h-9" /></div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-sm">Billing Contact</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-2 gap-3">
                        <div><Label className="text-xs">Billing Contact Name</Label><Input maxLength={200} value={formData.billing_contact_name || ''} onChange={e => update('billing_contact_name', e.target.value)} className="h-9" /></div>
                        <div><Label className="text-xs">Billing Contact Email</Label><Input maxLength={254} type="email" value={formData.billing_contact_email || ''} onChange={e => update('billing_contact_email', e.target.value)} className="h-9" /></div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            ) : (
              <>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Personal Info</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">First Name *</Label><Input maxLength={100} value={formData.first_name || ''} onChange={e => update('first_name', e.target.value)} className="h-9" /></div>
                    <div><Label className="text-xs">Last Name *</Label><Input maxLength={100} value={formData.last_name || ''} onChange={e => update('last_name', e.target.value)} className="h-9" /></div>
                    <div><Label className="text-xs">Email *</Label><Input maxLength={254} type="email" value={formData.email || ''} onChange={e => update('email', e.target.value)} className="h-9" /></div>
                    <div><Label className="text-xs">Phone</Label><Input maxLength={20} value={formData.phone || ''} onChange={e => update('phone', e.target.value)} className="h-9" /></div>
                    <div><Label className="text-xs">Date of Birth</Label><Input type="date" value={formData.date_of_birth || ''} onChange={e => update('date_of_birth', e.target.value)} className="h-9" /></div>
                    <div><Label className="text-xs">Nationality</Label><Input maxLength={100} value={formData.nationality || ''} onChange={e => update('nationality', e.target.value)} className="h-9" /></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Address</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><Label className="text-xs">Address</Label><Input maxLength={500} value={formData.address_line1 || ''} onChange={e => update('address_line1', e.target.value)} className="h-9" /></div>
                    <div><Label className="text-xs">City</Label><Input maxLength={100} value={formData.city || ''} onChange={e => update('city', e.target.value)} className="h-9" /></div>
                    <div><Label className="text-xs">Country</Label><Input maxLength={100} value={formData.country || ''} onChange={e => update('country', e.target.value)} className="h-9" /></div>
                    <div><Label className="text-xs">Postal Code</Label><Input maxLength={20} value={formData.postal_code || ''} onChange={e => update('postal_code', e.target.value)} className="h-9" /></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-sm">Billing Info</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Billing Name</Label><Input maxLength={200} value={formData.billing_name || ''} onChange={e => update('billing_name', e.target.value)} className="h-9" /></div>
                    <div><Label className="text-xs">Billing Email</Label><Input maxLength={254} value={formData.billing_email || ''} onChange={e => update('billing_email', e.target.value)} className="h-9" /></div>
                    <div><Label className="text-xs">Tax ID</Label><Input maxLength={50} value={formData.tax_id || ''} onChange={e => update('tax_id', e.target.value)} className="h-9" /></div>
                  </CardContent>
                </Card>
              </>
            )}

            <Card>
              <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={formData.status || 'lead'} onValueChange={v => update('status', v)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Source</Label>
                  <Select value={formData.source || undefined} onValueChange={v => update('source', v)}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Notes</Label>
                  <Textarea maxLength={5000} value={formData.notes || ''} onChange={e => update('notes', e.target.value)} rows={3} />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(isEditMode ? `/clients/${editId}` : '/clients')}>Cancel</Button>
              <Button type="submit" disabled={!canSubmit}>
                {isMutating ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Client')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateClient;
