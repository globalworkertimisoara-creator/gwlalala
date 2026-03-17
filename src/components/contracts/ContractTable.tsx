import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown, Settings2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { usePartyNameLookup, useSalesPersonLookup } from '@/hooks/useContractParties';
import type { Contract } from '@/types/contract';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800',
  signed: 'bg-green-100 text-green-800',
  active: 'bg-emerald-100 text-emerald-800',
  expired: 'bg-destructive/10 text-destructive',
  terminated: 'bg-red-100 text-red-800',
};

const typeLabels: Record<string, string> = {
  recruitment: 'Recruitment',
  partnership: 'Partnership',
  consultancy: 'Consultancy',
  service: 'Service',
  employer_agreement: 'Employer Agmt',
  agency_agreement: 'Agency Agmt',
  worker_contract: 'Worker Contract',
  service_agreement: 'Service Agmt',
};

type SortKey = 'title' | 'contract_type' | 'status' | 'total_value' | 'start_date' | 'end_date' | 'party' | 'contract_number';
type SortDir = 'asc' | 'desc';

interface ColumnDef {
  key: string;
  label: string;
  defaultVisible: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'contract_number', label: 'Number', defaultVisible: true },
  { key: 'title', label: 'Title', defaultVisible: true },
  { key: 'contract_type', label: 'Type', defaultVisible: true },
  { key: 'party', label: 'Party', defaultVisible: true },
  { key: 'sales_person', label: 'Sales Person', defaultVisible: false },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'total_value', label: 'Value', defaultVisible: true },
  { key: 'duration', label: 'Duration', defaultVisible: true },
  { key: 'progress', label: 'Progress', defaultVisible: true },
];

interface ContractTableProps {
  contracts: Contract[];
  isLoading: boolean;
  highlightId?: string | null;
  selectedIds: Set<string>;
  selectedContractId?: string | null;
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onRowClick: (contract: Contract) => void;
  groupBy?: string;
}

