import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRegistrationCodes, useUpdateRegistrationCode } from '@/hooks/useRegistrationCodes';
import { Loader2, Eye, EyeOff, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function RegistrationCodesCard() {
  const { data: codes, isLoading } = useRegistrationCodes();
  const updateCode = useUpdateRegistrationCode();
  
  const [staffCode, setStaffCode] = useState('');
  const [agencyCode, setAgencyCode] = useState('');
  const [showStaffCode, setShowStaffCode] = useState(false);
  const [showAgencyCode, setShowAgencyCode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const staffCodeData = codes?.find(c => c.code_type === 'staff');
  const agencyCodeData = codes?.find(c => c.code_type === 'agency');

  const handleEdit = () => {
    setStaffCode(staffCodeData?.code_value || '');
    setAgencyCode(agencyCodeData?.code_value || '');
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setStaffCode('');
    setAgencyCode('');
  };

  const handleSave = async () => {
    if (staffCode !== staffCodeData?.code_value) {
      await updateCode.mutateAsync({ codeType: 'staff', codeValue: staffCode });
    }
    if (agencyCode !== agencyCodeData?.code_value) {
      await updateCode.mutateAsync({ codeType: 'agency', codeValue: agencyCode });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Registration Codes</CardTitle>
        </div>
        <CardDescription>
          Control who can register by requiring these secret codes during signup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="staff-code">Staff Registration Code</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="staff-code"
                type={showStaffCode ? 'text' : 'password'}
                value={isEditing ? staffCode : staffCodeData?.code_value || ''}
                onChange={(e) => setStaffCode(e.target.value)}
                disabled={!isEditing}
                placeholder="Enter staff registration code"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowStaffCode(!showStaffCode)}
              >
                {showStaffCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Required for staff members to create accounts at /auth
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agency-code">Agency Registration Code</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="agency-code"
                type={showAgencyCode ? 'text' : 'password'}
                value={isEditing ? agencyCode : agencyCodeData?.code_value || ''}
                onChange={(e) => setAgencyCode(e.target.value)}
                disabled={!isEditing}
                placeholder="Enter agency registration code"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowAgencyCode(!showAgencyCode)}
              >
                {showAgencyCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Required for agencies to register at /agency-auth
          </p>
        </div>

        <div className="flex gap-2 pt-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={updateCode.isPending}>
                {updateCode.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={updateCode.isPending}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit}>Edit Codes</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
