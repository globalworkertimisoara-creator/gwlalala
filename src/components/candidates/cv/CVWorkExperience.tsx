import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, Plus, Trash2, Briefcase } from 'lucide-react';

interface WorkEntry {
  job_title: string;
  company_name: string;
  country: string;
  start_date: string;
  end_date: string;
  job_description: string;
}

interface Props {
  entries: WorkEntry[];
  onSave: (entries: WorkEntry[]) => void;
  saving?: boolean;
}

export function CVWorkExperience({ entries: initial, onSave, saving }: Props) {
  const [entries, setEntries] = useState<WorkEntry[]>(initial);
  useEffect(() => { setEntries(initial); }, [initial]);

  const add = () => {
    if (entries.length >= 5) return;
    setEntries([...entries, { job_title: '', company_name: '', country: '', start_date: '', end_date: '', job_description: '' }]);
  };

  const remove = (i: number) => setEntries(entries.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof WorkEntry, value: string) => {
    setEntries(entries.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Briefcase className="h-4 w-4" /> Work Experience
        </CardTitle>
        <Button variant="outline" size="sm" onClick={add} disabled={entries.length >= 5} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length === 0 && <p className="text-sm text-muted-foreground">No work experience entries yet.</p>}
        {entries.map((entry, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3 relative">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pr-8">
              <div>
                <Label>Job Title</Label>
                <Input value={entry.job_title} onChange={e => update(i, 'job_title', e.target.value)} />
              </div>
              <div>
                <Label>Company</Label>
                <Input value={entry.company_name} onChange={e => update(i, 'company_name', e.target.value)} />
              </div>
              <div>
                <Label>Country</Label>
                <Input value={entry.country} onChange={e => update(i, 'country', e.target.value)} />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={entry.start_date} onChange={e => update(i, 'start_date', e.target.value)} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={entry.end_date} onChange={e => update(i, 'end_date', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Job Description</Label>
              <Textarea value={entry.job_description} onChange={e => update(i, 'job_description', e.target.value)} className="min-h-[60px]" />
            </div>
          </div>
        ))}
        {entries.length > 0 && (
          <div className="flex justify-end pt-2">
            <Button onClick={() => onSave(entries)} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> Save Work Experience
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
