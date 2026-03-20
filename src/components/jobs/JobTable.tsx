import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  Briefcase, Building2, MapPin,
} from 'lucide-react';
import { format } from 'date-fns';
import { Job, JobStatus } from '@/types/database';
import { cn } from '@/lib/utils';

interface JobTableProps {
  jobs: Job[];
  candidateCounts: Record<string, number>;
  agencyCounts: Record<string, number>;
  projectNames: Record<string, string>;
  selectedJobId?: string;
  onJobClick: (job: Job) => void;
  groupBy: string;
}

type SortField = 'title' | 'client_company' | 'country' | 'status' | 'created_at' | 'candidates' | 'agencies';
type SortDirection = 'asc' | 'desc';

interface Column {
  key: string;
  label: string;
  defaultVisible: boolean;
}

const ALL_COLUMNS: Column[] = [
  { key: 'title', label: 'Job Title', defaultVisible: true },
  { key: 'project', label: 'Project', defaultVisible: true },
  { key: 'client_company', label: 'Client', defaultVisible: true },
  { key: 'country', label: 'Country', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'candidates', label: 'Candidates', defaultVisible: true },
  { key: 'agencies', label: 'Agencies', defaultVisible: true },
  { key: 'salary_range', label: 'Salary', defaultVisible: false },
  { key: 'created_at', label: 'Created', defaultVisible: false },
];

const STATUS_COLORS: Record<JobStatus, string> = {
  open: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  filled: 'bg-blue-100 text-blue-800',
};

const STORAGE_KEY = 'jobs-visible-columns';

function loadVisibleColumns(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key);
}

