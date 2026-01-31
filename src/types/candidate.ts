export type RecruitmentStage = 
  | 'sourced'
  | 'screening'
  | 'interview'
  | 'technical'
  | 'offer'
  | 'hired'
  | 'rejected';

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  stage: RecruitmentStage;
  source: string;
  appliedDate: string;
  lastUpdated: string;
  notes?: string;
  avatar?: string;
}

export const stageLabels: Record<RecruitmentStage, string> = {
  sourced: 'Sourced',
  screening: 'Screening',
  interview: 'Interview',
  technical: 'Technical',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
};

export const stageColors: Record<RecruitmentStage, string> = {
  sourced: 'bg-stage-sourced text-stage-sourced-foreground',
  screening: 'bg-stage-screening text-stage-screening-foreground',
  interview: 'bg-stage-interview text-stage-interview-foreground',
  technical: 'bg-stage-technical text-stage-technical-foreground',
  offer: 'bg-stage-offer text-stage-offer-foreground',
  hired: 'bg-stage-hired text-stage-hired-foreground',
  rejected: 'bg-stage-rejected text-stage-rejected-foreground',
};
