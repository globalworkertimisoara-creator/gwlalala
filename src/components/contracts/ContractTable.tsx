import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Loader2, ArrowRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { usePartyNameLookup, useSalesPersonLookup } from '@/hooks/useContractParties';
import type { Contract } from '@/hooks/useContracts';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800',
  signed: 'bg-green-100 text-green-800',
  active: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-destructive/10 text-destructive',
  terminated: 'bg-red-100 text-red-800',
};

const typeLabels: Record<string, string> = {
  employer_agreement: 'Employer Agreement',
  agency_agreement: 'Agency Agreement',
  worker_contract: 'Worker Contract',
  service_agreement: 'Service Agreement',
};

interface ContractTableProps {
  contracts: Contract[];
  isLoading: boolean;
  highlightId?: string | null;
  selectedIds: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onRowClick: (contract: Contract) => void;
}

export function ContractTable({ contracts, isLoading, highlightId, selectedIds, onSelect, onSelectAll, onRowClick }: ContractTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No contracts found</p>
        <p className="text-sm">Create your first contract to get started.</p>
      </div>
    );
  }

  const allSelected = contracts.length > 0 && selectedIds.size === contracts.length;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
              />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Party</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((c) => {
            const progress = getContractProgress(c);
            const daysLeft = c.end_date ? differenceInDays(new Date(c.end_date), new Date()) : null;

            return (
              <TableRow
                key={c.id}
                className={cn(
                  'hover:bg-muted/50 cursor-pointer',
                  highlightId === c.id && 'ring-2 ring-primary/50 bg-primary/5'
                )}
                onClick={() => onRowClick(c)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(c.id)}
                    onCheckedChange={(checked) => onSelect(c.id, !!checked)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p>{c.title}</p>
                      {daysLeft !== null && daysLeft <= 30 && daysLeft > 0 && (
                        <p className="text-[10px] text-amber-600">{daysLeft} days left</p>
                      )}
                      {daysLeft !== null && daysLeft <= 0 && c.status !== 'terminated' && (
                        <p className="text-[10px] text-destructive">Expired</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{typeLabels[c.contract_type] || c.contract_type}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{c.party_type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[c.status] || 'bg-muted'}>{c.status}</Badge>
                </TableCell>
                <TableCell className="text-sm">{c.total_value ? `€${c.total_value.toLocaleString()}` : '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.start_date && c.end_date
                    ? `${format(new Date(c.start_date), 'MMM d')} → ${format(new Date(c.end_date), 'MMM d, yyyy')}`
                    : c.start_date
                    ? `From ${format(new Date(c.start_date), 'MMM d, yyyy')}`
                    : '—'}
                </TableCell>
                <TableCell>
                  {progress !== null && (
                    <div className="w-20">
                      <Progress value={progress} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground mt-0.5">{progress}%</p>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function getContractProgress(c: Contract): number | null {
  if (!c.start_date || !c.end_date) return null;
  const start = new Date(c.start_date).getTime();
  const end = new Date(c.end_date).getTime();
  const now = Date.now();
  if (now < start) return 0;
  if (now > end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}
