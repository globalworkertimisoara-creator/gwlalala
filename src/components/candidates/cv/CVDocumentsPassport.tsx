import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, FileText, Car } from 'lucide-react';

interface Props {
  passportData: {
    passport_number: string | null;
    passport_issue_date: string | null;
    passport_expiry: string | null;
    passport_issued_by: string | null;
    national_id_number: string | null;
  };
  driverLicense: {
    has_license: boolean;
    license_type: string;
    years_experience: number | null;
  };
  onSave: (data: any) => void;
  saving?: boolean;
}

export function CVDocumentsPassport({ passportData, driverLicense: initDL, onSave, saving }: Props) {
  const [passport, setPassport] = useState(passportData);
  const [dl, setDl] = useState(initDL);

  useEffect(() => { setPassport(passportData); }, [passportData]);
  useEffect(() => { setDl(initDL); }, [initDL]);

  const handleSave = () => {
    onSave({
      passport_number: passport.passport_number || null,
      passport_issue_date: passport.passport_issue_date || null,
      passport_expiry: passport.passport_expiry || null,
      passport_issued_by: passport.passport_issued_by || null,
      national_id_number: passport.national_id_number || null,
      driver_license: dl,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Documents & ID
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Passport Number</Label>
            <Input value={passport.passport_number || ''} onChange={e => setPassport(p => ({ ...p, passport_number: e.target.value }))} />
          </div>
          <div>
            <Label>Issue Date</Label>
            <Input type="date" value={passport.passport_issue_date || ''} onChange={e => setPassport(p => ({ ...p, passport_issue_date: e.target.value }))} />
          </div>
          <div>
            <Label>Expiry Date</Label>
            <Input type="date" value={passport.passport_expiry || ''} onChange={e => setPassport(p => ({ ...p, passport_expiry: e.target.value }))} />
          </div>
          <div>
            <Label>Issued By</Label>
            <Input value={passport.passport_issued_by || ''} onChange={e => setPassport(p => ({ ...p, passport_issued_by: e.target.value }))} />
          </div>
          <div>
            <Label>National ID Number</Label>
            <Input value={passport.national_id_number || ''} onChange={e => setPassport(p => ({ ...p, national_id_number: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="h-4 w-4" /> Driver's License
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Has License?</Label>
            <Select value={dl.has_license ? 'yes' : 'no'} onValueChange={v => setDl(d => ({ ...d, has_license: v === 'yes' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {dl.has_license && (
            <>
              <div>
                <Label>License Type</Label>
                <Input placeholder="e.g. B, C, D" value={dl.license_type} onChange={e => setDl(d => ({ ...d, license_type: e.target.value }))} />
              </div>
              <div>
                <Label>Years of Driving</Label>
                <Input type="number" min={0} value={dl.years_experience ?? ''} onChange={e => setDl(d => ({ ...d, years_experience: parseInt(e.target.value) || null }))} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> Save Documents & License
        </Button>
      </div>
    </div>
  );
}
