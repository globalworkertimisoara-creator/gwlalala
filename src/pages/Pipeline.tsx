import { AppLayout } from '@/components/layout/AppLayout';
import { PipelineColumn } from '@/components/pipeline/PipelineColumn';
import { mockCandidates } from '@/data/mockCandidates';
import { RecruitmentStage } from '@/types/candidate';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const pipelineStages: RecruitmentStage[] = [
  'sourced',
  'screening',
  'interview',
  'technical',
  'offer',
  'hired',
];

const Pipeline = () => {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Pipeline</h1>
            <p className="text-muted-foreground">
              Drag and drop candidates through recruitment stages
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Candidate
          </Button>
        </div>

        {/* Pipeline Board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {pipelineStages.map((stage) => (
              <PipelineColumn
                key={stage}
                stage={stage}
                candidates={mockCandidates}
              />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Pipeline;
