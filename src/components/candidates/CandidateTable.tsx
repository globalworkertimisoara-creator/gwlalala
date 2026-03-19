import { useState, useMemo } from 'react';
import { Candidate, getStageLabel, getStageColor, RecruitmentStage } from '@/types/database';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Users, FolderSymlink, ArrowUpDown, ArrowUp, ArrowDown, Settings2, ChevronLeft, ChevronRight } from 'lucide-react';

type SortKey = 'full_name' | 'current_stage' | 'nationality' | 'current_country' | 'days_in_stage' | 'created_at';
type SortDir = 'asc' | 'desc';

interface ColumnDef {
  key: string;
  label: string;
  defaultVisible: boolean;
}

const ALL_COLUMNS: ColumnDef[] = [
  { key: 'candidate', label: 'Candidate', defaultVisible: true },
  { key: 'nationality', label: 'Nationality', defaultVisible: true },
  { key: 'country', label: 'Country', defaultVisible: true },
  { key: 'stage', label: 'Stage', defaultVisible: true },
  { key: 'days_in_stage', label: 'Days in Stage', defaultVisible: true },
  { key: 'added', label: 'Added', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: false },
  { key: 'phone', label: 'Phone', defaultVisible: false },
  { key: 'expected_start', label: 'Expected Start', defaultVisible: false },
];

interface CandidateTableProps {
  candidates: Candidate[];
  selectedCandidateId?: string | null;
  onCandidateClick?: (candidate: Candidate) => void;
  onLinkToProject?: (candidate: Candidate) => void;
  groupBy?: string;
}

