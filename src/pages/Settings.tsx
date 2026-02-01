import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import GoogleDriveSetup from '@/components/settings/GoogleDriveSetup';
import { RegistrationCodesCard } from '@/components/settings/RegistrationCodesCard';
import { useAuth } from '@/contexts/AuthContext';

const Settings = () => {
  const { isAdmin } = useAuth();
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your recruitment tracker preferences
          </p>
        </div>

        {/* Registration Codes - Admin Only */}
        {isAdmin && (
          <>
            <RegistrationCodesCard />
            <Separator />
          </>
        )}

        {/* Google Drive Integration */}
        <GoogleDriveSetup />

        <Separator />

        {/* Company Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              Update your company details and branding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input id="company-name" defaultValue="GlobalWorker" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-email">Contact Email</Label>
              <Input id="company-email" type="email" defaultValue="hr@globalworker.com" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Pipeline Stages */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Stages</CardTitle>
            <CardDescription>
              Customize your recruitment pipeline stages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Stage customization coming soon. Currently using default stages: 
              Sourced → Screening → Interview → Technical → Offer → Hired
            </p>
          </CardContent>
        </Card>

        <Separator />

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Configure when you receive updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Notification settings coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Settings;
