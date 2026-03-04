import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Plus, Trash2, Users } from 'lucide-react';

interface ReferenceEntry {
  reference_name: string;
  position_title: string;
  phone: string;
  email: string;
  relationship: string;
}

interface Props {
  entries: ReferenceEntry[];
  onSave: (entries: ReferenceEntry[]) => void;
  saving?: boolean;
}

const RELATIONSHIPS = ['Manager', 'Supervisor', 'Colleague', 'Client', 'Professor', 'Other'];

export function CVReferences({ entries: initial, onSave, saving }: Props) {
  const [entries, setEntries] = useState<ReferenceEntry[]>(initial);
  useEffect(() => { setEntries(initial); }, [initial]);

  const add = () => {
    if (entries.length >= 3) return;
    setEntries([...entries, { reference_name: '', position_title: '', phone: '', email: '', relationship: '' }]);
  };

  const remove = (i: number) => setEntries(entries.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof ReferenceEntry, value: string) => {
    setEntries(entries.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" /> References
        </CardTitle>
        <Button variant="outline" size="sm" onClick={add} disabled={entries.length >= 3} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length === 0 && <p className="text-sm text-muted-foreground">No references added.</p>}
        {entries.map((entry, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3 relative">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pr-8">
              <div>
                <Label>Name</Label>
                <Input value={entry.reference_name} onChange={e => update(i, 'reference_name', e.target.value)} />
              </div>
              <div>
                <Label>Position/Title</Label>
                <Input value={entry.position_title} onChange={e => update(i, 'position_title', e.target.value)} />
              </div>
              <div>
                <Label>Relationship</Label>
                <Select value={entry.relationship || '_none'} onValueChange={v => update(i, 'relationship', v === '_none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Select</SelectItem>
                    {RELATIONSHIPS.map(r => <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={entry.phone} onChange={e => update(i, 'phone', e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={entry.email} onChange={e => update(i, 'email', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        {entries.length > 0 && (
          <div className="flex justify-end pt-2">
            <Button onClick={() => onSave(entries)} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> Save References
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
