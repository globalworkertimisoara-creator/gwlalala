import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProjects } from '@/hooks/useProjects';
import { ProjectDetailPanel } from '@/components/projects/ProjectDetailPanel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Loader2, Search, Plus, ArrowUpDown, ArrowUp, ArrowDown, Group, Settings2,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { ProjectStatus, PROJECT_STATUS_CONFIG, ProjectWithMetrics, getProjectStatusColor, getProjectStatusLabel } from '@/types/project';
import { useTasks } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

type SortField = 'name' | 'employer_name' | 'status' | 'fill_percentage' | 'days_since_contract' | 'jobs_count' | 'location';
type SortDirection = 'asc' | 'desc';

const STATUS_CHIPS: { key: ProjectStatus | 'all'; label: string; color: string }[] = [
  { key: 'all', label: 'Total', color: 'text-muted-foreground bg-muted/50' },
  { key: 'active', label: 'Active', color: 'text-green-700 bg-green-50' },
  { key: 'draft', label: 'Draft', color: 'text-slate-700 bg-slate-100' },
  { key: 'on_hold', label: 'On Hold', color: 'text-amber-700 bg-amber-50' },
  { key: 'completed', label: 'Completed', color: 'text-blue-700 bg-blue-50' },
  { key: 'cancelled', label: 'Cancelled', color: 'text-red-700 bg-red-50' },
];

interface Column {
  key: string;
  label: string;
  defaultVisible: boolean;
}

const ALL_COLUMNS: Column[] = [
  { key: 'name', label: 'Project', defaultVisible: true },
  { key: 'employer_name', label: 'Employer', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'location', label: 'Location', defaultVisible: true },
  { key: 'fill_percentage', label: 'Fulfillment', defaultVisible: true },
  { key: 'jobs_count', label: 'Roles', defaultVisible: true },
  { key: 'days_since_contract', label: 'Days Active', defaultVisible: false },
  { key: 'sales', label: 'Sales', defaultVisible: false },
  { key: 'tasks', label: 'Tasks', defaultVisible: false },
];

const STORAGE_KEY = 'projects-visible-columns';

