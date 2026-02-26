import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type ReportType = 'candidate_pipeline' | 'agency_performance' | 'project_status' | 'compliance' | 'billing_summary';

const REPORT_LABELS: Record<ReportType, string> = {
  candidate_pipeline: 'Candidate Pipeline',
  agency_performance: 'Agency Performance',
  project_status: 'Project Status',
  compliance: 'Compliance (Document Expiry)',
  billing_summary: 'Billing Summary',
};

export function useReports() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async (reportType: ReportType, filters?: Record<string, unknown>) => {
    setIsGenerating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/generate-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ report_type: reportType, filters }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate report');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Report Downloaded', description: `${REPORT_LABELS[reportType]} report generated successfully.` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'Report Error', description: message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateReport, isGenerating, REPORT_LABELS };
}
