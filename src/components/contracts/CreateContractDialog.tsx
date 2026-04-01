import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useCreateContract } from '@/hooks/useContracts';
import { useSalesStaff } from '@/hooks/useSalesCommissions';
import { useCompanies, useAgencies, useCandidatesList, useIndividualClients } from '@/hooks/useContractParties';
import { useProjects } from '@/hooks/useProjects';
import ContractNumberInput from './ContractNumberInput';
import { getContractPrefix } from '@/types/contract';
import type { ContractPrefix, CreateContractInput } from '@/types/contract';

interface CreateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedProjectId?: string;
}

const contractTypeOptions = [
  { value: 'recruitment', label: 'Recruitment Contract (REC)' },
  { value: 'partnership', label: 'Partnership Agreement (PAR)' },
  { value: 'consultancy', label: 'Consultancy Agreement (CON)' },
  { value: 'service', label: 'Service Agreement (SRV)' },
];

export function CreateContractDialog({ open, onOpenChange, preselectedProjectId }: CreateContractDialogProps) {
  const createContract = useCreateContract();
  const { data: salesStaff = [] } = useSalesStaff();
  const { data: companies = [] } = useCompanies();
  const { data: agencies = [] } = useAgencies();
  const { data: candidates = [] } = useCandidatesList();
  const { data: individualClients = [] } = useIndividualClients();
  const { data: projects = [] } = useProjects();

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
      case 'individual': return individualClients;
      default: return [];
    }
  }, [form.party_type, companies, agencies, candidates, individualClients]);

  const handleContractTypeChange = (type: string) => {
    setForm(p => ({ ...p, contract_type: type as any }));
    setContractPrefix(getContractPrefix(type as any));
    setContractNumber({ sequenceNumber: null, contractDate: null });
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.party_id.trim()) return;
    await createContract.mutateAsync({
      ...form,
      contract_prefix: contractPrefix,
      sequence_number: contractNumber.sequenceNumber ?? undefined,
      contract_date: contractNumber.contractDate ?? undefined,
    });
    setForm({ contract_type: 'recruitment' as any, party_type: 'employer', party_id: '', title: '' });
    setContractNumber({ sequenceNumber: null, contractDate: null });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Contract</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
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
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contract Number Input */}
          <ContractNumberInput
            contractPrefix={contractPrefix}
            value={contractNumber}
            onChange={setContractNumber}
          />

          <div>
            <Label>{form.party_type === 'employer' ? 'Employer' : form.party_type === 'agency' ? 'Agency' : form.party_type === 'individual' ? 'Individual' : 'Worker'}</Label>
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
            <Textarea value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createContract.isPending || !form.party_id}>
              {createContract.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Contract
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
