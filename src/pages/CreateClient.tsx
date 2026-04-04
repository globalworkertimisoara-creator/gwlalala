import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Building2, UserRound, Search, PlusCircle, Trash2, Plus } from 'lucide-react';
import { useCreateClient, useUpdateClient, useUpdateCompany, useClient } from '@/hooks/useClients';
import { useClientContacts, useCreateClientContact, useUpdateClientContact, useDeleteClientContact } from '@/hooks/useClientCRM';
import { usePermissions } from '@/hooks/usePermissions';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ClientType } from '@/types/client';
import {
  sanitizeTextInput,
  PAYMENT_TERMS_OPTIONS,
  CURRENCY_OPTIONS,
  PRIORITY_LEVELS,
  COMMUNICATION_CHANNELS,
} from '@/types/client';

type CompanyMode = 'existing' | 'new';

const CreateClient = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isValidUUID = editId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editId);
  const isEditMode = !!isValidUUID;

  const { can } = usePermissions();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const updateCompany = useUpdateCompany();
  const { data: existingClient, isLoading: loadingClient } = useClient(isEditMode ? editId! : '');

  const [clientType, setClientType] = useState<ClientType>('company');
  const [companyMode, setCompanyMode] = useState<CompanyMode>('existing');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showErrors, setShowErrors] = useState(false);

  // Contacts (edit mode)
  const { data: contacts = [] } = useClientContacts(isEditMode ? editId! : '');
  const createContact = useCreateClientContact();
  const updateContact = useUpdateClientContact();
  const deleteContact = useDeleteClientContact();
  const [newContact, setNewContact] = useState<Record<string, any> | null>(null);

  const readOnly = isEditMode && !can('editClients');

  useEffect(() => {
    if (editId && !isValidUUID) {
      navigate('/clients', { replace: true });
    }
  }, [editId, isValidUUID, navigate]);

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
          // CRM fields
          payment_terms: client.payment_terms || 'net_30',
          currency: client.currency || 'EUR',
          vat_number: client.vat_number || '',
          vat_verified: client.vat_verified || false,
          preferred_communication: client.preferred_communication || 'email',
          priority_level: client.priority_level || 'standard',
          risk_score: client.risk_score ?? 5,
          risk_notes: client.risk_notes || '',
          credit_limit: client.credit_limit?.toString() || '0',
          sla_terms: client.sla_terms || '',
          payment_score: client.payment_score ?? 5,
          tax_id: client.tax_id || '',
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
          id_document_expiry: client.id_document_expiry || '',
          billing_name: client.billing_name || '',
          billing_email: client.billing_email || '',
          tax_id: client.tax_id || '',
          status: client.status || 'lead',
          source: client.source || '',
          notes: client.notes || '',
          payment_terms: client.payment_terms || 'net_30',
          currency: client.currency || 'EUR',
          vat_number: client.vat_number || '',
          vat_verified: client.vat_verified || false,
          preferred_communication: client.preferred_communication || 'email',
          priority_level: client.priority_level || 'standard',
          risk_score: client.risk_score ?? 5,
          risk_notes: client.risk_notes || '',
          credit_limit: client.credit_limit?.toString() || '0',
          sla_terms: client.sla_terms || '',
          payment_score: client.payment_score ?? 5,
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

  const crmFields = {
    payment_terms: formData.payment_terms || 'net_30',
    currency: formData.currency || 'EUR',
    vat_number: formData.vat_number ? sanitizeTextInput(formData.vat_number) : null,
    vat_verified: formData.vat_verified || false,
    preferred_communication: formData.preferred_communication || 'email',
    priority_level: formData.priority_level || 'standard',
    risk_score: typeof formData.risk_score === 'number' ? formData.risk_score : 5,
    risk_notes: formData.risk_notes ? sanitizeTextInput(formData.risk_notes) : null,
    credit_limit: formData.credit_limit ? Number(formData.credit_limit) : 0,
    sla_terms: formData.sla_terms ? sanitizeTextInput(formData.sla_terms) : null,
    payment_score: typeof formData.payment_score === 'number' ? formData.payment_score : 5,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submitting
    if (!companyFormValid && !individualFormValid) {
      setShowErrors(true);
      // Auto-navigate to tab with first error
      if (clientType === 'company' && companyMode !== 'existing') {
        if (!formData.company_name || !formData.primary_contact_name || !formData.primary_contact_email) {
          setActiveTab('basic');
        } else if (!formData.headquarters_country) {
          setActiveTab('address');
        }
      } else if (clientType === 'company' && companyMode === 'existing') {
        if (!formData.company_id) setActiveTab('basic');
      } else if (clientType === 'individual') {
        if (!formData.first_name || !formData.last_name || !formData.email) setActiveTab('basic');
      }
      toast({
        title: 'Required fields missing',
        description: 'Please fill in all required fields highlighted in red.',
        variant: 'destructive',
      });
      return;
    }

    if (clientType === 'company' && (!companyUrlsValid || !companyEmailsValid)) {
      setShowErrors(true);
      toast({
        title: 'Invalid input',
        description: 'Please check email and URL fields for correct formatting.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      if (isEditMode && editId) {
        if (clientType === 'company' && (existingClient as any)?.company_id) {
          await updateCompany.mutateAsync({
            id: (existingClient as any).company_id,
            clientId: editId,
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
          });
        }

        const clientUpdates: Record<string, any> = {
          status: formData.status || 'lead',
          source: formData.source || null,
          notes: formData.notes ? sanitizeTextInput(formData.notes) : null,
          ...crmFields,
        };

        if (clientType === 'individual') {
          Object.assign(clientUpdates, {
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
            id_document_expiry: formData.id_document_expiry || null,
            billing_name: formData.billing_name ? sanitizeTextInput(formData.billing_name) : null,
            billing_email: formData.billing_email || null,
            tax_id: formData.tax_id ? sanitizeTextInput(formData.tax_id) : null,
          });
        } else {
          clientUpdates.tax_id = formData.tax_id ? sanitizeTextInput(formData.tax_id) : null;
        }

        await updateClient.mutateAsync({ id: editId, ...clientUpdates });
        navigate(`/clients/${editId}`);
        return;
      }

      // Create mode
      const input: Record<string, any> = {
        client_type: clientType,
        status: formData.status || 'lead',
        source: formData.source || null,
        notes: formData.notes ? sanitizeTextInput(formData.notes) : null,
        ...crmFields,
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
            toast({ title: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
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
        input.tax_id = formData.tax_id ? sanitizeTextInput(formData.tax_id) : null;
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
          id_document_expiry: formData.id_document_expiry || null,
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

  const fieldError = (value: any) => {
    if (!showErrors) return '';
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'border-destructive ring-1 ring-destructive';
    }
    return '';
  };

  const emailError = (value: string) => {
    if (!showErrors || !value) return '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'border-destructive ring-1 ring-destructive';
    }
    return '';
  };

  const urlError = (value: string) => {
    if (!showErrors || !value) return '';
    if (!/^https?:\/\//.test(value)) {
      return 'border-destructive ring-1 ring-destructive';
    }
    return '';
  };

  const tabHasErrors = (tab: string): boolean => {
    if (!showErrors) return false;
    if (tab === 'basic') {
      if (clientType === 'company') {
        if (companyMode === 'existing' && !formData.company_id) return true;
        if (companyMode === 'new' && (!formData.company_name || !formData.primary_contact_name || !formData.primary_contact_email)) return true;
      } else {
        if (!formData.first_name || !formData.last_name || !formData.email) return true;
      }
    }
    if (tab === 'contacts' && clientType === 'company' && companyMode === 'new') {
      if (!formData.primary_contact_name || !formData.primary_contact_email) return true;
    }
    if (tab === 'address' && clientType === 'company' && companyMode === 'new' && !formData.headquarters_country) return true;
    return false;
  };

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-green-600';
    if (score <= 6) return 'text-amber-600';
    return 'text-red-600';
  };

  const handleAddContact = async () => {
    if (!newContact?.name || !editId) return;
    await createContact.mutateAsync({ ...newContact, client_id: editId });
    setNewContact(null);
  };

  if (isEditMode && loadingClient) {
    return <AppLayout><div className="p-6 text-muted-foreground">Loading client...</div></AppLayout>;
  }
  if (isEditMode && !loadingClient && !existingClient) {
    return <AppLayout><div className="p-6 text-muted-foreground">Client not found</div></AppLayout>;
  }

  const showCompanyFields = isEditMode || companyMode === 'new' || formData.company_id;

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(isEditMode ? `/clients/${editId}` : '/clients')} className="mb-4 gap-1">
            <ArrowLeft className="h-4 w-4" /> {isEditMode ? 'Back to Client' : 'Back to Clients'}
          </Button>

          <h1 className="text-xl font-bold mb-6">{isEditMode ? 'Edit Client' : 'New Client'}</h1>

          {/* Client type selector */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {(['company', 'individual'] as ClientType[]).map(type => (
              <button
                key={type}
                type="button"
                disabled={isEditMode}
                onClick={() => { if (!isEditMode) { setClientType(type); setFormData({}); setCompanyMode('existing'); setShowErrors(false); } }}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                  clientType === type ? 'border-primary bg-primary/5' : 'border-muted'
                } ${isEditMode ? 'opacity-60 cursor-not-allowed' : 'hover:border-muted-foreground/30'}`}
              >
                {type === 'company' ? <Building2 className="h-6 w-6" /> : <UserRound className="h-6 w-6" />}
                <span className="font-medium capitalize">{type}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-6 w-full">
                <TabsTrigger value="basic" className="relative">
                  Basic Info
                  {tabHasErrors('basic') && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />}
                </TabsTrigger>
                <TabsTrigger value="contacts" className="relative">
                  Contacts
                  {tabHasErrors('contacts') && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />}
                </TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="risk">Risk</TabsTrigger>
                <TabsTrigger value="address" className="relative">
                  Address
                  {tabHasErrors('address') && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />}
                </TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              {/* ─── Tab 1: Basic Info ─── */}
              <TabsContent value="basic" className="space-y-4">
                {clientType === 'company' ? (
                  <>
                    {!isEditMode && (
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => { setCompanyMode('existing'); setFormData({}); }}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors text-sm ${companyMode === 'existing' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'}`}>
                          <Search className="h-4 w-4" /><span className="font-medium">Select Existing</span>
                        </button>
                        <button type="button" onClick={() => { setCompanyMode('new'); setFormData({}); }}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors text-sm ${companyMode === 'new' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'}`}>
                          <PlusCircle className="h-4 w-4" /><span className="font-medium">Create New</span>
                        </button>
                      </div>
                    )}

                    {!isEditMode && companyMode === 'existing' && (
                      <Card>
                        <CardHeader><CardTitle className="text-sm">Select Company</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                          {companies.length === 0 ? (
                            <div className="rounded-md border border-dashed p-4 text-center space-y-2">
                              <p className="text-sm text-muted-foreground">No companies found in the system.</p>
                              <Button type="button" variant="outline" size="sm" onClick={() => { setCompanyMode('new'); setFormData({}); }} className="gap-1.5">
                                <PlusCircle className="h-3.5 w-3.5" /> Create New Company
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div>
                                <Label className="text-xs">Company *</Label>
                                <Select value={formData.company_id || undefined} onValueChange={handleCompanySelect}>
                                  <SelectTrigger className="h-9"><SelectValue placeholder="Choose a company..." /></SelectTrigger>
                                  <SelectContent>
                                    {companies.map(c => (
                                      <SelectItem key={c.id} value={c.id}>
                                        <span className="flex items-center gap-2">
                                          {c.company_name} — {c.headquarters_city || 'N/A'}, {c.headquarters_country || 'N/A'}
                                          {existingCompanyClientIds.includes(c.id) && (
                                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Has client</span>
                                          )}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {formData.company_id && existingCompanyClientIds.includes(formData.company_id) && (
                                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 mt-2">
                                    <p className="text-xs text-amber-800">This company already has a client record. You'll be redirected to the existing client.</p>
                                  </div>
                                )}
                                {formData.company_id && !existingCompanyClientIds.includes(formData.company_id) && (
                                  <Badge variant="outline" className="mt-2 text-[10px]">A new client record will be created for this company</Badge>
                                )}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {showCompanyFields && (
                      <Card>
                        <CardHeader><CardTitle className="text-sm">Company Info</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <Label className="text-xs">Company Name *</Label>
                            <Input maxLength={200} value={formData.company_name || ''} onChange={e => update('company_name', e.target.value)} className="h-9" disabled={isEditMode || readOnly} />
                          </div>
                          <div><Label className="text-xs">Legal Name</Label><Input maxLength={200} value={formData.legal_name || ''} onChange={e => update('legal_name', e.target.value)} className="h-9" disabled={readOnly} /></div>
                          <div><Label className="text-xs">Industry</Label><Input maxLength={100} value={formData.industry || ''} onChange={e => update('industry', e.target.value)} className="h-9" disabled={readOnly} /></div>
                          <div>
                            <Label className="text-xs">Company Size</Label>
                            <Select value={formData.company_size || undefined} onValueChange={v => update('company_size', v)} disabled={readOnly}>
                              <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                              <SelectContent>
                                {['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'].map(s => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div><Label className="text-xs">Founded Year</Label><Input type="number" min={1800} max={new Date().getFullYear()} value={formData.founded_year || ''} onChange={e => update('founded_year', e.target.value)} className="h-9" disabled={readOnly} /></div>
                          <div><Label className="text-xs">Registration Number</Label><Input maxLength={50} value={formData.registration_number || ''} onChange={e => update('registration_number', e.target.value)} className="h-9" disabled={readOnly} /></div>
                          <div><Label className="text-xs">Website</Label><Input maxLength={500} value={formData.website || ''} onChange={e => update('website', e.target.value)} className="h-9" placeholder="https://..." disabled={readOnly} /></div>
                          <div><Label className="text-xs">LinkedIn URL</Label><Input maxLength={500} value={formData.linkedin_url || ''} onChange={e => update('linkedin_url', e.target.value)} className="h-9" placeholder="https://..." disabled={readOnly} /></div>
                          <div className="col-span-2"><Label className="text-xs">Description</Label><Textarea maxLength={2000} value={formData.description || ''} onChange={e => update('description', e.target.value)} rows={3} disabled={readOnly} /></div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Personal Info</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">First Name *</Label><Input maxLength={100} value={formData.first_name || ''} onChange={e => update('first_name', e.target.value)} className="h-9" disabled={readOnly} /></div>
                      <div><Label className="text-xs">Last Name *</Label><Input maxLength={100} value={formData.last_name || ''} onChange={e => update('last_name', e.target.value)} className="h-9" disabled={readOnly} /></div>
                      <div><Label className="text-xs">Email *</Label><Input maxLength={254} type="email" value={formData.email || ''} onChange={e => update('email', e.target.value)} className="h-9" disabled={readOnly} /></div>
                      <div><Label className="text-xs">Phone</Label><Input maxLength={20} value={formData.phone || ''} onChange={e => update('phone', e.target.value)} className="h-9" disabled={readOnly} /></div>
                      <div><Label className="text-xs">Date of Birth</Label><Input type="date" value={formData.date_of_birth || ''} onChange={e => update('date_of_birth', e.target.value)} className="h-9" disabled={readOnly} /></div>
                      <div><Label className="text-xs">Nationality</Label><Input maxLength={100} value={formData.nationality || ''} onChange={e => update('nationality', e.target.value)} className="h-9" disabled={readOnly} /></div>
                    </CardContent>
                  </Card>
                )}

                {/* Status, Source, Priority — always shown */}
                <Card>
                  <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Status</Label>
                      <Select value={formData.status || 'lead'} onValueChange={v => update('status', v)} disabled={readOnly}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['lead', 'active', 'on_hold', 'inactive', 'churned'].map(s => (
                            <SelectItem key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Source</Label>
                      <Select value={formData.source || undefined} onValueChange={v => update('source', v)} disabled={readOnly}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {['referral', 'website', 'marketing', 'direct', 'other'].map(s => (
                            <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Priority Level</Label>
                      <Select value={formData.priority_level || 'standard'} onValueChange={v => update('priority_level', v)} disabled={readOnly}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PRIORITY_LEVELS.map(p => (
                            <SelectItem key={p.value} value={p.value}>
                              <span className={`font-medium ${p.color.split(' ')[0]}`}>{p.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ─── Tab 2: Contacts ─── */}
              <TabsContent value="contacts" className="space-y-4">
                {clientType === 'company' && showCompanyFields && (
                  <>
                    <Card>
                      <CardHeader><CardTitle className="text-sm">Primary Contact</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-2 gap-3">
                        <div><Label className="text-xs">Contact Name *</Label><Input maxLength={100} value={formData.primary_contact_name || ''} onChange={e => update('primary_contact_name', e.target.value)} className="h-9" disabled={readOnly} /></div>
                        <div><Label className="text-xs">Contact Email *</Label><Input maxLength={254} type="email" value={formData.primary_contact_email || ''} onChange={e => update('primary_contact_email', e.target.value)} className="h-9" disabled={readOnly} /></div>
                        <div><Label className="text-xs">Contact Phone</Label><Input maxLength={20} value={formData.primary_contact_phone || ''} onChange={e => update('primary_contact_phone', e.target.value)} className="h-9" disabled={readOnly} /></div>
                        <div><Label className="text-xs">Contact Position</Label><Input maxLength={100} value={formData.primary_contact_position || ''} onChange={e => update('primary_contact_position', e.target.value)} className="h-9" disabled={readOnly} /></div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle className="text-sm">HR Contact</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-2 gap-3">
                        <div><Label className="text-xs">HR Contact Name</Label><Input maxLength={100} value={formData.hr_contact_name || ''} onChange={e => update('hr_contact_name', e.target.value)} className="h-9" disabled={readOnly} /></div>
                        <div><Label className="text-xs">HR Contact Email</Label><Input maxLength={254} type="email" value={formData.hr_contact_email || ''} onChange={e => update('hr_contact_email', e.target.value)} className="h-9" disabled={readOnly} /></div>
                      </CardContent>
                    </Card>
                  </>
                )}

                <Card>
                  <CardHeader><CardTitle className="text-sm">Preferred Communication</CardTitle></CardHeader>
                  <CardContent>
                    <Select value={formData.preferred_communication || 'email'} onValueChange={v => update('preferred_communication', v)} disabled={readOnly}>
                      <SelectTrigger className="h-9 max-w-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COMMUNICATION_CHANNELS.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Additional Contacts — edit mode only */}
                {isEditMode && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-sm">Additional Contacts</CardTitle>
                      {!readOnly && (
                        <Button type="button" variant="outline" size="sm" onClick={() => setNewContact({ name: '', email: '', phone: '', position: '', department: '', contact_type: 'general', is_primary: false })} className="gap-1">
                          <Plus className="h-3.5 w-3.5" /> Add
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent>
                      {contacts.length === 0 && !newContact && (
                        <p className="text-sm text-muted-foreground text-center py-4">No additional contacts yet.</p>
                      )}
                      <div className="space-y-3">
                        {contacts.map((c: any) => (
                          <div key={c.id} className="flex items-center gap-3 p-3 border rounded-lg text-sm">
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <div><span className="text-muted-foreground text-xs">Name:</span> {c.name}</div>
                              <div><span className="text-muted-foreground text-xs">Email:</span> {c.email || '—'}</div>
                              <div><span className="text-muted-foreground text-xs">Phone:</span> {c.phone || '—'}</div>
                              <div><span className="text-muted-foreground text-xs">Position:</span> {c.position || '—'}</div>
                              <div><span className="text-muted-foreground text-xs">Dept:</span> {c.department || '—'}</div>
                              <div><span className="text-muted-foreground text-xs">Type:</span> {c.contact_type} {c.is_primary && <Badge variant="secondary" className="text-[9px] ml-1">Primary</Badge>}</div>
                            </div>
                            {!readOnly && (
                              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteContact.mutate({ id: c.id, client_id: editId! })}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {newContact && (
                          <div className="p-3 border rounded-lg border-dashed space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <Input maxLength={100} placeholder="Name *" value={newContact.name} onChange={e => setNewContact(p => ({ ...p!, name: e.target.value }))} className="h-8 text-sm" />
                              <Input maxLength={254} placeholder="Email" value={newContact.email} onChange={e => setNewContact(p => ({ ...p!, email: e.target.value }))} className="h-8 text-sm" />
                              <Input maxLength={20} placeholder="Phone" value={newContact.phone} onChange={e => setNewContact(p => ({ ...p!, phone: e.target.value }))} className="h-8 text-sm" />
                              <Input maxLength={100} placeholder="Position" value={newContact.position} onChange={e => setNewContact(p => ({ ...p!, position: e.target.value }))} className="h-8 text-sm" />
                              <Input maxLength={100} placeholder="Department" value={newContact.department} onChange={e => setNewContact(p => ({ ...p!, department: e.target.value }))} className="h-8 text-sm" />
                              <Select value={newContact.contact_type} onValueChange={v => setNewContact(p => ({ ...p!, contact_type: v }))}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {['general', 'billing', 'technical', 'executive', 'hr'].map(t => (
                                    <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="flex items-center gap-2 text-xs">
                                <Checkbox checked={newContact.is_primary} onCheckedChange={v => setNewContact(p => ({ ...p!, is_primary: !!v }))} />
                                Primary contact
                              </label>
                              <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setNewContact(null)}>Cancel</Button>
                                <Button type="button" size="sm" disabled={!newContact.name || createContact.isPending} onClick={handleAddContact}>
                                  {createContact.isPending ? 'Adding...' : 'Add Contact'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ─── Tab 3: Financial ─── */}
              <TabsContent value="financial" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Payment & Billing</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Payment Terms</Label>
                      <Select value={formData.payment_terms || 'net_30'} onValueChange={v => update('payment_terms', v)} disabled={readOnly}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PAYMENT_TERMS_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Currency</Label>
                      <Select value={formData.currency || 'EUR'} onValueChange={v => update('currency', v)} disabled={readOnly}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CURRENCY_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">VAT Number</Label>
                      <Input maxLength={30} value={formData.vat_number || ''} onChange={e => update('vat_number', e.target.value)} className="h-9" disabled={readOnly} />
                    </div>
                    <div className="flex items-end gap-2 pb-1">
                      <label className="flex items-center gap-2 text-xs">
                        <Checkbox checked={formData.vat_verified || false} onCheckedChange={v => update('vat_verified', !!v)} disabled={readOnly} />
                        VAT Verified
                      </label>
                    </div>
                    <div>
                      <Label className="text-xs">Credit Limit</Label>
                      <Input type="number" min={0} step={0.01} value={formData.credit_limit || '0'} onChange={e => update('credit_limit', e.target.value)} className="h-9" disabled={readOnly} />
                    </div>
                    <div>
                      <Label className="text-xs">Tax ID</Label>
                      <Input maxLength={50} value={formData.tax_id || ''} onChange={e => update('tax_id', e.target.value)} className="h-9" disabled={readOnly} />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Payment Score (1-10): <span className="font-semibold">{formData.payment_score ?? 5}</span></Label>
                      <Slider
                        value={[formData.payment_score ?? 5]}
                        onValueChange={([v]) => update('payment_score', v)}
                        min={1} max={10} step={1}
                        className="mt-2"
                        disabled={readOnly}
                      />
                    </div>
                  </CardContent>
                </Card>

                {clientType === 'individual' && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Billing Info</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">Billing Name</Label><Input maxLength={200} value={formData.billing_name || ''} onChange={e => update('billing_name', e.target.value)} className="h-9" disabled={readOnly} /></div>
                      <div><Label className="text-xs">Billing Email</Label><Input maxLength={254} value={formData.billing_email || ''} onChange={e => update('billing_email', e.target.value)} className="h-9" disabled={readOnly} /></div>
                    </CardContent>
                  </Card>
                )}

                {clientType === 'company' && showCompanyFields && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Billing Contact</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">Billing Contact Name</Label><Input maxLength={200} value={formData.billing_contact_name || ''} onChange={e => update('billing_contact_name', e.target.value)} className="h-9" disabled={readOnly} /></div>
                      <div><Label className="text-xs">Billing Contact Email</Label><Input maxLength={254} type="email" value={formData.billing_contact_email || ''} onChange={e => update('billing_contact_email', e.target.value)} className="h-9" disabled={readOnly} /></div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ─── Tab 4: Risk & Compliance ─── */}
              <TabsContent value="risk" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Risk Assessment</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs">Risk Score (1-10): <span className={`font-semibold ${getRiskColor(formData.risk_score ?? 5)}`}>{formData.risk_score ?? 5}</span></Label>
                      <Slider
                        value={[formData.risk_score ?? 5]}
                        onValueChange={([v]) => update('risk_score', v)}
                        min={1} max={10} step={1}
                        className="mt-2"
                        disabled={readOnly}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Risk Notes</Label>
                      <Textarea maxLength={5000} value={formData.risk_notes || ''} onChange={e => update('risk_notes', e.target.value)} rows={3} disabled={readOnly} />
                    </div>
                    <div>
                      <Label className="text-xs">SLA Terms</Label>
                      <Textarea maxLength={5000} value={formData.sla_terms || ''} onChange={e => update('sla_terms', e.target.value)} rows={3} disabled={readOnly} />
                    </div>
                  </CardContent>
                </Card>

                {clientType === 'individual' && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">ID Documents</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">ID Document Type</Label>
                        <Select value={formData.id_document_type || undefined} onValueChange={v => update('id_document_type', v)} disabled={readOnly}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {['passport', 'national_id', 'drivers_license', 'residence_permit'].map(t => (
                              <SelectItem key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-xs">ID Number</Label><Input maxLength={50} value={formData.id_document_number || ''} onChange={e => update('id_document_number', e.target.value)} className="h-9" disabled={readOnly} /></div>
                      <div><Label className="text-xs">ID Expiry</Label><Input type="date" value={formData.id_document_expiry || ''} onChange={e => update('id_document_expiry', e.target.value)} className="h-9" disabled={readOnly} /></div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ─── Tab 5: Address ─── */}
              <TabsContent value="address" className="space-y-4">
                {clientType === 'company' && showCompanyFields ? (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Headquarters Address</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      <div className="col-span-2"><Label className="text-xs">Address</Label><Input maxLength={500} value={formData.headquarters_address || ''} onChange={e => update('headquarters_address', e.target.value)} className="h-9" disabled={readOnly} /></div>
                      <div><Label className="text-xs">City</Label><Input maxLength={100} value={formData.headquarters_city || ''} onChange={e => update('headquarters_city', e.target.value)} className="h-9" disabled={readOnly} /></div>
                      <div><Label className="text-xs">Country *</Label><Input maxLength={100} value={formData.headquarters_country || ''} onChange={e => update('headquarters_country', e.target.value)} className="h-9" disabled={readOnly} /></div>
                      <div><Label className="text-xs">Postal Code</Label><Input maxLength={20} value={formData.postal_code || ''} onChange={e => update('postal_code', e.target.value)} className="h-9" disabled={readOnly} /></div>
                    </CardContent>
                  </Card>
                ) : clientType === 'individual' ? (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Address</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                      <div className="col-span-2"><Label className="text-xs">Address</Label><Input maxLength={500} value={formData.address_line1 || ''} onChange={e => update('address_line1', e.target.value)} className="h-9" disabled={readOnly} /></div>
                      <div><Label className="text-xs">City</Label><Input maxLength={100} value={formData.city || ''} onChange={e => update('city', e.target.value)} className="h-9" disabled={readOnly} /></div>
                      <div><Label className="text-xs">Country</Label><Input maxLength={100} value={formData.country || ''} onChange={e => update('country', e.target.value)} className="h-9" disabled={readOnly} /></div>
                      <div><Label className="text-xs">Postal Code</Label><Input maxLength={20} value={formData.postal_code || ''} onChange={e => update('postal_code', e.target.value)} className="h-9" disabled={readOnly} /></div>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Select a company to configure the address.</p>
                )}
              </TabsContent>

              {/* ─── Tab 6: Notes ─── */}
              <TabsContent value="notes" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">Internal Notes</CardTitle></CardHeader>
                  <CardContent>
                    <Textarea maxLength={5000} value={formData.notes || ''} onChange={e => update('notes', e.target.value)} rows={6} disabled={readOnly} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Submit buttons — always visible */}
            {!readOnly && (
              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => navigate(isEditMode ? `/clients/${editId}` : '/clients')}>Cancel</Button>
                <Button type="submit" disabled={!canSubmit}>
                  {isMutating ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Client')}
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateClient;
