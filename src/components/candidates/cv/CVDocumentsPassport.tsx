import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, FileText, Car, Plus, Trash2 } from 'lucide-react';

const LICENSE_CATEGORIES = [
  { value: 'AM', label: 'AM – Mopeds' },
  { value: 'A1', label: 'A1 – Light motorcycles' },
  { value: 'A2', label: 'A2 – Medium motorcycles' },
  { value: 'A', label: 'A – Motorcycles' },
  { value: 'B1', label: 'B1 – Light vehicles' },
  { value: 'B', label: 'B – Cars' },
  { value: 'BE', label: 'BE – Car + trailer' },
  { value: 'C1', label: 'C1 – Medium trucks' },
  { value: 'C1E', label: 'C1E – Medium truck + trailer' },
  { value: 'C', label: 'C – Heavy trucks' },
  { value: 'CE', label: 'CE – Heavy truck + trailer' },
  { value: 'D1', label: 'D1 – Minibus' },
  { value: 'D1E', label: 'D1E – Minibus + trailer' },
  { value: 'D', label: 'D – Bus' },
  { value: 'DE', label: 'DE – Bus + trailer' },
];

interface OtherLicense {
  name: string;
  issuing_body: string;
  expiry_date: string;
}

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
    license_categories?: string[];
    years_experience: number | null;
    other_licenses?: OtherLicense[];
  };
  onSave: (data: any) => void;
  saving?: boolean;
}

export function CVDocumentsPassport({ passportData, driverLicense: initDL, onSave, saving }: Props) {
  const [passport, setPassport] = useState(passportData);
  const [dl, setDl] = useState({
    has_license: initDL.has_license ?? false,
    license_type: initDL.license_type ?? '',
    license_categories: initDL.license_categories ?? [],
    years_experience: initDL.years_experience ?? null,
    other_licenses: initDL.other_licenses ?? [],
  });

  useEffect(() => { setPassport(passportData); }, [passportData]);
  useEffect(() => {
    setDl({
      has_license: initDL.has_license ?? false,
      license_type: initDL.license_type ?? '',
      license_categories: initDL.license_categories ?? [],
      years_experience: initDL.years_experience ?? null,
      other_licenses: initDL.other_licenses ?? [],
    });
  }, [initDL]);

  const toggleCategory = (cat: string) => {
    setDl(d => ({
      ...d,
      license_categories: d.license_categories.includes(cat)
        ? d.license_categories.filter(c => c !== cat)
        : [...d.license_categories, cat],
    }));
  };

  const addOtherLicense = () => {
    setDl(d => ({
      ...d,
      other_licenses: [...d.other_licenses, { name: '', issuing_body: '', expiry_date: '' }],
    }));
  };

  const updateOtherLicense = (index: number, field: keyof OtherLicense, value: string) => {
    setDl(d => ({
      ...d,
      other_licenses: d.other_licenses.map((ol, i) => i === index ? { ...ol, [field]: value } : ol),
    }));
  };

  const removeOtherLicense = (index: number) => {
    setDl(d => ({ ...d, other_licenses: d.other_licenses.filter((_, i) => i !== index) }));
  };

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
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
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
              <div>
                <Label>Years of Driving</Label>
                <Input type="number" min={0} value={dl.years_experience ?? ''} onChange={e => setDl(d => ({ ...d, years_experience: parseInt(e.target.value) || null }))} />
              </div>
            )}
          </div>

          {dl.has_license && (
            <div>
              <Label className="mb-2 block">License Categories</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {LICENSE_CATEGORIES.map(cat => (
                  <label key={cat.value} className="flex items-center gap-2 text-sm cursor-pointer rounded-md border p-2 hover:bg-muted/50 transition-colors">
                    <Checkbox
                      checked={dl.license_categories.includes(cat.value)}
                      onCheckedChange={() => toggleCategory(cat.value)}
                    />
                    <span className="truncate">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Other Licenses & Certifications
          </CardTitle>
          <Button variant="outline" size="sm" onClick={addOtherLicense} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          {dl.other_licenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No other licenses added. Click "Add" to add forklift, crane, welding, or any other license.</p>
          ) : (
            <div className="space-y-3">
              {dl.other_licenses.map((ol, i) => (
                <div key={i} className="grid gap-3 sm:grid-cols-4 items-end border rounded-md p-3">
                  <div>
                    <Label>License / Certificate Name</Label>
                    <Input placeholder="e.g. Forklift, Crane, Welding" value={ol.name} onChange={e => updateOtherLicense(i, 'name', e.target.value)} />
                  </div>
                  <div>
                    <Label>Issuing Body</Label>
                    <Input placeholder="e.g. TÜV, OSHA" value={ol.issuing_body} onChange={e => updateOtherLicense(i, 'issuing_body', e.target.value)} />
                  </div>
                  <div>
                    <Label>Expiry Date</Label>
                    <Input type="date" value={ol.expiry_date} onChange={e => updateOtherLicense(i, 'expiry_date', e.target.value)} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeOtherLicense(i)} className="text-destructive h-9 w-9">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" /> Save Documents & Licenses
        </Button>
      </div>
    </div>
  );
}
