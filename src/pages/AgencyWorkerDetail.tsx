import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAgencyWorker, useAgencyProfile, useWorkerDocuments, useUpdateAgencyWorker } from '@/hooks/useAgency';
import { useCandidateActivityLog } from '@/hooks/useCandidateActivityLog';
import { CandidateActivityLog } from '@/components/candidates/CandidateActivityLog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WorkerDocumentUpload } from '@/components/agency/WorkerDocumentUpload';
import { WorkerReviewDialog } from '@/components/agency/WorkerReviewDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Loader2,
  ClipboardCheck,
  CheckCircle,
  FileWarning,
  Sparkles,
  Save,
  X,
  ShieldAlert
} from 'lucide-react';
import { getStageLabel, getStageColor } from '@/types/database';
import { getApprovalStatusColor, getApprovalStatusLabel, INITIAL_REQUIRED_DOCS, getDocTypeLabel } from '@/types/agency';
import { ExtractedData } from '@/hooks/useDocumentExtraction';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function AgencyWorkerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { toast } = useToast();
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isApplyingData, setIsApplyingData] = useState(false);

  const { data: profile } = useAgencyProfile();
  const { data: worker, isLoading } = useAgencyWorker(id);
  const { data: documents } = useWorkerDocuments(id);
  const updateWorker = useUpdateAgencyWorker();

  const isAgencyView = role === 'agency';

  // Ownership check: when accessed from agency route, verify worker belongs to this agency
  const isOwnerVerified = !isAgencyView || (worker && profile && worker.agency_id === profile.id);
  const ownerCheckDone = !isAgencyView || (worker !== undefined && worker !== null && profile !== undefined);

  // Look up the candidate ID by matching worker email
  const { data: candidateId } = useQuery({
    queryKey: ['worker-candidate-id', worker?.email],
    queryFn: async () => {
      if (!worker?.email) return null;
      const { data } = await supabase
        .from('candidates')
        .select('id')
        .eq('email', worker.email)
        .maybeSingle();
      return data?.id || null;
    },
    enabled: !!worker?.email && isOwnerVerified === true,
  });

  const { data: activityLog = [], isLoading: activityLoading } = useCandidateActivityLog(candidateId ?? undefined);

  // Check document completeness
  const uploadedDocTypes = documents?.map(d => d.doc_type) || [];
  const missingDocs = INITIAL_REQUIRED_DOCS.filter(doc => !uploadedDocTypes.includes(doc));
  const hasAllRequiredDocs = missingDocs.length === 0;

  const handleDataExtracted = (data: ExtractedData) => {
    setExtractedData(data);
  };

  const applyExtractedData = async () => {
    if (!extractedData || !worker) return;

    setIsApplyingData(true);
    try {
      const updates: Record<string, any> = {};

      if (extractedData.full_name && !worker.full_name) updates.full_name = extractedData.full_name;
      if (extractedData.email && !worker.email) updates.email = extractedData.email;
      if (extractedData.phone && !worker.phone) updates.phone = extractedData.phone;
      if (extractedData.nationality && !worker.nationality) updates.nationality = extractedData.nationality;
      if (extractedData.current_country && !worker.current_country) updates.current_country = extractedData.current_country;
      if (extractedData.date_of_birth && !worker.date_of_birth) updates.date_of_birth = extractedData.date_of_birth;
      if (extractedData.skills && !worker.skills) updates.skills = extractedData.skills;
      if (extractedData.experience_years && !worker.experience_years) updates.experience_years = extractedData.experience_years;

      const additionalNotes: string[] = [];
      if (extractedData.passport_number) additionalNotes.push(`Passport: ${extractedData.passport_number}`);
      if (extractedData.passport_expiry) additionalNotes.push(`Passport Expiry: ${extractedData.passport_expiry}`);
      if (extractedData.visa_type) additionalNotes.push(`Visa Type: ${extractedData.visa_type}`);
      if (extractedData.visa_expiry) additionalNotes.push(`Visa Expiry: ${extractedData.visa_expiry}`);

      if (additionalNotes.length > 0) {
        const existingNotes = worker.notes || '';
        updates.notes = existingNotes
          ? `${existingNotes}\n\n[Extracted from documents]\n${additionalNotes.join('\n')}`
          : `[Extracted from documents]\n${additionalNotes.join('\n')}`;
      }

      if (Object.keys(updates).length > 0) {
        await updateWorker.mutateAsync({ id: worker.id, ...updates });
        toast({ title: 'Data applied', description: 'Extracted information has been saved to the worker profile.' });
      } else {
        toast({ title: 'No new data to apply', description: 'All extracted fields already have values.' });
      }

      setExtractedData(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to apply data', description: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setIsApplyingData(false);
    }
  };

  const dismissExtractedData = () => {
    setExtractedData(null);
  };

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

  // Agency user trying to view another agency's worker → access denied
  if (isAgencyView && ownerCheckDone && !isOwnerVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-destructive/40" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have access to this worker.</p>
          <Button onClick={() => navigate('/agency')}>
            Back to Dashboard
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

        {/* Extracted Data Banner */}
        {extractedData && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Data Extracted from Document
              </CardTitle>
              <CardDescription>
                Review the extracted information and apply it to the worker profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 text-sm mb-4">
                {extractedData.full_name && (
                  <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{extractedData.full_name}</span></div>
                )}
                {extractedData.email && (
                  <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{extractedData.email}</span></div>
                )}
                {extractedData.phone && (
                  <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{extractedData.phone}</span></div>
                )}
                {extractedData.nationality && (
                  <div><span className="text-muted-foreground">Nationality:</span> <span className="font-medium">{extractedData.nationality}</span></div>
                )}
                {extractedData.date_of_birth && (
                  <div><span className="text-muted-foreground">DOB:</span> <span className="font-medium">{extractedData.date_of_birth}</span></div>
                )}
                {extractedData.passport_number && (
                  <div><span className="text-muted-foreground">Passport:</span> <span className="font-medium">{extractedData.passport_number}</span></div>
                )}
                {extractedData.skills && (
                  <div className="md:col-span-2"><span className="text-muted-foreground">Skills:</span> <span className="font-medium">{extractedData.skills}</span></div>
                )}
                {extractedData.experience_years && (
                  <div><span className="text-muted-foreground">Experience:</span> <span className="font-medium">{extractedData.experience_years} years</span></div>
                )}
                {extractedData.confidence && (
                  <div><span className="text-muted-foreground">Confidence:</span> <span className="font-medium">{extractedData.confidence}%</span></div>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={applyExtractedData} disabled={isApplyingData} className="gap-2">
                  {isApplyingData ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Apply to Profile
                </Button>
                <Button variant="outline" onClick={dismissExtractedData} className="gap-2">
                  <X className="h-4 w-4" />
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Worker Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl flex items-center gap-3 flex-wrap">
                  {worker.full_name}
                  <Badge className={getStageColor(worker.current_stage)}>
                    {getStageLabel(worker.current_stage)}
                  </Badge>
                  <Badge className={getApprovalStatusColor(worker.approval_status)}>
                    {getApprovalStatusLabel(worker.approval_status)}
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
              {!isAgencyView && (
                <Button onClick={() => setShowReviewDialog(true)}>
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Review
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Document Status Banner */}
            <div className={`rounded-lg p-4 mb-4 ${hasAllRequiredDocs ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hasAllRequiredDocs ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">All required documents uploaded</span>
                    </>
                  ) : (
                    <>
                      <FileWarning className="h-5 w-5 text-orange-600" />
                      <span className="font-medium text-orange-800">Missing required documents</span>
                    </>
                  )}
                </div>
                <Badge variant="outline">
                  {documents?.length || 0} document(s)
                </Badge>
              </div>
              {!hasAllRequiredDocs && (
                <div className="mt-2 text-sm text-orange-700">
                  Missing: {missingDocs.map(d => getDocTypeLabel(d)).join(', ')}
                </div>
              )}
            </div>

            {/* Review Notes */}
            {worker.review_notes && (
              <div className="rounded-lg border p-4 mb-4 bg-muted/50">
                <p className="text-sm font-medium mb-1">Review Notes</p>
                <p className="text-sm text-muted-foreground">{worker.review_notes}</p>
                {worker.reviewed_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Reviewed on {format(new Date(worker.reviewed_at), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            )}

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

            {worker.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Notes</p>
                <p className="whitespace-pre-wrap">{worker.notes}</p>
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
          onDataExtracted={handleDataExtracted}
        />

        {/* Activity Log */}
        {candidateId && (
          <div className="mt-6">
            <CandidateActivityLog
              entries={activityLog}
              isLoading={activityLoading}
              showActorType={false}
              title="Activity Log"
            />
          </div>
        )}
      </div>

      {/* Review Dialog */}
      {!isAgencyView && worker && (
        <WorkerReviewDialog
          worker={worker}
          open={showReviewDialog}
          onOpenChange={setShowReviewDialog}
        />
      )}
    </div>
  );
}
