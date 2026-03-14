import { useParams, useNavigate } from 'react-router-dom';
import FileUploader from '@/components/upload/FileUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCandidate } from '@/hooks/useCandidates';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function Upload() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: candidate, isLoading } = useCandidate(id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!candidate) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <p className="text-lg font-semibold">Candidate not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/candidates')}>
            Back to Candidates
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8 max-w-4xl">
        <Button
          variant="ghost"
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate(`/candidates/${id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {candidate.full_name}
        </Button>

        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Upload Files</h1>
          <p className="text-muted-foreground mt-1">
            Upload documents for <span className="font-medium text-foreground">{candidate.full_name}</span>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload Files</CardTitle>
            <CardDescription>
              Drag and drop files or click to browse. Large videos will be compressed before upload.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader
              multiple={true}
              onUploadComplete={(results) => {
                console.log('Upload complete:', results);
              }}
            />
          </CardContent>
        </Card>

        <div className="mt-6 rounded-lg bg-muted/50 border p-4">
          <h3 className="text-sm font-semibold mb-2">How it works</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Videos &gt; 5 MB are compressed in your browser (no server cost)</li>
            <li>• Files upload directly to your Google Drive</li>
            <li>• Progress is shown for each file</li>
            <li>• Multiple files can be uploaded at once</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
