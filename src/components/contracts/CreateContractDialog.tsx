import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useCreateContract, type CreateContractInput } from '@/hooks/useContracts';
import { useSalesStaff } from '@/hooks/useSalesCommissions';
import { useCompanies, useAgencies, useCandidatesList } from '@/hooks/useContractParties';

interface CreateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateContractDialog({ open, onOpenChange }: CreateContractDialogProps) {
  const createContract = useCreateContract();
  const { data: salesStaff = [] } = useSalesStaff();
  const { data: companies = [] } = useCompanies();
  const { data: agencies = [] } = useAgencies();
  const { data: candidates = [] } = useCandidatesList();

  const [form, setForm] = useState<CreateContractInput>({
    contract_type: 'employer_agreement',
    party_type: 'employer',
    party_id: '',
    title: '',
  });

  const partyOptions = useMemo(() => {
    switch (form.party_type) {
      case 'employer': return companies;
      case 'agency': return agencies;
      case 'worker': return candidates;
      default: return [];
    }
  }, [form.party_type, companies, agencies, candidates]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.party_id.trim()) return;
    await createContract.mutateAsync(form);
    setForm({ contract_type: 'employer_agreement', party_type: 'employer', party_id: '', title: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
              <Select value={form.contract_type} onValueChange={v => setForm(p => ({ ...p, contract_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employer_agreement">Employer Agreement</SelectItem>
                  <SelectItem value="agency_agreement">Agency Agreement</SelectItem>
                  <SelectItem value="worker_contract">Worker Contract</SelectItem>
                  <SelectItem value="service_agreement">Service Agreement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Party Type</Label>
              <Select value={form.party_type} onValueChange={v => setForm(p => ({ ...p, party_type: v, party_id: '' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employer">Employer</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                  <SelectItem value="worker">Worker</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>{form.party_type === 'employer' ? 'Employer' : form.party_type === 'agency' ? 'Agency' : 'Worker'}</Label>
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
