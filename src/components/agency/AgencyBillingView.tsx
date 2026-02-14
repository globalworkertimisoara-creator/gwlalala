import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PaymentMilestones } from '@/components/billing/PaymentMilestones';
import { useBillingPayments, useBillingNotes, type BillingRecord } from '@/hooks/useBilling';
import { Loader2, DollarSign, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  agreed: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  disputed: 'bg-destructive/10 text-destructive',
};

interface AgencyBillingViewProps {
  agencyId: string;
}

export function AgencyBillingView({ agencyId }: AgencyBillingViewProps) {
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['agency-billing-records', agencyId],
    queryFn: async (): Promise<BillingRecord[]> => {
      const { data, error } = await supabase
        .from('billing_records')
        .select(`
          *,
          candidate:candidates(id, full_name, email),
          agency:agency_profiles(id, company_name),
          job:jobs(id, title)
        `)
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BillingRecord[];
    },
    enabled: !!agencyId,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Records list */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Billing Records
              </CardTitle>
              <CardDescription>{records.length} records</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : records.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No billing records</h3>
                    <p className="text-sm text-muted-foreground">
                      No billing records have been created for this agency yet.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {records.map((record) => (
                      <button
                        key={record.id}
                        onClick={() => setSelectedRecord(record)}
                        className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors ${
                          selectedRecord?.id === record.id ? 'bg-accent' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm truncate">
                            {(record.candidate as any)?.full_name || 'Unknown'}
                          </span>
                          <Badge className={`text-[10px] ${STATUS_COLORS[record.status] || ''}`}>
                            {record.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground truncate">
                            {record.job ? (record.job as any)?.title : '—'}
                          </span>
                          <span className="text-sm font-semibold">
                            {Number(record.total_amount).toLocaleString()} {record.currency}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(record.created_at), 'dd MMM yyyy')}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Detail panel */}
        <div className="xl:col-span-2">
          {selectedRecord ? (
            <AgencyBillingDetail record={selectedRecord} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-[500px]">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select a billing record to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function AgencyBillingDetail({ record }: { record: BillingRecord }) {
  const { data: payments = [] } = useBillingPayments(record.id);
  const { data: notes = [] } = useBillingNotes(record.id);

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPercentage = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.percentage), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {(record.candidate as any)?.full_name}
            </CardTitle>
            <CardDescription>
              {record.job && (record.job as any)?.title}
            </CardDescription>
          </div>
          <Badge className={STATUS_COLORS[record.status] || ''}>
            {record.status}
          </Badge>
        </div>

        {/* Summary bar */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{Number(record.total_amount).toLocaleString()} {record.currency}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-lg font-bold text-green-700">{totalPaid.toLocaleString()} {record.currency}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="text-lg font-bold">{Math.min(totalPercentage, 100).toFixed(1)}%</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="payments">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-4">
            <PaymentMilestones
              billingRecordId={record.id}
              totalAmount={Number(record.total_amount)}
              currency={record.currency}
              payments={payments}
            />
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <ScrollArea className="h-[300px]">
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{note.created_by_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.created_at), 'dd MMM yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
