import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { GitBranch } from 'lucide-react';
import { Candidate, RecruitmentStage, STAGES, getStageLabel } from '@/types/database';

interface StageChartProps {
  candidates: Candidate[];
}

const stageColors: Record<RecruitmentStage, string> = {
  sourced: 'hsl(215, 20%, 75%)',
  contacted: 'hsl(210, 50%, 70%)',
  application_received: 'hsl(205, 60%, 65%)',
  screening: 'hsl(200, 70%, 55%)',
  shortlisted: 'hsl(195, 80%, 50%)',
  submitted_to_client: 'hsl(221, 83%, 53%)',
  client_feedback: 'hsl(230, 70%, 55%)',
  interview_completed: 'hsl(250, 60%, 60%)',
  offer_extended: 'hsl(45, 80%, 50%)',
  offer_accepted: 'hsl(50, 90%, 45%)',
  visa_processing: 'hsl(35, 85%, 50%)',
  medical_checks: 'hsl(20, 80%, 55%)',
  onboarding: 'hsl(100, 60%, 45%)',
  placed: 'hsl(142, 71%, 45%)',
  closed_not_placed: 'hsl(0, 72%, 51%)',
};

export function StageChart({ candidates }: StageChartProps) {
  const stageCounts = candidates.reduce((acc, candidate) => {
    acc[candidate.current_stage] = (acc[candidate.current_stage] || 0) + 1;
    return acc;
  }, {} as Record<RecruitmentStage, number>);

  const data = STAGES
    .filter(stage => stageCounts[stage.value] && stageCounts[stage.value] > 0)
    .map(stage => ({
      name: stage.label.split(' / ')[0],
      fullName: stage.label,
      value: stageCounts[stage.value] || 0,
      color: stageColors[stage.value],
    }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5 text-primary" />
          Stage Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {data.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-muted-foreground">
            <p className="text-sm">No candidates to display</p>
          </div>
        ) : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 5, right: 15, top: 5, bottom: 5 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
                />
                <Tooltip
                  formatter={(value, name, props) => [value, props.payload.fullName]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}