export function ContractTable({ contracts, isLoading, highlightId, selectedIds, selectedContractId, onSelect, onSelectAll, onRowClick, groupBy = 'none' }: ContractTableProps) {
  const partyLookup = usePartyNameLookup();
  const salesLookup = useSalesPersonLookup();

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Column visibility - load from localStorage
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('contract-table-columns');
      if (saved) return new Set(JSON.parse(saved));
    } catch { /* ignore */ }
    return new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key));
  });

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem('contract-table-columns', JSON.stringify([...next]));
      return next;
    });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  // Sort contracts
  const sorted = useMemo(() => {
    const arr = [...contracts];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'title': cmp = a.title.localeCompare(b.title); break;
        case 'contract_type': cmp = a.contract_type.localeCompare(b.contract_type); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'total_value': cmp = (a.total_value || 0) - (b.total_value || 0); break;
        case 'start_date': cmp = (a.start_date || '').localeCompare(b.start_date || ''); break;
        case 'end_date': cmp = (a.end_date || '').localeCompare(b.end_date || ''); break;
        case 'contract_number': cmp = (a.contract_number || '').localeCompare(b.contract_number || ''); break;
        case 'party': {
          const nameA = (a as any).client_name || partyLookup.get(a.party_id) || '';
          const nameB = (b as any).client_name || partyLookup.get(b.party_id) || '';
          cmp = nameA.localeCompare(nameB);
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [contracts, sortKey, sortDir, partyLookup]);

  // Group contracts
  const groups = useMemo(() => {
    if (groupBy === 'none') return [{ label: '', contracts: sorted }];

    const map = new Map<string, Contract[]>();
    for (const c of sorted) {
      let key = '';
      switch (groupBy) {
        case 'status': key = c.status; break;
        case 'type': key = typeLabels[c.contract_type] || c.contract_type; break;
        case 'party': key = (c as any).client_name || partyLookup.get(c.party_id) || 'Unknown'; break;
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries()).map(([label, contracts]) => ({ label, contracts }));
  }, [sorted, groupBy, partyLookup]);

  // Pagination (only when not grouped)
  const isGrouped = groupBy !== 'none';
  const totalPages = isGrouped ? 1 : Math.ceil(contracts.length / pageSize);
  const paginatedGroups = isGrouped
    ? groups
    : [{ label: '', contracts: sorted.slice(page * pageSize, (page + 1) * pageSize) }];

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
  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const isCol = (key: string) => visibleColumns.has(key);

  return (
    <div>
      {/* Toolbar: column toggle + page size */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{contracts.length} contract{contracts.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <Settings2 className="h-3.5 w-3.5" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ALL_COLUMNS.map(col => (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={visibleColumns.has(col.key)}
                  onCheckedChange={() => toggleColumn(col.key)}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {!isGrouped && (
            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(0); }}>
              <SelectTrigger className="h-7 w-[70px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Table */}
      {paginatedGroups.map((group, gi) => (
        <div key={gi}>
          {isGrouped && group.label && (
            <div className="flex items-center gap-2 py-2 px-1 mt-2 border-b">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{group.contracts.length}</Badge>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8 px-2">
                    <Checkbox checked={allSelected} onCheckedChange={(checked) => onSelectAll(!!checked)} />
                  </TableHead>
                  {isCol('contract_number') && (
                    <TableHead className="cursor-pointer select-none px-2" onClick={() => handleSort('contract_number')}>
                      <span className="flex items-center text-xs"># <SortIcon col="contract_number" /></span>
                    </TableHead>
                  )}
                  {isCol('title') && (
                    <TableHead className="cursor-pointer select-none px-2" onClick={() => handleSort('title')}>
                      <span className="flex items-center text-xs">Title <SortIcon col="title" /></span>
                    </TableHead>
                  )}
                  {isCol('contract_type') && (
                    <TableHead className="cursor-pointer select-none px-2" onClick={() => handleSort('contract_type')}>
                      <span className="flex items-center text-xs">Type <SortIcon col="contract_type" /></span>
                    </TableHead>
                  )}
                  {isCol('party') && (
                    <TableHead className="cursor-pointer select-none px-2" onClick={() => handleSort('party')}>
                      <span className="flex items-center text-xs">Party <SortIcon col="party" /></span>
                    </TableHead>
                  )}
                  {isCol('sales_person') && (
                    <TableHead className="px-2"><span className="text-xs">Sales</span></TableHead>
                  )}
                  {isCol('status') && (
                    <TableHead className="cursor-pointer select-none px-2" onClick={() => handleSort('status')}>
                      <span className="flex items-center text-xs">Status <SortIcon col="status" /></span>
                    </TableHead>
                  )}
                  {isCol('total_value') && (
                    <TableHead className="cursor-pointer select-none px-2" onClick={() => handleSort('total_value')}>
                      <span className="flex items-center text-xs">Value <SortIcon col="total_value" /></span>
                    </TableHead>
                  )}
                  {isCol('duration') && (
                    <TableHead className="px-2"><span className="text-xs">Duration</span></TableHead>
                  )}
                  {isCol('progress') && (
                    <TableHead className="px-2"><span className="text-xs">Progress</span></TableHead>
                  )}
                  <TableHead className="w-6 px-1"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.contracts.map((c) => {
                  const progress = getContractProgress(c);
                  const daysLeft = c.end_date ? differenceInDays(new Date(c.end_date), new Date()) : null;
                  const clientName = (c as any).client_name || partyLookup.get(c.party_id) || c.party_id.slice(0, 8);
                  const salesName = (c as any).sales_person_name || (c.sales_person_id ? (salesLookup.get(c.sales_person_id) || '—') : '—');
                  const isSelected = selectedContractId === c.id;

                  return (
                    <TableRow
                      key={c.id}
                      className={cn(
                        'cursor-pointer h-10',
                        highlightId === c.id && 'ring-2 ring-primary/50 bg-primary/5',
                        isSelected && 'bg-primary/10 border-l-2 border-l-primary',
                        !isSelected && 'hover:bg-muted/50'
                      )}
                      onClick={() => onRowClick(c)}
                    >
                      <TableCell className="px-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(c.id)}
                          onCheckedChange={(checked) => onSelect(c.id, !!checked)}
                        />
                      </TableCell>
                      {isCol('contract_number') && (
                        <TableCell className="px-2">
                          {c.contract_number ? (
                            <span className="font-mono text-xs font-semibold text-primary">{c.contract_number}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                      )}
                      {isCol('title') && (
                        <TableCell className="px-2">
                          <div className="flex items-center gap-1.5">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[200px]">{c.title}</p>
                              {daysLeft !== null && daysLeft <= 30 && daysLeft > 0 && (
                                <p className="text-[10px] text-amber-600">{daysLeft}d left</p>
                              )}
                              {daysLeft !== null && daysLeft <= 0 && c.status !== 'terminated' && (
                                <p className="text-[10px] text-destructive">Expired</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      {isCol('contract_type') && (
                        <TableCell className="px-2 text-xs">{typeLabels[c.contract_type] || c.contract_type}</TableCell>
                      )}
                      {isCol('party') && (
                        <TableCell className="px-2">
                          <p className="text-xs font-medium truncate max-w-[140px]">{clientName}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{c.party_type}</p>
                        </TableCell>
                      )}
                      {isCol('sales_person') && (
                        <TableCell className="px-2 text-xs">{salesName}</TableCell>
                      )}
                      {isCol('status') && (
                        <TableCell className="px-2">
                          <Badge className={`text-[10px] px-1.5 ${statusColors[c.status] || 'bg-muted'}`}>{c.status}</Badge>
                        </TableCell>
                      )}
                      {isCol('total_value') && (
                        <TableCell className="px-2 text-xs font-medium">{c.total_value ? `€${c.total_value.toLocaleString()}` : '—'}</TableCell>
                      )}
                      {isCol('duration') && (
                        <TableCell className="px-2 text-[11px] text-muted-foreground">
                          {c.start_date && c.end_date
                            ? `${format(new Date(c.start_date), 'MMM d')} → ${format(new Date(c.end_date), 'MMM d, yy')}`
                            : '—'}
                        </TableCell>
                      )}
                      {isCol('progress') && (
                        <TableCell className="px-2">
                          {progress !== null && (
                            <div className="w-16">
                              <Progress value={progress} className="h-1" />
                              <p className="text-[9px] text-muted-foreground mt-0.5">{progress}%</p>
                            </div>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="px-1">
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {!isGrouped && totalPages > 1 && (
        <div className="flex items-center justify-between px-1 py-3 border-t mt-1">
          <span className="text-xs text-muted-foreground">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, contracts.length)} of {contracts.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'ghost'}
                  size="icon"
                  className="h-7 w-7 text-xs"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum + 1}
                </Button>
              );
            })}
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
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
