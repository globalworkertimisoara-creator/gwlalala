import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAgencyWorker, useAgencyProfile } from '@/hooks/useAgency';
import { WorkerDocumentUpload } from '@/components/agency/WorkerDocumentUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Briefcase, Loader2 } from 'lucide-react';
import { getStageLabel, getStageColor } from '@/types/database';
import { format } from 'date-fns';

export default function AgencyWorkerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  
  const { data: profile } = useAgencyProfile();
  const { data: worker, isLoading } = useAgencyWorker(id);

  const isAgencyView = role === 'agency';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Worker Not Found</h1>
          <p className="text-muted-foreground mb-4">The worker you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(isAgencyView ? '/agency' : '/agency-workers')}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(isAgencyView ? '/agency' : '/agency-workers')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {isAgencyView ? 'Dashboard' : 'Workers'}
        </Button>

        {/* Worker Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  {worker.full_name}
                  <Badge className={getStageColor(worker.current_stage)}>
                    {getStageLabel(worker.current_stage)}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  {worker.job ? (
                    <>Applied for {worker.job.title} at {worker.job.client_company}</>
                  ) : (
                    'No job assigned'
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{worker.email}</p>
                </div>
              </div>
              {worker.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{worker.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nationality</p>
                  <p className="font-medium">{worker.nationality}</p>
                </div>
              </div>
              {worker.current_country && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Current Country</p>
                    <p className="font-medium">{worker.current_country}</p>
                  </div>
                </div>
              )}
              {worker.date_of_birth && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">
                      {format(new Date(worker.date_of_birth), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              )}
              {worker.experience_years !== null && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-medium">{worker.experience_years} years</p>
                  </div>
                </div>
              )}
            </div>

            {worker.skills && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Skills</p>
                <p>{worker.skills}</p>
              </div>
            )}

            {worker.rejection_reason && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-destructive font-medium mb-1">Rejection Reason</p>
                <p className="text-destructive">{worker.rejection_reason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents Section */}
        <WorkerDocumentUpload 
          workerId={worker.id}
          currentStage={worker.current_stage}
          isAgencyView={isAgencyView}
        />
      </div>
    </div>
  );
}
