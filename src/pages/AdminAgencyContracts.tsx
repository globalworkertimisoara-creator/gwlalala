import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, Search, Loader2, FileText } from 'lucide-react';
import { useContracts } from '@/hooks/useContracts';
import { ContractDetailDialog } from '@/components/contracts/ContractDetailDialog';
import type { Contract } from '@/types/contract';
import { usePermissions } from '@/hooks/usePermissions';
import { format } from 'date-fns';

export default function AdminAgencyContracts() {
  const { can } = usePermissions();
  const { data: allContracts = [], isLoading } = useContracts();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Filter to agency contracts only
  const agencyContracts = useMemo(() => {
    return allContracts
      .filter(c => c.party_type === 'agency')
      .filter(c => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            c.title.toLowerCase().includes(q) ||
            (c.contract_number || '').toLowerCase().includes(q) ||
            ((c as any).client_name || '').toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [allContracts, search, statusFilter]);

  if (!can('accessAdminPanel')) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 text-center py-20">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-lg font-semibold">Access Denied</p>
          <p className="text-sm text-muted-foreground mt-1">You do not have permission to view this page.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-red-500" />
            <h1 className="text-2xl font-bold">Agency Contracts</h1>
            <Badge variant="destructive" className="text-xs">Confidential</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Admin-only view of all contracts with agency partners. This data is not visible to agency users.
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, number, or agency..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {agencyContracts.length} contract{agencyContracts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : agencyContracts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No agency contracts found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Contract #</TableHead>
                    <TableHead>Agency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agencyContracts.map(c => (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedContract(c)}
                    >
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.contract_number || '—'}</TableCell>
                      <TableCell>{c.client_name || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.start_date ? format(new Date(c.start_date), 'MMM d, yyyy') : '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.end_date ? format(new Date(c.end_date), 'MMM d, yyyy') : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {c.total_value ? `${c.total_value.toLocaleString()} ${c.currency}` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <ContractDetailDialog
          contract={selectedContract}
          open={!!selectedContract}
          onOpenChange={(open) => { if (!open) setSelectedContract(null); }}
        />
      </div>
    </AppLayout>
  );
}
