import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Save, User } from 'lucide-react';

interface PersonalInfoData {
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  marital_status: string | null;
  number_of_children: number | null;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  current_country: string | null;
  current_city: string | null;
  linkedin: string | null;
}

interface Props {
  data: PersonalInfoData;
  onSave: (data: Partial<PersonalInfoData>) => void;
  saving?: boolean;
}

export function CVPersonalInfo({ data, onSave, saving }: Props) {
  const [form, setForm] = useState<PersonalInfoData>(data);

  useEffect(() => { setForm(data); }, [data]);

  const handleSave = () => {
    onSave({
      full_name: form.full_name,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      nationality: form.nationality || null,
      marital_status: form.marital_status || null,
      number_of_children: form.number_of_children,
      email: form.email,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      current_country: form.current_country || null,
      current_city: form.current_city || null,
      linkedin: form.linkedin || null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Full Name</Label>
            <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div>
            <Label>Date of Birth</Label>
            <Input type="date" value={form.date_of_birth || ''} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
          </div>
          <div>
            <Label>Gender</Label>
            <Select value={form.gender || '_none'} onValueChange={v => setForm(f => ({ ...f, gender: v === '_none' ? null : v }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Not specified</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nationality</Label>
            <Input value={form.nationality || ''} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} />
          </div>
          <div>
            <Label>Marital Status</Label>
            <Select value={form.marital_status || '_none'} onValueChange={v => setForm(f => ({ ...f, marital_status: v === '_none' ? null : v }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Not specified</SelectItem>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Number of Children</Label>
            <Input type="number" min={0} value={form.number_of_children ?? 0} onChange={e => setForm(f => ({ ...f, number_of_children: parseInt(e.target.value) || 0 }))} />
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            📞 Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <Label>Phone (with country code)</Label>
            <Input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <Label>WhatsApp Number</Label>
            <Input value={form.whatsapp || ''} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
          </div>
          <div>
            <Label>Current Country</Label>
            <Input value={form.current_country || ''} onChange={e => setForm(f => ({ ...f, current_country: e.target.value }))} />
          </div>
          <div>
            <Label>Current City</Label>
            <Input value={form.current_city || ''} onChange={e => setForm(f => ({ ...f, current_city: e.target.value }))} />
          </div>
          <div>
            <Label>LinkedIn</Label>
            <Input value={form.linkedin || ''} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> Save Personal & Contact Info
        </Button>
      </div>
    </div>
  );
}
