import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useAgencyProfile, 
  useCreateAgencyProfile, 
  useUpdateAgencyProfile,
  useAgencyWorkers 
} from '@/hooks/useAgency';
import { AgencyProfileForm } from '@/components/agency/AgencyProfileForm';
import { SubmitWorkerDialog } from '@/components/agency/SubmitWorkerDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Building2, 
  Users, 
  Briefcase, 
  Settings,
  Loader2,
  UserPlus,
  FileText,
  LogOut
} from 'lucide-react';
import { getStageLabel, getStageColor } from '@/types/database';
import { CreateAgencyProfileInput } from '@/types/agency';
import { format } from 'date-fns';

export default function AgencyDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  const { data: profile, isLoading: profileLoading } = useAgencyProfile();
  const { data: workers, isLoading: workersLoading } = useAgencyWorkers(profile?.id);
  const createProfile = useCreateAgencyProfile();
  const updateProfile = useUpdateAgencyProfile();

  const handleCreateProfile = async (data: CreateAgencyProfileInput) => {
    await createProfile.mutateAsync(data);
  };

  const handleUpdateProfile = async (data: CreateAgencyProfileInput) => {
    if (!profile) return;
    await updateProfile.mutateAsync({ id: profile.id, ...data });
    setShowProfileEdit(false);
  };

  const handleWorkerSubmitted = (workerId: string) => {
    navigate(`/agency/workers/${workerId}`);
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show profile setup if no profile exists
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <AgencyProfileForm 
            onSubmit={handleCreateProfile}
            isLoading={createProfile.isPending}
          />
        </div>
      </div>
    );
  }

  // Show profile edit form
  if (showProfileEdit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setShowProfileEdit(false)}
            className="mb-4"
          >
            ← Back to Dashboard
          </Button>
          <AgencyProfileForm 
            existingProfile={profile}
            onSubmit={handleUpdateProfile}
            isLoading={updateProfile.isPending}
          />
        </div>
      </div>
    );
  }

  // Stats
  const totalWorkers = workers?.length || 0;
  const placedWorkers = workers?.filter(w => w.current_stage === 'placed').length || 0;
  const inProgressWorkers = workers?.filter(w => 
    !['placed', 'closed_not_placed'].includes(w.current_stage)
  ).length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">{profile.company_name}</h1>
              <p className="text-sm text-muted-foreground">{profile.country}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowProfileEdit(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWorkers}</div>
              <p className="text-xs text-muted-foreground">Workers submitted</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressWorkers}</div>
              <p className="text-xs text-muted-foreground">Being processed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Placed</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{placedWorkers}</div>
              <p className="text-xs text-muted-foreground">Successfully placed</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <SubmitWorkerDialog 
            agencyId={profile.id} 
            onSuccess={handleWorkerSubmitted}
            trigger={
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Submit New Worker
              </Button>
            }
          />
        </div>

        {/* Workers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Submitted Workers</CardTitle>
            <CardDescription>
              View and manage your worker submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : workers?.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No workers submitted yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by submitting a worker for an open position
                </p>
                <SubmitWorkerDialog 
                  agencyId={profile.id} 
                  onSuccess={handleWorkerSubmitted}
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Nationality</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers?.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{worker.full_name}</p>
                          <p className="text-sm text-muted-foreground">{worker.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {worker.job ? (
                          <div>
                            <p className="font-medium">{worker.job.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {worker.job.client_company}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{worker.nationality}</TableCell>
                      <TableCell>
                        <Badge className={getStageColor(worker.current_stage)}>
                          {getStageLabel(worker.current_stage)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(worker.submitted_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/agency/workers/${worker.id}`)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Documents
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
