import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowUpDown, ArrowUp, ArrowDown, Settings2, ChevronLeft, ChevronRight,
  Building2, Briefcase,
} from 'lucide-react';
import { format } from 'date-fns';
import { getStageLabel, getStageColor } from '@/types/database';
import { AgencyWorker, getApprovalStatusColor, getApprovalStatusLabel } from '@/types/agency';
import { cn } from '@/lib/utils';

interface AgencyWorkerTableProps {
  workers: AgencyWorker[];
  selectedWorkerId?: string;
  onWorkerClick: (worker: AgencyWorker) => void;
  groupBy: string;
}

type SortField = 'full_name' | 'agency' | 'job' | 'approval_status' | 'current_stage' | 'submitted_at';
type SortDirection = 'asc' | 'desc';

interface Column {
  key: string;
  label: string;
  defaultVisible: boolean;
}

const ALL_COLUMNS: Column[] = [
  { key: 'full_name', label: 'Worker', defaultVisible: true },
  { key: 'agency', label: 'Agency', defaultVisible: true },
  { key: 'job', label: 'Job', defaultVisible: true },
  { key: 'approval_status', label: 'Approval', defaultVisible: true },
  { key: 'current_stage', label: 'Stage', defaultVisible: true },
  { key: 'submitted_at', label: 'Submitted', defaultVisible: true },
  { key: 'nationality', label: 'Nationality', defaultVisible: false },
  { key: 'email', label: 'Email', defaultVisible: false },
];

const STORAGE_KEY = 'agency-workers-visible-columns';

function loadVisibleColumns(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key);
}

