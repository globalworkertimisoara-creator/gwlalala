import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Candidate, RecruitmentStage, stageLabels } from '@/types/candidate';

interface StageChartProps {
  candidates: Candidate[];
}

const stageChartColors: Record<RecruitmentStage, string> = {
  sourced: 'hsl(30, 15%, 75%)',
  screening: 'hsl(24, 95%, 53%)',
  interview: 'hsl(168, 76%, 42%)',
  technical: 'hsl(38, 80%, 55%)',
  offer: 'hsl(152, 50%, 50%)',
  hired: 'hsl(152, 69%, 40%)',
  rejected: 'hsl(0, 60%, 55%)',
};

export function StageChart({ candidates }: StageChartProps) {
  const stageCounts = candidates.reduce((acc, candidate) => {
    acc[candidate.stage] = (acc[candidate.stage] || 0) + 1;
    return acc;
  }, {} as Record<RecruitmentStage, number>);

  const data = (Object.entries(stageCounts) as [RecruitmentStage, number][])
    .filter(([_, count]) => count > 0)
    .map(([stage, count]) => ({
      name: stageLabels[stage],
      value: count,
      color: stageChartColors[stage],
    }));

  return (
    <div className="stat-card animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">Pipeline Overview</h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
