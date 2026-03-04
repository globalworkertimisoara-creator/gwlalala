import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Plus, Trash2, GraduationCap } from 'lucide-react';

interface EducationEntry {
  education_level: string;
  field_of_study: string;
  institution_name: string;
  graduation_year: number | null;
  degree_obtained: string;
}

interface Props {
  entries: EducationEntry[];
  onSave: (entries: EducationEntry[]) => void;
  saving?: boolean;
}

const LEVELS = ['High School', "Bachelor's", "Master's", 'PhD', 'Vocational', 'Certificate', 'Other'];

export function CVEducation({ entries: initial, onSave, saving }: Props) {
  const [entries, setEntries] = useState<EducationEntry[]>(initial);
  useEffect(() => { setEntries(initial); }, [initial]);

  const add = () => {
    if (entries.length >= 3) return;
    setEntries([...entries, { education_level: '', field_of_study: '', institution_name: '', graduation_year: null, degree_obtained: '' }]);
  };

  const remove = (i: number) => setEntries(entries.filter((_, idx) => idx !== i));

  const update = (i: number, field: keyof EducationEntry, value: any) => {
    setEntries(entries.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="h-4 w-4" /> Education
        </CardTitle>
        <Button variant="outline" size="sm" onClick={add} disabled={entries.length >= 3} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length === 0 && <p className="text-sm text-muted-foreground">No education entries yet.</p>}
        {entries.map((entry, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3 relative">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(i)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pr-8">
              <div>
                <Label>Education Level</Label>
                <Select value={entry.education_level || '_none'} onValueChange={v => update(i, 'education_level', v === '_none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Select level</SelectItem>
                    {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Field of Study</Label>
                <Input value={entry.field_of_study} onChange={e => update(i, 'field_of_study', e.target.value)} />
              </div>
              <div>
                <Label>Institution</Label>
                <Input value={entry.institution_name} onChange={e => update(i, 'institution_name', e.target.value)} />
              </div>
              <div>
                <Label>Graduation Year</Label>
                <Input type="number" min={1960} max={2030} value={entry.graduation_year || ''} onChange={e => update(i, 'graduation_year', parseInt(e.target.value) || null)} />
              </div>
              <div>
                <Label>Degree/Certificate</Label>
                <Input value={entry.degree_obtained} onChange={e => update(i, 'degree_obtained', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        {entries.length > 0 && (
          <div className="flex justify-end pt-2">
            <Button onClick={() => onSave(entries)} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> Save Education
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
