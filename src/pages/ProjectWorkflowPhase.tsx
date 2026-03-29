import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProject } from '@/hooks/useProjects';
import {
  useProjectWorkflowsByPhase,
  WORKFLOW_PHASES,
  WorkflowPhase,
} from '@/hooks/useProjectWorkflows';
import WorkflowTimeline from '@/components/workflow/WorkflowTimeline';
import DocumentChecklist from '@/components/workflow/DocumentChecklist';
import {
  useDocumentTemplates,
  useWorkflowDocuments,
  useUploadDocument,
  useReviewDocument,
} from '@/hooks/useWorkflow';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  Loader2,
  Mail,
  Users,
} from 'lucide-react';

function CandidateWorkflowCard({
  workflow,
  candidate,
  phase,
}: {
  workflow: any;
  candidate: any;
  phase: WorkflowPhase;
}) {
  const navigate = useNavigate();
  const { data: rawTemplates } = useDocumentTemplates(phase);
  const { data: rawDocuments } = useWorkflowDocuments(workflow.id, phase);
  const uploadDocument = useUploadDocument();
  const reviewDocument = useReviewDocument();

  const completedPhases = {
    recruitment: workflow.recruitment_completed_at,
    documentation: workflow.documentation_completed_at,
    visa: workflow.visa_completed_at,
    arrival: workflow.arrival_completed_at,
    residence_permit: workflow.residence_permit_completed_at,
  };

  // Map DB snake_case to component camelCase
  const templates = (rawTemplates || []).map(t => ({
    id: t.id,
    documentName: t.document_name,
    description: t.description,
    isRequired: t.is_required ?? true,
  }));

  const documents = (rawDocuments || []).map(d => ({
    id: d.id,
    documentName: d.document_name,
    fileUrl: d.file_url,
    status: d.status as any,
    uploadedAt: d.uploaded_at || d.created_at,
    reviewedAt: d.reviewed_at || undefined,
    reviewNotes: d.review_notes || undefined,
  }));

  const handleUpload = async (templateId: string, file: File) => {
    const template = rawTemplates?.find(t => t.id === templateId);
    if (!template) return;

    const filePath = `workflows/${workflow.id}/${phase}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('candidate-documents')
      .upload(filePath, file);

    if (uploadError) return;

    uploadDocument.mutate({
      workflowId: workflow.id,
      templateId,
      documentName: template.document_name,
      phase,
      fileUrl: filePath,
      fileSize: file.size,
      mimeType: file.type,
    });
  };

  const handleReview = async (documentId: string, status: 'approved' | 'rejected', notes: string) => {
    reviewDocument.mutate({ documentId, status, notes });
  };

  const totalRequired = templates.filter(t => t.isRequired).length;
  const approvedCount = documents.filter(d => d.status === 'approved').length;
  const pendingCount = documents.filter(d => d.status !== 'approved' && d.status !== 'rejected').length;

  return (
    <AccordionItem value={workflow.id} className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <div className="flex items-center justify-between w-full mr-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-left">{candidate.full_name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                {candidate.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {candidate.email}
                  </span>
                )}
                {candidate.nationality && <span>{candidate.nationality}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge variant="outline" className="text-amber-700 border-amber-300">
                {pendingCount} pending
              </Badge>
            )}
            <Badge variant="secondary">
              {approvedCount}/{totalRequired} docs
            </Badge>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4 space-y-4">
        <WorkflowTimeline
          currentPhase={workflow.current_phase}
          workflowType={workflow.workflow_type}
          completedPhases={completedPhases}
          compact
          showLabels
        />

        <DocumentChecklist
          phase={phase}
          templates={templates}
          documents={documents}
          canUpload={true}
          canReview={true}
          onUpload={handleUpload}
          onReview={handleReview}
        />

        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/candidates/${candidate.id}`)}
          >
            View Full Profile
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function ProjectWorkflowPhase() {
  const { id: projectId, phase } = useParams<{ id: string; phase: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading: projectLoading } = useProject(projectId!);
  const { data: workflows, isLoading: workflowsLoading } = useProjectWorkflowsByPhase(
    projectId!,
    phase as WorkflowPhase
  );

  const currentPhaseConfig = WORKFLOW_PHASES.find(p => p.id === phase);
  const isLoading = projectLoading || workflowsLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!project || !currentPhaseConfig) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Not found</h2>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${projectId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl lg:text-3xl font-bold">{currentPhaseConfig.label} Phase</h1>
            <p className="text-muted-foreground">{project.name} — {project.employer_name}</p>
          </div>
          <Badge variant="secondary" className="text-base px-3 py-1">
            <Users className="h-4 w-4 mr-1.5" />
            {workflows?.length || 0} candidates
          </Badge>
        </div>

        <div className="flex gap-2 flex-wrap">
          {WORKFLOW_PHASES.map(p => (
            <Button
              key={p.id}
              variant={p.id === phase ? 'default' : 'outline'}
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/workflow/${p.id}`)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {!workflows || workflows.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No candidates in {currentPhaseConfig.label} phase</p>
              <p className="text-sm mt-1">
                Candidates will appear here when their workflow reaches this phase
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {workflows.map(wf => {
              const candidate = (wf as any).candidates;
              if (!candidate) return null;
              return (
                <CandidateWorkflowCard
                  key={wf.id}
                  workflow={wf}
                  candidate={candidate}
                  phase={phase as WorkflowPhase}
                />
              );
            })}
          </Accordion>
        )}
      </div>
    </AppLayout>
  );
}