export function AgencyWorkerTable({
  workers,
  selectedWorkerId,
  onWorkerClick,
  groupBy,
}: AgencyWorkerTableProps) {
  const [sortField, setSortField] = useState<SortField>('submitted_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(loadVisibleColumns);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const isVisible = (key: string) => visibleColumns.includes(key);

  // Sorting
  const sortedWorkers = useMemo(() => {
    const sorted = [...workers];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'full_name': cmp = a.full_name.localeCompare(b.full_name); break;
        case 'agency': cmp = (a.agency?.company_name || '').localeCompare(b.agency?.company_name || ''); break;
        case 'job': cmp = (a.job?.title || '').localeCompare(b.job?.title || ''); break;
        case 'approval_status': cmp = a.approval_status.localeCompare(b.approval_status); break;
        case 'current_stage': cmp = a.current_stage.localeCompare(b.current_stage); break;
        case 'submitted_at': cmp = new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime(); break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [workers, sortField, sortDirection]);

  // Grouping
  const groups = useMemo(() => {
    if (groupBy === 'none') return null;
    const map = new Map<string, AgencyWorker[]>();
    for (const w of sortedWorkers) {
      let key = '';
      switch (groupBy) {
        case 'approval': key = getApprovalStatusLabel(w.approval_status); break;
        case 'stage': key = getStageLabel(w.current_stage).split(' / ')[0]; break;
        case 'agency': key = w.agency?.company_name || 'Unknown Agency'; break;
        case 'job': key = w.job?.title || 'No Job'; break;
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return map;
  }, [sortedWorkers, groupBy]);

  // Pagination
  const totalPages = groups ? 1 : Math.ceil(sortedWorkers.length / pageSize);
  const paginatedWorkers = groups ? sortedWorkers : sortedWorkers.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [workers.length, pageSize, groupBy]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const renderRow = (worker: AgencyWorker) => {
    const isSelected = selectedWorkerId === worker.id;

    return (
      <TableRow
        key={worker.id}
        className={cn(
          'cursor-pointer hover:bg-muted/50 transition-colors',
          isSelected && 'bg-primary/5 border-l-2 border-l-primary'
        )}
        onClick={() => onWorkerClick(worker)}
      >
        {isVisible('full_name') && (
          <TableCell className="text-xs py-2">
            <div>
              <span className="font-medium">{worker.full_name}</span>
            </div>
          </TableCell>
        )}
        {isVisible('agency') && (
          <TableCell className="text-xs text-muted-foreground py-2">
            {worker.agency ? (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate max-w-[120px]">{worker.agency.company_name}</span>
              </div>
            ) : '—'}
          </TableCell>
        )}
        {isVisible('job') && (
          <TableCell className="text-xs py-2">
            {worker.job ? (
              <div>
                <span className="font-medium truncate block max-w-[140px]">{worker.job.title}</span>
                <span className="text-[10px] text-muted-foreground">{worker.job.client_company}</span>
              </div>
            ) : '—'}
          </TableCell>
        )}
        {isVisible('approval_status') && (
          <TableCell className="py-2">
            <Badge className={cn('text-[10px]', getApprovalStatusColor(worker.approval_status))}>
              {getApprovalStatusLabel(worker.approval_status)}
            </Badge>
          </TableCell>
        )}
        {isVisible('current_stage') && (
          <TableCell className="py-2">
            <Badge className={cn('text-[10px]', getStageColor(worker.current_stage))}>
              {getStageLabel(worker.current_stage).split(' / ')[0]}
            </Badge>
          </TableCell>
        )}
        {isVisible('submitted_at') && (
          <TableCell className="text-xs text-muted-foreground py-2">
            {format(new Date(worker.submitted_at), 'dd MMM yy')}
          </TableCell>
        )}
        {isVisible('nationality') && (
          <TableCell className="text-xs text-muted-foreground py-2">{worker.nationality}</TableCell>
        )}
        {isVisible('email') && (
          <TableCell className="text-xs text-muted-foreground py-2">
            <span className="truncate block max-w-[160px]">{worker.email}</span>
          </TableCell>
        )}
      </TableRow>
    );
  };

  const renderTableHeader = () => (
    <TableHeader>
      <TableRow>
        {isVisible('full_name') && (
          <TableHead className="cursor-pointer select-none text-xs" onClick={() => handleSort('full_name')}>
            <div className="flex items-center">Worker <SortIcon field="full_name" /></div>
          </TableHead>
        )}
        {isVisible('agency') && (
          <TableHead className="cursor-pointer select-none text-xs" onClick={() => handleSort('agency')}>
            <div className="flex items-center">Agency <SortIcon field="agency" /></div>
          </TableHead>
        )}
        {isVisible('job') && (
          <TableHead className="cursor-pointer select-none text-xs" onClick={() => handleSort('job')}>
            <div className="flex items-center">Job <SortIcon field="job" /></div>
          </TableHead>
        )}
        {isVisible('approval_status') && (
          <TableHead className="cursor-pointer select-none text-xs" onClick={() => handleSort('approval_status')}>
            <div className="flex items-center">Approval <SortIcon field="approval_status" /></div>
          </TableHead>
        )}
        {isVisible('current_stage') && (
          <TableHead className="cursor-pointer select-none text-xs" onClick={() => handleSort('current_stage')}>
            <div className="flex items-center">Stage <SortIcon field="current_stage" /></div>
          </TableHead>
        )}
        {isVisible('submitted_at') && (
          <TableHead className="cursor-pointer select-none text-xs" onClick={() => handleSort('submitted_at')}>
            <div className="flex items-center">Submitted <SortIcon field="submitted_at" /></div>
          </TableHead>
        )}
        {isVisible('nationality') && <TableHead className="text-xs">Nationality</TableHead>}
        {isVisible('email') && <TableHead className="text-xs">Email</TableHead>}
      </TableRow>
    </TableHeader>
  );

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
              <Settings2 className="h-3 w-3" /> Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {ALL_COLUMNS.map(col => (
              <DropdownMenuCheckboxItem
                key={col.key}
                checked={isVisible(col.key)}
                onCheckedChange={() => toggleColumn(col.key)}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {sortedWorkers.length} worker{sortedWorkers.length !== 1 ? 's' : ''}
          </span>
          {!groups && (
            <Select value={String(pageSize)} onValueChange={v => setPageSize(Number(v))}>
              <SelectTrigger className="h-7 w-[70px] text-xs">
                <SelectValue />
              </SelectTrigger>
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
      {groups ? (
        <div className="space-y-4">
          {Array.from(groups.entries()).map(([groupName, items]) => (
            <div key={groupName}>
              <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/30 rounded-t-md">
                <span className="text-xs font-semibold">{groupName}</span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{items.length}</Badge>
              </div>
              <Table>
                {renderTableHeader()}
                <TableBody>
                  {items.map(renderRow)}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      ) : (
        <>
          <Table>
            {renderTableHeader()}
            <TableBody>
              {paginatedWorkers.map(renderRow)}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-3 border-t mt-2">
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (page <= 4) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = page - 3 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'ghost'}
                    size="icon"
                    className="h-7 w-7 text-xs"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
