import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, FolderKanban } from 'lucide-react';
import { useCreateContract } from '@/hooks/useContracts';
import { useSalesStaff } from '@/hooks/useSalesCommissions';
import { useCompanies, useAgencies, useCandidatesList } from '@/hooks/useContractParties';
import { useProjects } from '@/hooks/useProjects';
import ContractNumberInput from '@/components/contracts/ContractNumberInput';
import { getContractPrefix } from '@/types/contract';
import type { ContractPrefix, CreateContractInput } from '@/types/contract';

const contractTypeOptions = [
  { value: 'recruitment', label: 'Recruitment Contract (REC)' },
  { value: 'partnership', label: 'Partnership Agreement (PAR)' },
  { value: 'consultancy', label: 'Consultancy Agreement (CON)' },
  { value: 'service', label: 'Service Agreement (SRV)' },
];

export default function CreateContract() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId') || undefined;

  const createContract = useCreateContract();
  const { data: salesStaff = [] } = useSalesStaff();
  const { data: companies = [] } = useCompanies();
  const { data: agencies = [] } = useAgencies();
  const { data: candidates = [] } = useCandidatesList();
  const { data: projects = [] } = useProjects();

  const { toast } = useToast();
  const [showErrors, setShowErrors] = useState(false);

  const fieldError = (value: string) => {
    if (!showErrors) return '';
    if (!value || !value.trim()) return 'border-destructive ring-1 ring-destructive';
    return '';
  };

  const selectError = (value: string) => {
    if (!showErrors) return '';
    if (!value || value === 'none') return 'border-destructive ring-1 ring-destructive';
    return '';
  };

  const [form, setForm] = useState<CreateContractInput>({
    contract_type: 'recruitment' as any,
    party_type: 'employer',
    party_id: '',
    title: '',
    project_id: preselectedProjectId,
  });

  const [contractPrefix, setContractPrefix] = useState<ContractPrefix>('REC');
  const [contractNumber, setContractNumber] = useState<{
    sequenceNumber: number | null;
    contractDate: string | null;
  }>({ sequenceNumber: null, contractDate: null });

  const partyOptions = useMemo(() => {
    switch (form.party_type) {
      case 'employer': return companies;
      case 'agency': return agencies;
      case 'worker': return candidates;
      default: return [];
    }
  }, [form.party_type, companies, agencies, candidates]);

  const handleContractTypeChange = (type: string) => {
    setForm(p => ({ ...p, contract_type: type as any }));
    setContractPrefix(getContractPrefix(type as any));
    setContractNumber({ sequenceNumber: null, contractDate: null });
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.party_id.trim()) return;
    const result = await createContract.mutateAsync({
      ...form,
      contract_prefix: contractPrefix,
      sequence_number: contractNumber.sequenceNumber ?? undefined,
      contract_date: contractNumber.contractDate ?? undefined,
    });
    // Navigate to contracts page, or offer to create project
    if (!form.project_id) {
      setCreatedContractId(result.id);
      setShowProjectPrompt(true);
    } else {
      navigate('/contracts');
    }
  };

  const [createdContractId, setCreatedContractId] = useState<string | null>(null);
  const [showProjectPrompt, setShowProjectPrompt] = useState(false);

  if (showProjectPrompt && createdContractId) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Contract Created Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Would you like to create a project for this contract?
              </p>
              <div className="flex gap-3">
                <Button onClick={() => navigate(`/projects/new?contractId=${createdContractId}`)}>
                  Create Linked Project
                </Button>
                <Button variant="outline" onClick={() => navigate('/contracts')}>
                  Skip — Go to Contracts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" className="gap-2 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <h1 className="text-2xl font-bold">Create New Contract</h1>

        <div className="grid gap-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Contract title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contract Type</Label>
                  <Select value={form.contract_type} onValueChange={handleContractTypeChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {contractTypeOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Party Type</Label>
                  <Select value={form.party_type} onValueChange={v => setForm(p => ({ ...p, party_type: v as any, party_id: '' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employer">Employer</SelectItem>
                      <SelectItem value="agency">Agency</SelectItem>
                      <SelectItem value="worker">Worker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <ContractNumberInput
                contractPrefix={contractPrefix}
                value={contractNumber}
                onChange={setContractNumber}
              />
            </CardContent>
          </Card>

          {/* Parties */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parties & Sales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{form.party_type === 'employer' ? 'Employer' : form.party_type === 'agency' ? 'Agency' : 'Worker'} *</Label>
                <Select value={form.party_id || 'none'} onValueChange={v => setForm(p => ({ ...p, party_id: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder={`Select ${form.party_type}`} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Select —</SelectItem>
                    {partyOptions.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sales Person</Label>
                <Select value={(form as any).sales_person_id || 'none'} onValueChange={v => setForm(p => ({ ...p, sales_person_id: v === 'none' ? undefined : v } as any))}>
                  <SelectTrigger><SelectValue placeholder="Select sales person" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {salesStaff.map(s => (
                      <SelectItem key={s.user_id} value={s.user_id}>{s.full_name || s.user_id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Dates & Value */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dates & Value</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={form.start_date || ''} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={form.end_date || ''} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Value</Label>
                  <Input type="number" value={form.total_value || ''} onChange={e => setForm(p => ({ ...p, total_value: parseFloat(e.target.value) || undefined }))} />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Input value={form.currency || 'EUR'} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linking & Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project & Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Linked Project</Label>
                <Select value={form.project_id || 'none'} onValueChange={v => setForm(p => ({ ...p, project_id: v === 'none' ? undefined : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select project (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} — {p.employer_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={4} />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createContract.isPending || !form.party_id || !form.title.trim()}>
              {createContract.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Contract
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
