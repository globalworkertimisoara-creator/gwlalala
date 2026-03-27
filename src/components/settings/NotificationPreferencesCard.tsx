import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { Separator } from '@/components/ui/separator';
import { Bell, Mail, Monitor, Loader2 } from 'lucide-react';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';

export function NotificationPreferencesCard() {
  const { preferences, isLoading, upsert, NOTIFICATION_TYPES } = useNotificationPreferences();

  const getPreference = (type: string) => {
    const pref = preferences.find((p: any) => p.notification_type === type);
    return { in_app: pref?.in_app ?? true, email: pref?.email ?? false };
  };

  const handleToggle = (type: string, channel: 'in_app' | 'email', current: boolean) => {
    const pref = getPreference(type);
    upsert.mutate({
      notification_type: type,
      in_app: channel === 'in_app' ? !current : pref.in_app,
      email: channel === 'email' ? !current : pref.email,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Bell className="h-4 w-4" /> Notification Preferences
        </CardTitle>
        <CardDescription className="text-xs">
          Choose which notifications you receive and how
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Channel headers */}
        <div className="flex items-center justify-end gap-6 pb-2 pr-1">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Monitor className="h-3 w-3" /> In-App
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Mail className="h-3 w-3" /> Email
          </div>
        </div>

        <Separator />

        {NOTIFICATION_TYPES.map((notifType) => {
          const pref = getPreference(notifType.value);
          return (
            <div
              key={notifType.value}
              className="flex items-center justify-between py-2.5 px-1 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <Label className="text-xs font-medium cursor-pointer">{notifType.label}</Label>
              </div>
              <div className="flex items-center gap-6">
                <Switch
                  checked={pref.in_app}
                  onCheckedChange={() => handleToggle(notifType.value, 'in_app', pref.in_app)}
                  disabled={upsert.isPending}
                  className="scale-90"
                />
                <Switch
                  checked={pref.email}
                  onCheckedChange={() => handleToggle(notifType.value, 'email', pref.email)}
                  disabled={upsert.isPending}
                  className="scale-90"
                />
              </div>
            </div>
          );
        })}

        <Separator className="mt-2" />
        <p className="text-[10px] text-muted-foreground pt-2">
          Email notifications are sent to your registered email address. In-app notifications appear in the bell icon in the sidebar.
        </p>
      </CardContent>
    </Card>
  );
}
