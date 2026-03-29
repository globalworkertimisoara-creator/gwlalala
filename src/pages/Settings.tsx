import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Settings as SettingsIcon, User, Key, Bell, Cloud, Shield, Building2,
  Loader2, Trash2, AlertTriangle, ChevronRight, X,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import GoogleDriveSetup from '@/components/settings/GoogleDriveSetup';
import { RegistrationCodesCard } from '@/components/settings/RegistrationCodesCard';
import { NotificationPreferencesCard } from '@/components/settings/NotificationPreferencesCard';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ── Detail panel types ─────────────────────────────────────────────────────
interface SettingsDetailItem {
  type: 'profile' | 'security' | 'notifications' | 'integrations' | 'admin';
  title: string;
}

export default function Settings() {
  const { user, role, isAdmin, signOut } = useAuth();
  const { can } = usePermissions();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Profile state
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Account deletion
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Detail panel
  const [detailItem, setDetailItem] = useState<SettingsDetailItem | null>(null);

  const userInitials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } });
      if (error) throw error;
      await supabase.from('profiles').update({ full_name: fullName }).eq('user_id', user?.id);
      toast({ title: 'Profile updated', description: 'Your profile has been updated successfully.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: error.message });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match', description: 'Please make sure both passwords are identical.' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ variant: 'destructive', title: 'Password too short', description: 'Password must be at least 8 characters long.' });
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Password update failed', description: error.message });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      toast({ title: 'Account deletion requested', description: 'Please contact an administrator to complete account deletion.' });
      await signOut();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Build available tabs based on role
  const tabs = [
    { value: 'profile', label: 'Profile', icon: User },
    { value: 'security', label: 'Security', icon: Key },
    { value: 'notifications', label: 'Notifications', icon: Bell },
    { value: 'integrations', label: 'Integrations', icon: Cloud },
    ...(can('modifySettings') ? [{ value: 'admin', label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] flex overflow-hidden">
        {/* ── Main Content ───────────────────────────────────── */}
        <div className={`flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300 ${detailItem ? 'w-[65%]' : 'w-full'}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <SettingsIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-xs text-muted-foreground">Manage your account, preferences, and system settings</p>
              </div>
            </div>

            {/* Compact profile chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-xs font-medium">{user?.user_metadata?.full_name || user?.email}</p>
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 capitalize">{role?.replace('_', ' ') || 'User'}</Badge>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="bg-muted/50 h-9">
              {tabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs h-7 px-3">
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ── Profile Tab ─────────────────────────────────── */}
            <TabsContent value="profile" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" /> Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">{userInitials}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{user?.user_metadata?.full_name || 'No name set'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <Badge variant="secondary" className="text-[10px] capitalize">{role?.replace('_', ' ') || 'User'}</Badge>
                    </div>
                  </div>
                  <Separator />
                  <form onSubmit={handleUpdateProfile} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-xs">Full Name</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs">Email</Label>
                      <Input id="email" type="email" value={user?.email || ''} disabled className="bg-muted h-8 text-sm" />
                      <p className="text-[10px] text-muted-foreground">Email cannot be changed. Contact an administrator if needed.</p>
                    </div>
                    <Button type="submit" size="sm" disabled={isUpdatingProfile}>
                      {isUpdatingProfile && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                      Update Profile
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Security Tab ────────────────────────────────── */}
            <TabsContent value="security" className="space-y-4 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Key className="h-4 w-4" /> Change Password
                  </CardTitle>
                  <CardDescription className="text-xs">Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="newPassword" className="text-xs">New Password</Label>
                      <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" minLength={8} required className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-xs">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" minLength={8} required className="h-8 text-sm" />
                    </div>
                    <Button type="submit" size="sm" disabled={isUpdatingPassword}>
                      {isUpdatingPassword && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                      Change Password
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" /> Danger Zone
                  </CardTitle>
                  <CardDescription className="text-xs">Irreversible actions for your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-3 w-3" /> Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently request deletion of your account
                          and remove your data from our servers. An administrator will process this request.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={isDeletingAccount}
                        >
                          {isDeletingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Notifications Tab ───────────────────────────── */}
            <TabsContent value="notifications" className="space-y-4 mt-0">
              <NotificationPreferencesCard />
            </TabsContent>

            {/* ── Integrations Tab ────────────────────────────── */}
            <TabsContent value="integrations" className="space-y-4 mt-0">
              <GoogleDriveSetup />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Pipeline Stages</CardTitle>
                  <CardDescription className="text-xs">Customize your recruitment pipeline stages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 flex-wrap">
                    {['Sourced', 'Screening', 'Interview', 'Technical', 'Offer', 'Hired'].map(stage => (
                      <Badge key={stage} variant="outline" className="text-xs">{stage}</Badge>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Stage customization coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Admin Tab ───────────────────────────────────── */}
            {can('modifySettings') && (
              <TabsContent value="admin" className="space-y-4 mt-0">
                <RegistrationCodesCard />

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Company Information
                    </CardTitle>
                    <CardDescription className="text-xs">Update your company details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="company-name" className="text-xs">Company Name</Label>
                      <Input id="company-name" defaultValue="GlobalWorker" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="company-email" className="text-xs">Contact Email</Label>
                      <Input id="company-email" type="email" defaultValue="hr@globalworker.com" className="h-8 text-sm" />
                    </div>
                    <Button size="sm">Save Changes</Button>
                  </CardContent>
                </Card>

                {/* Quick links to admin areas */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {[
                      { label: 'Organization Structure', desc: 'Roles, teams, and staff', href: '/organization' },
                      { label: 'Billing Management', desc: 'Payments and milestones', href: '/billing' },
                      { label: 'Agency Contracts', desc: 'Manage agency agreements', href: '/admin/agency-contracts' },
                    ].map(link => (
                      <button
                        key={link.href}
                        onClick={() => navigate(link.href)}
                        className="flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-accent transition-colors text-left group"
                      >
                        <div>
                          <p className="text-xs font-medium">{link.label}</p>
                          <p className="text-[10px] text-muted-foreground">{link.desc}</p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* ── Detail Panel (reserved for future use — settings help, previews) ── */}
        {detailItem && (
          <div className="w-[35%] border-l bg-muted/30 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">{detailItem.title}</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailItem(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