function loadVisibleColumns(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key);
}

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const { data: allTasks } = useTasks();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [employerFilter, setEmployerFilter] = useState<string>('all');
  const [groupBy, setGroupBy] = useState('none');
  const [selectedProject, setSelectedProject] = useState<ProjectWithMetrics | null>(null);

  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

  // Derived data
  const employers = useMemo(() => {
    if (!projects) return [];
    return [...new Set(projects.map(p => p.employer_name))].sort();
  }, [projects]);

  const pendingTasksByProject = useMemo(() => {
    if (!allTasks) return new Map<string, number>();
    const map = new Map<string, number>();
    allTasks
      .filter(t => t.status !== 'done' && t.entity_type === 'project' && t.entity_id)
      .forEach(t => {
        map.set(t.entity_id!, (map.get(t.entity_id!) || 0) + 1);
      });
    return map;
  }, [allTasks]);

  // Status counts for stat bar
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: projects?.length || 0 };
    for (const status of Object.keys(PROJECT_STATUS_CONFIG)) {
      counts[status] = projects?.filter(p => p.status === status).length || 0;
    }
    return counts;
  }, [projects]);

  // Avg fill rate
  const avgFillRate = useMemo(() => {
    if (!projects?.length) return 0;
    return Math.round(projects.reduce((sum, p) => sum + p.fill_percentage, 0) / projects.length);
  }, [projects]);

  // Filtering
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter(project => {
      const matchesSearch =
        !search ||
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.employer_name.toLowerCase().includes(search.toLowerCase()) ||
        project.location.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesEmployer = employerFilter === 'all' || project.employer_name === employerFilter;
      return matchesSearch && matchesStatus && matchesEmployer;
    });
  }, [projects, search, statusFilter, employerFilter]);

  // Sorting
  const sortedProjects = useMemo(() => {
    const sorted = [...filteredProjects];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'employer_name': cmp = a.employer_name.localeCompare(b.employer_name); break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
        case 'location': cmp = a.location.localeCompare(b.location); break;
        case 'fill_percentage': cmp = a.fill_percentage - b.fill_percentage; break;
        case 'days_since_contract': cmp = (a.days_since_contract ?? 0) - (b.days_since_contract ?? 0); break;
        case 'jobs_count': cmp = a.jobs.length - b.jobs.length; break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredProjects, sortField, sortDirection]);

  // Keep selected project updated
  useEffect(() => {
    if (selectedProject) {
      const updated = sortedProjects.find(p => p.id === selectedProject.id);
      if (updated) setSelectedProject(updated);
    }
  }, [sortedProjects]);

  // Grouping
  const groups = useMemo(() => {
    if (groupBy === 'none') return null;
    const map = new Map<string, ProjectWithMetrics[]>();
    for (const p of sortedProjects) {
      let key = '';
      switch (groupBy) {
        case 'status': key = getProjectStatusLabel(p.status); break;
        case 'employer': key = p.employer_name; break;
        case 'country':
          key = p.countries_in_contract.length > 0 ? p.countries_in_contract[0] : 'No Country';
          break;
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [sortedProjects, groupBy]);

  // Pagination (only when not grouped)
  const totalPages = groups ? 1 : Math.ceil(sortedProjects.length / pageSize);
  const paginatedProjects = groups ? sortedProjects : sortedProjects.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search, statusFilter, employerFilter, pageSize, groupBy]);

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

  const handleStatusChipClick = (key: string) => {
    setStatusFilter(key as ProjectStatus | 'all');
  };

  const renderRow = (project: ProjectWithMetrics) => {
    const isSelected = selectedProject?.id === project.id;
    const taskCount = pendingTasksByProject.get(project.id) || 0;

    return (
      <TableRow
        key={project.id}
        className={cn(
          'cursor-pointer hover:bg-muted/50 transition-colors',
          isSelected && 'bg-primary/5 border-l-2 border-l-primary'
        )}
        onClick={() => setSelectedProject(project)}
      >
        {isVisible('name') && (
          <TableCell className="font-medium text-xs py-2">
            <div>
              <span className="truncate block max-w-[200px]">{project.name}</span>
            </div>
          </TableCell>
        )}
        {isVisible('employer_name') && (
          <TableCell className="text-xs text-muted-foreground py-2">{project.employer_name}</TableCell>
        )}
        {isVisible('status') && (
          <TableCell className="py-2">
            <Badge className={cn('text-[10px]', getProjectStatusColor(project.status))}>
              {getProjectStatusLabel(project.status)}
            </Badge>
          </TableCell>
        )}
        {isVisible('location') && (
          <TableCell className="text-xs text-muted-foreground py-2">{project.location || '—'}</TableCell>
        )}
        {isVisible('fill_percentage') && (
          <TableCell className="py-2">
            <div className="flex items-center gap-2">
              <Progress value={project.fill_percentage} className="h-1.5 w-16" />
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {project.fill_percentage}%
              </span>
            </div>
          </TableCell>
        )}
        {isVisible('jobs_count') && (
          <TableCell className="text-xs text-center py-2">{project.jobs.length}</TableCell>
        )}
        {isVisible('days_since_contract') && (
          <TableCell className="text-xs text-muted-foreground py-2">
            {project.days_since_contract !== null ? `${project.days_since_contract}d` : '—'}
          </TableCell>
        )}
        {isVisible('sales') && (
          <TableCell className="text-xs text-muted-foreground py-2">{project.sales_person_name || '—'}</TableCell>
        )}
        {isVisible('tasks') && (
          <TableCell className="text-xs text-center py-2">
            {taskCount > 0 ? (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{taskCount}</Badge>
            ) : '—'}
          </TableCell>
        )}
      </TableRow>
    );
  };

  const renderTableHeader = () => (
    <TableHeader>
      <TableRow>
        {isVisible('name') && (
          <TableHead className="cursor-pointer select-none text-xs" onClick={() => handleSort('name')}>
            <div className="flex items-center">Project <SortIcon field="name" /></div>
          </TableHead>
        )}
        {isVisible('employer_name') && (
          <TableHead className="cursor-pointer select-none text-xs" onClick={() => handleSort('employer_name')}>
            <div className="flex items-center">Employer <SortIcon field="employer_name" /></div>
          </TableHead>
        )}
        {isVisible('status') && (
          <TableHead className="cursor-pointer select-none text-xs" onClick={() => handleSort('status')}>
            <div className="flex items-center">Status <SortIcon field="status" /></div>
          </TableHead>
        )}
        {isVisible('location') && (
          <TableHead className="cursor-pointer select-none text-xs" onClick={() => handleSort('location')}>
            <div className="flex items-center">Location <SortIcon field="location" /></div>
          </TableHead>
        )}
        {isVisible('fill_percentage') && (
          <TableHead className="cursor-pointer select-none text-xs" onClick={() => handleSort('fill_percentage')}>
            <div className="flex items-center">Fulfillment <SortIcon field="fill_percentage" /></div>
          </TableHead>
        )}
        {isVisible('jobs_count') && (
          <TableHead className="cursor-pointer select-none text-xs text-center" onClick={() => handleSort('jobs_count')}>
            <div className="flex items-center justify-center">Roles <SortIcon field="jobs_count" /></div>
          </TableHead>
        )}
        {isVisible('days_since_contract') && (
          <TableHead className="cursor-pointer select-none text-xs" onClick={() => handleSort('days_since_contract')}>
            <div className="flex items-center">Days <SortIcon field="days_since_contract" /></div>
          </TableHead>
        )}
        {isVisible('sales') && (
          <TableHead className="text-xs">Sales</TableHead>
        )}
        {isVisible('tasks') && (
          <TableHead className="text-xs text-center">Tasks</TableHead>
        )}
      </TableRow>
    </TableHeader>
  );

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Projects</h1>
              <p className="text-sm text-muted-foreground">Manage client projects and track recruitment fulfillment</p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => navigate('/projects/new')}>
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </div>

          {/* Compact Stat Bar */}
          <div className="flex items-center gap-1 text-xs flex-wrap">
            {STATUS_CHIPS.map(chip => (
              <span key={chip.key} className="contents">
                <StatChip
                  label={chip.label}
                  value={statusCounts[chip.key] || 0}
                  color={chip.color}
                  active={statusFilter === chip.key}
                  onClick={() => handleStatusChipClick(chip.key)}
                />
                <span className="text-muted-foreground">·</span>
              </span>
            ))}
            <StatChip label="Avg Fill" value={`${avgFillRate}%`} color="text-indigo-700 bg-indigo-50" />
          </div>

          {/* Filters */}
          <div className="flex items-end gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, employer, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Select value={employerFilter} onValueChange={setEmployerFilter}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="All Employers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employers</SelectItem>
                {employers.map(e => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="h-10 w-[150px]">
                <Group className="h-4 w-4 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No grouping</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
                <SelectItem value="employer">By Employer</SelectItem>
                <SelectItem value="country">By Country</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main content: table + optional detail panel */}
        <div className="flex-1 flex gap-0 min-h-0 overflow-hidden mx-6 mb-6 rounded-lg border bg-card">
          {/* Table area */}
          <div className={`flex-1 min-w-0 overflow-auto p-3 ${selectedProject ? 'max-w-[65%]' : ''}`}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
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
                      {sortedProjects.length} project{sortedProjects.length !== 1 ? 's' : ''}
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
                  // Grouped view
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
                  // Flat view with pagination
                  <>
                    <Table>
                      {renderTableHeader()}
                      <TableBody>
                        {paginatedProjects.map(renderRow)}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
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
            )}
          </div>

          {/* Detail sidebar panel */}
          {selectedProject && (
            <div className="w-[35%] min-w-[320px] max-w-[420px] shrink-0 overflow-hidden">
              <ProjectDetailPanel
                key={selectedProject.id}
                project={selectedProject}
                onClose={() => setSelectedProject(null)}
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function StatChip({ label, value, color, active, onClick }: { label: string; value: number | string; color?: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
        active ? 'ring-2 ring-primary/40 ' : 'hover:ring-1 hover:ring-primary/30 '
      }${color || 'text-muted-foreground bg-muted/50'}`}
    >
      <span className="font-medium">{value}</span>
      <span className="opacity-70">{label}</span>
    </button>
  );
}
