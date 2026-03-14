import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Candidate, RecruitmentStage, STAGES, getStageLabel } from '@/types/database';

interface StageChartProps {
  candidates: Candidate[];
}

// Blue-based color palette for 15 stages
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

  // Create data for all stages in order
  const data = STAGES
    .filter(stage => stageCounts[stage.value] && stageCounts[stage.value] > 0)
    .map(stage => ({
      name: stage.label.split(' / ')[0], // Use short label
      fullName: stage.label,
      value: stageCounts[stage.value] || 0,
      color: stageColors[stage.value],
    }));

  if (data.length === 0) {
    return (
      <div className="stat-card animate-fade-in">
        <h3 className="text-lg font-semibold text-foreground mb-4">Pipeline Overview</h3>
        <div className="h-[280px] flex items-center justify-center text-muted-foreground">
          No candidates to display
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">Pipeline Overview</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
           <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
            <XAxis type="number" allowDecimals={false} />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={160}
              tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
            />
            <Tooltip 
              formatter={(value, name, props) => [value, props.payload.fullName]}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
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
    </div>
  );
}