function getInitials(fullName: string): string {
  return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Stage phase grouping
const STAGE_PHASES: Record<string, string> = {
  sourced: 'Sourcing',
  contacted: 'Sourcing',
  application_received: 'Sourcing',
  screening: 'Evaluation',
  shortlisted: 'Evaluation',
  submitted_to_client: 'Evaluation',
  client_feedback: 'Evaluation',
  interview_completed: 'Evaluation',
  offer_extended: 'Closing',
  offer_accepted: 'Closing',
  visa_processing: 'Post-Hire',
  medical_checks: 'Post-Hire',
  onboarding: 'Post-Hire',
  placed: 'Post-Hire',
  closed_not_placed: 'Closed',
};

export { STAGE_PHASES };

export function CandidateTable({ candidates, selectedCandidateId, onCandidateClick, onLinkToProject, groupBy = 'none' }: CandidateTableProps) {
  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('candidate-table-columns');
      if (saved) return new Set(JSON.parse(saved));
    } catch { /* ignore */ }
    return new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key));
  });

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem('candidate-table-columns', JSON.stringify([...next]));
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

  // Sort
  const sorted = useMemo(() => {
    const arr = [...candidates];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'full_name': cmp = a.full_name.localeCompare(b.full_name); break;
        case 'current_stage': cmp = a.current_stage.localeCompare(b.current_stage); break;
        case 'nationality': cmp = (a.nationality || '').localeCompare(b.nationality || ''); break;
        case 'current_country': cmp = (a.current_country || '').localeCompare(b.current_country || ''); break;
        case 'days_in_stage': {
          const dA = differenceInDays(new Date(), new Date(a.updated_at));
          const dB = differenceInDays(new Date(), new Date(b.updated_at));
          cmp = dA - dB;
          break;
        }
        case 'created_at': cmp = a.created_at.localeCompare(b.created_at); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [candidates, sortKey, sortDir]);

  // Group
  const groups = useMemo(() => {
    if (groupBy === 'none') return [{ label: '', candidates: sorted }];

    const map = new Map<string, Candidate[]>();
    for (const c of sorted) {
      let key = '';
      switch (groupBy) {
        case 'stage': key = getStageLabel(c.current_stage).split(' / ')[0]; break;
        case 'phase': key = STAGE_PHASES[c.current_stage] || 'Other'; break;
        case 'country': key = c.current_country || 'Unknown'; break;
        case 'nationality': key = c.nationality || 'Unknown'; break;
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries()).map(([label, candidates]) => ({ label, candidates }));
  }, [sorted, groupBy]);

  // Pagination
  const isGrouped = groupBy !== 'none';
  const totalPages = isGrouped ? 1 : Math.ceil(candidates.length / pageSize);
  const paginatedGroups = isGrouped
    ? groups
    : [{ label: '', candidates: sorted.slice(page * pageSize, (page + 1) * pageSize) }];

  if (candidates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No candidates found</p>
        <p className="text-sm mt-1">Try adjusting your search or filters.</p>
      </div>
    );
  }

  const isCol = (key: string) => visibleColumns.has(key);
  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{candidates.length} candidate{candidates.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <Settings2 className="h-3.5 w-3.5" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ALL_COLUMNS.map(col => (
                <DropdownMenuCheckboxItem key={col.key} checked={visibleColumns.has(col.key)} onCheckedChange={() => toggleColumn(col.key)}>
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

      {/* Table groups */}
      {paginatedGroups.map((group, gi) => (
        <div key={gi}>
          {isGrouped && group.label && (
            <div className="flex items-center gap-2 py-2 px-1 mt-2 border-b">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</span>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{group.candidates.length}</Badge>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {isCol('candidate') && (
                    <TableHead className="cursor-pointer select-none px-2" onClick={() => handleSort('full_name')}>
                      <span className="flex items-center text-xs">Candidate <SortIcon col="full_name" /></span>
                    </TableHead>
                  )}
                  {isCol('email') && <TableHead className="px-2"><span className="text-xs">Email</span></TableHead>}
                  {isCol('phone') && <TableHead className="px-2"><span className="text-xs">Phone</span></TableHead>}
                  {isCol('nationality') && (
                    <TableHead className="cursor-pointer select-none px-2" onClick={() => handleSort('nationality')}>
                      <span className="flex items-center text-xs">Nationality <SortIcon col="nationality" /></span>
                    </TableHead>
                  )}
                  {isCol('country') && (
                    <TableHead className="cursor-pointer select-none px-2" onClick={() => handleSort('current_country')}>
                      <span className="flex items-center text-xs">Country <SortIcon col="current_country" /></span>
                    </TableHead>
                  )}
                  {isCol('stage') && (
                    <TableHead className="cursor-pointer select-none px-2" onClick={() => handleSort('current_stage')}>
                      <span className="flex items-center text-xs">Stage <SortIcon col="current_stage" /></span>
                    </TableHead>
                  )}
                  {isCol('days_in_stage') && (
                    <TableHead className="cursor-pointer select-none px-2" onClick={() => handleSort('days_in_stage')}>
                      <span className="flex items-center text-xs">Days <SortIcon col="days_in_stage" /></span>
                    </TableHead>
                  )}
                  {isCol('added') && (
                    <TableHead className="cursor-pointer select-none px-2" onClick={() => handleSort('created_at')}>
                      <span className="flex items-center text-xs">Added <SortIcon col="created_at" /></span>
                    </TableHead>
                  )}
                  {isCol('expected_start') && <TableHead className="px-2"><span className="text-xs">Start Date</span></TableHead>}
                  {onLinkToProject && <TableHead className="w-8 px-1"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.candidates.map((candidate) => {
                  const daysInStage = differenceInDays(new Date(), new Date(candidate.updated_at));
                  const isLongWait = daysInStage > 14;
                  const isSelected = selectedCandidateId === candidate.id;

                  return (
                    <TableRow
                      key={candidate.id}
                      className={cn(
                        'cursor-pointer h-10',
                        isSelected && 'bg-primary/10 border-l-2 border-l-primary',
                        !isSelected && 'hover:bg-muted/30'
                      )}
                      onClick={() => onCandidateClick?.(candidate)}
                    >
                      {isCol('candidate') && (
                        <TableCell className="px-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="bg-primary/10 text-primary font-medium text-[10px]">
                                {getInitials(candidate.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate max-w-[180px]">{candidate.full_name}</p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{candidate.email}</p>
                            </div>
                          </div>
                        </TableCell>
                      )}
                      {isCol('email') && <TableCell className="px-2 text-xs text-muted-foreground">{candidate.email}</TableCell>}
                      {isCol('phone') && <TableCell className="px-2 text-xs text-muted-foreground">{candidate.phone || '—'}</TableCell>}
                      {isCol('nationality') && <TableCell className="px-2 text-xs">{candidate.nationality || '—'}</TableCell>}
                      {isCol('country') && <TableCell className="px-2 text-xs">{candidate.current_country || '—'}</TableCell>}
                      {isCol('stage') && (
                        <TableCell className="px-2">
                          <Badge variant="secondary" className={cn('text-[10px] px-1.5', getStageColor(candidate.current_stage))}>
                            {getStageLabel(candidate.current_stage).split(' / ')[0]}
                          </Badge>
                        </TableCell>
                      )}
                      {isCol('days_in_stage') && (
                        <TableCell className="px-2">
                          <span className={cn('text-xs font-medium', isLongWait && 'text-amber-600')}>{daysInStage}d</span>
                        </TableCell>
                      )}
                      {isCol('added') && (
                        <TableCell className="px-2 text-xs text-muted-foreground">{format(new Date(candidate.created_at), 'MMM d, yyyy')}</TableCell>
                      )}
                      {isCol('expected_start') && (
                        <TableCell className="px-2 text-xs text-muted-foreground">
                          {candidate.expected_start_date ? format(new Date(candidate.expected_start_date), 'MMM d, yyyy') : '—'}
                        </TableCell>
                      )}
                      {onLinkToProject && (
                        <TableCell className="px-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onLinkToProject(candidate); }}>
                                <FolderSymlink className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Link to Project</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      )}
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
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, candidates.length)} of {candidates.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = totalPages <= 5 ? i : Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
              return (
                <Button key={pageNum} variant={page === pageNum ? 'default' : 'ghost'} size="icon" className="h-7 w-7 text-xs" onClick={() => setPage(pageNum)}>
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