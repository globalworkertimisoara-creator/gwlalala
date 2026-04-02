import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building2, UserRound } from 'lucide-react';
import { useCreateClient } from '@/hooks/useClients';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ClientType } from '@/types/client';

const CreateClient = () => {
  const navigate = useNavigate();
  const createClient = useCreateClient();
  const [clientType, setClientType] = useState<ClientType>('company');
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-for-client'],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('id, company_name, headquarters_city, headquarters_country').order('company_name');
      return data || [];
    },
  });

  const { data: existingCompanyClients = [] } = useQuery({
    queryKey: ['existing-company-clients'],
    queryFn: async () => {
      const { data } = await supabase.from('clients').select('company_id').eq('client_type', 'company').not('company_id', 'is', null);
      return (data || []).map(c => c.company_id);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: Record<string, any> = {
      client_type: clientType,
      status: formData.status || 'lead',
      source: formData.source || null,
      notes: formData.notes || null,
    };

    if (clientType === 'company') {
      if (!formData.company_id) return;
      input.company_id = formData.company_id;
    } else {
      if (!formData.first_name || !formData.last_name || !formData.email) return;
      Object.assign(input, {
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

    const result = await createClient.mutateAsync(input);
    if (result) navigate(`/clients/${result.id}`);
  };

  const update = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));
  const isExistingClient = clientType === 'company' && formData.company_id && existingCompanyClients.includes(formData.company_id);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/clients')} className="mb-4 gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Clients
          </Button>

          <h1 className="text-xl font-bold mb-6">New Client</h1>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {(['company', 'individual'] as ClientType[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => { setClientType(type); setFormData({}); }}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${clientType === type ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'}`}
              >
                {type === 'company' ? <Building2 className="h-6 w-6" /> : <UserRound className="h-6 w-6" />}
                <span className="font-medium capitalize">{type}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {clientType === 'company' ? (
              <Card>
                <CardHeader><CardTitle className="text-sm">Company</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Select Company *</Label>
                    <Select value={formData.company_id || ''} onValueChange={v => update('company_id', v)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Choose a company..." /></SelectTrigger>
                      <SelectContent>
                        {companies.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.company_name} — {c.headquarters_city}, {c.headquarters_country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isExistingClient && <p className="text-xs text-destructive mt-1">This company is already a client.</p>}
                  </div>
                </CardContent>
              </Card>
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
                  <Select value={formData.source || ''} onValueChange={v => update('source', v)}>
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
              <Button type="button" variant="outline" onClick={() => navigate('/clients')}>Cancel</Button>
              <Button type="submit" disabled={createClient.isPending || (clientType === 'company' && !formData.company_id) || (clientType === 'individual' && (!formData.first_name || !formData.last_name || !formData.email))}>
                {createClient.isPending ? 'Creating...' : 'Create Client'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateClient;