export function JobTable({
  jobs,
  candidateCounts,
  agencyCounts,
  projectNames,
  selectedJobId,
  onJobClick,
  groupBy,
}: JobTableProps) {
  const [sortField, setSortField] = useState<SortField>('created_at');
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
  const sortedJobs = useMemo(() => {
    const sorted = [...jobs];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title': cmp = a.title.localeCompare(b.title); break;
        case 'client_company': cmp = a.client_company.localeCompare(b.client_company); break;
        case 'country': cmp = a.country.localeCompare(b.country); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'created_at': cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
        case 'candidates': cmp = (candidateCounts[a.id] || 0) - (candidateCounts[b.id] || 0); break;
        case 'agencies': cmp = (agencyCounts[a.id] || 0) - (agencyCounts[b.id] || 0); break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [jobs, sortField, sortDirection, candidateCounts, agencyCounts]);

  // Grouping
  const groups = useMemo(() => {
    if (groupBy === 'none') return null;
    const map = new Map<string, Job[]>();
    for (const job of sortedJobs) {
      let key = '';
      switch (groupBy) {
        case 'project': key = projectNames[job.id] || 'No Project'; break;
        case 'status': key = job.status.charAt(0).toUpperCase() + job.status.slice(1); break;
        case 'country': key = job.country; break;
        case 'client': key = job.client_company; break;
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(job);
    }
    return map;
  }, [sortedJobs, groupBy, projectNames]);

  // Pagination (only when not grouped)
  const totalPages = groups ? 1 : Math.ceil(sortedJobs.length / pageSize);
  const paginatedJobs = groups ? sortedJobs : sortedJobs.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [jobs.length, pageSize, groupBy]);

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

  const renderRow = (job: Job) => {
    const isSelected = selectedJobId === job.id;
    const count = candidateCounts[job.id] || 0;
    const agencyCount = agencyCounts[job.id] || 0;
    const project = projectNames[job.id];

    return (
      <TableRow
        key={job.id}
        className={cn(
          'cursor-pointer hover:bg-muted/50 transition-colors',
          isSelected && 'bg-primary/5 border-l-2 border-l-primary'
        )}
        onClick={() => onJobClick(job)}
      >
        {isVisible('title') && (
          <TableCell className="font-medium text-xs py-2">
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="truncate max-w-[180px]">{job.title}</span>
            </div>
          </TableCell>
        )}
        {isVisible('project') && (
          <TableCell className="text-xs text-muted-foreground py-2">
            {project ? (
              <span className="text-primary truncate block max-w-[140px]">{project}</span>
            ) : '—'}
          </TableCell>
        )}
        {isVisible('client_company') && (
          <TableCell className="text-xs text-muted-foreground py-2">
            <div className="flex items-center gap-1">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[120px]">{job.client_company}</span>
            </div>
          </TableCell>
        )}
        {isVisible('country') && (
          <TableCell className="text-xs text-muted-foreground py-2">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {job.country}
            </div>
          </TableCell>
        )}
        {isVisible('status') && (
          <TableCell className="py-2">
            <Badge className={cn('text-[10px]', STATUS_COLORS[job.status])}>
              {job.status}
            </Badge>
          </TableCell>
        )}
        {isVisible('candidates') && (
          <TableCell className="text-xs text-center py-2">
            {count > 0 ? (
              <div className="flex items-center gap-1.5 justify-center">
                <Progress value={count > 0 ? Math.min(count * 20, 100) : 0} className="h-1.5 w-10" />
                <span className="text-[10px] text-muted-foreground tabular-nums">{count}</span>
              </div>
            ) : (
              <span className="text-red-500 text-[10px] font-medium">0</span>
            )}
          </TableCell>
        )}
        {isVisible('agencies') && (
          <TableCell className="text-xs text-center py-2">
            {agencyCount > 0 ? agencyCount : '—'}
          </TableCell>
        )}
        {isVisible('salary_range') && (
          <TableCell className="text-xs text-muted-foreground py-2">
            {job.salary_range || '—'}
          </TableCell>
        )}
        {isVisible('created_at') && (
          <TableCell className="text-xs text-muted-foreground py-2">
            {format(new Date(job.created_at), 'dd MMM yy')}
          </TableCell>
        )}
      </TableRow>
    );
  };

  const renderTableHeader = () => (
    <TableHeader>
      <TableRow>
        {isVisible('title') && (
          <TableHead className="cursor-pointer select-none text-xs" onClick={() => handleSort('title')}>
            <div className="flex items-center">Title <SortIcon field="title" /></div>
          </TableHead>
        )}
        {isVisible('project') && (
          <TableHead className="text-xs">Project</TableHead>
        )}
        {isVisible('client_company') && (
          <TableHead className="cursor-pointer select-none text-xs" onClick={() => handleSort('client_company')}>
            <div className="flex items-center">Client <SortIcon field="client_company" /></div>
          </TableHead>
        )}
        {isVisible('country') && (
          <TableHead className="cursor-pointer select-none text-xs" onClick={() => handleSort('country')}>
            <div className="flex items-center">Country <SortIcon field="country" /></div>
          </TableHead>
        )}
        {isVisible('status') && (
          <TableHead className="cursor-pointer select-none text-xs" onClick={() => handleSort('status')}>
            <div className="flex items-center">Status <SortIcon field="status" /></div>
          </TableHead>
        )}
        {isVisible('candidates') && (
          <TableHead className="cursor-pointer select-none text-xs text-center" onClick={() => handleSort('candidates')}>
            <div className="flex items-center justify-center">Candidates <SortIcon field="candidates" /></div>
          </TableHead>
        )}
        {isVisible('agencies') && (
          <TableHead className="cursor-pointer select-none text-xs text-center" onClick={() => handleSort('agencies')}>
            <div className="flex items-center justify-center">Agencies <SortIcon field="agencies" /></div>
          </TableHead>
        )}
        {isVisible('salary_range') && (
          <TableHead className="text-xs">Salary</TableHead>
        )}
        {isVisible('created_at') && (
          <TableHead className="cursor-pointer select-none text-xs" onClick={() => handleSort('created_at')}>
            <div className="flex items-center">Created <SortIcon field="created_at" /></div>
          </TableHead>
        )}
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
            {sortedJobs.length} job{sortedJobs.length !== 1 ? 's' : ''}
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
              {paginatedJobs.map(renderRow)}
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
