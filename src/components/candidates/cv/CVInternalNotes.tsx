import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, ClipboardList } from 'lucide-react';

interface InternalNotesData {
  recruiter_notes: string;
  interview_feedback: string;
  quality_rating: string;
}

interface Props {
  data: InternalNotesData;
  onSave: (data: InternalNotesData) => void;
  saving?: boolean;
}

export function CVInternalNotes({ data: initial, onSave, saving }: Props) {
  const [form, setForm] = useState(initial);
  useEffect(() => { setForm(initial); }, [initial]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardList className="h-4 w-4" /> Internal Notes (Recruiter Only)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Recruiter Notes</Label>
          <Textarea value={form.recruiter_notes} onChange={e => setForm(f => ({ ...f, recruiter_notes: e.target.value }))} className="min-h-[80px]" />
        </div>
        <div>
          <Label>Interview Feedback</Label>
          <Textarea value={form.interview_feedback} onChange={e => setForm(f => ({ ...f, interview_feedback: e.target.value }))} className="min-h-[80px]" />
        </div>
        <div className="max-w-xs">
          <Label>Quality Rating</Label>
          <Select value={form.quality_rating || '_none'} onValueChange={v => setForm(f => ({ ...f, quality_rating: v === '_none' ? '' : v }))}>
            <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Not rated</SelectItem>
              <SelectItem value="A">A — Excellent</SelectItem>
              <SelectItem value="B">B — Good</SelectItem>
              <SelectItem value="C">C — Average</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={() => onSave(form)} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> Save Internal Notes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
