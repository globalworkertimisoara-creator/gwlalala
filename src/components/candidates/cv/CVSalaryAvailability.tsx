import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, DollarSign, CalendarDays, Target } from 'lucide-react';

interface SalaryData {
  current_salary: string;
  expected_salary: string;
  currency: string;
  negotiable: boolean;
}

interface AvailabilityData {
  available_to_start: string;
  employment_status: string;
  notice_period: string;
  willing_to_relocate: boolean;
}

interface JobPrefsData {
  preferred_titles: string;
  preferred_countries: string;
  preferred_work_type: string;
}

interface FamilyData {
  has_spouse: boolean;
  children_ages: string;
  family_willing_to_relocate: boolean;
}

interface Props {
  salary: SalaryData;
  availability: AvailabilityData;
  jobPreferences: JobPrefsData;
  family: FamilyData;
  onSave: (data: { salary_expectations: SalaryData; availability: AvailabilityData; job_preferences: JobPrefsData; family_info: FamilyData }) => void;
  saving?: boolean;
}

export function CVSalaryAvailability({ salary: initS, availability: initA, jobPreferences: initJ, family: initF, onSave, saving }: Props) {
  const [salary, setSalary] = useState(initS);
  const [avail, setAvail] = useState(initA);
  const [prefs, setPrefs] = useState(initJ);
  const [family, setFamily] = useState(initF);

  useEffect(() => { setSalary(initS); }, [initS]);
  useEffect(() => { setAvail(initA); }, [initA]);
  useEffect(() => { setPrefs(initJ); }, [initJ]);
  useEffect(() => { setFamily(initF); }, [initF]);

  return (
    <div className="space-y-6">
      {/* Salary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Salary Expectations
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>Current Salary</Label>
            <Input value={salary.current_salary} onChange={e => setSalary(s => ({ ...s, current_salary: e.target.value }))} placeholder="Optional" />
          </div>
          <div>
            <Label>Expected Salary</Label>
            <Input value={salary.expected_salary} onChange={e => setSalary(s => ({ ...s, expected_salary: e.target.value }))} />
          </div>
          <div>
            <Label>Currency</Label>
            <Input value={salary.currency} onChange={e => setSalary(s => ({ ...s, currency: e.target.value }))} placeholder="EUR, USD..." />
          </div>
          <div>
            <Label>Negotiable?</Label>
            <Select value={salary.negotiable ? 'yes' : 'no'} onValueChange={v => setSalary(s => ({ ...s, negotiable: v === 'yes' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Availability
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>Available to Start</Label>
            <Select value={avail.available_to_start || '_none'} onValueChange={v => setAvail(a => ({ ...a, available_to_start: v === '_none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Not specified</SelectItem>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="2_weeks">2 Weeks</SelectItem>
                <SelectItem value="1_month">1 Month</SelectItem>
                <SelectItem value="2_months">2 Months</SelectItem>
                <SelectItem value="3_months">3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Employment Status</Label>
            <Select value={avail.employment_status || '_none'} onValueChange={v => setAvail(a => ({ ...a, employment_status: v === '_none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Not specified</SelectItem>
                <SelectItem value="employed">Employed</SelectItem>
                <SelectItem value="unemployed">Unemployed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notice Period</Label>
            <Input value={avail.notice_period} onChange={e => setAvail(a => ({ ...a, notice_period: e.target.value }))} placeholder="e.g. 30 days" />
          </div>
          <div>
            <Label>Willing to Relocate?</Label>
            <Select value={avail.willing_to_relocate ? 'yes' : 'no'} onValueChange={v => setAvail(a => ({ ...a, willing_to_relocate: v === 'yes' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Job Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" /> Job Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Preferred Titles</Label>
            <Input value={prefs.preferred_titles} onChange={e => setPrefs(p => ({ ...p, preferred_titles: e.target.value }))} placeholder="e.g. Welder, Electrician" />
          </div>
          <div>
            <Label>Preferred Countries</Label>
            <Input value={prefs.preferred_countries} onChange={e => setPrefs(p => ({ ...p, preferred_countries: e.target.value }))} placeholder="e.g. Germany, Austria" />
          </div>
          <div>
            <Label>Work Type</Label>
            <Select value={prefs.preferred_work_type || '_none'} onValueChange={v => setPrefs(p => ({ ...p, preferred_work_type: v === '_none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Not specified</SelectItem>
                <SelectItem value="full_time">Full-time</SelectItem>
                <SelectItem value="part_time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Family */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            👨‍👩‍👧‍👦 Family
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Spouse?</Label>
            <Select value={family.has_spouse ? 'yes' : 'no'} onValueChange={v => setFamily(f => ({ ...f, has_spouse: v === 'yes' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Children Ages</Label>
            <Input value={family.children_ages} onChange={e => setFamily(f => ({ ...f, children_ages: e.target.value }))} placeholder="e.g. 5, 8, 12" />
          </div>
          <div>
            <Label>Family Willing to Relocate?</Label>
            <Select value={family.family_willing_to_relocate ? 'yes' : 'no'} onValueChange={v => setFamily(f => ({ ...f, family_willing_to_relocate: v === 'yes' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => onSave({ salary_expectations: salary, availability: avail, job_preferences: prefs, family_info: family })} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> Save All Preferences
        </Button>
      </div>
    </div>
  );
}
