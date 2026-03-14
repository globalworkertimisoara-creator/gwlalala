import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useProjects } from '@/hooks/useProjects';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectTableRow } from '@/components/projects/ProjectTableRow';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  Search,
  FolderKanban,
  Users,
  CheckCircle,
  Clock,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { ProjectStatus, PROJECT_STATUS_CONFIG, ProjectWithMetrics } from '@/types/project';
import { useTasks } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

type ViewMode = 'table' | 'cards';
type SortField = 'name' | 'employer_name' | 'status' | 'fill_percentage' | 'days_since_contract' | 'jobs_count';
type SortDirection = 'asc' | 'desc';

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const { data: allTasks } = useTasks();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [employerFilter, setEmployerFilter] = useState<string>('all');
  const [salesFilter, setSalesFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Derive filter options from data
  const employers = useMemo(() => {
    if (!projects) return [];
    return [...new Set(projects.map(p => p.employer_name))].sort();
  }, [projects]);

  const salesPersons = useMemo(() => {
    if (!projects) return [];
    return [...new Set(projects.map(p => p.sales_person_name).filter(Boolean) as string[])].sort();
  }, [projects]);

  const countries = useMemo(() => {
    if (!projects) return [];
    return [...new Set(projects.flatMap(p => p.countries_in_contract))].sort();
  }, [projects]);

  // Pending tasks per project
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
      const matchesSales = salesFilter === 'all' || project.sales_person_name === salesFilter;
      const matchesCountry =
        countryFilter === 'all' || project.countries_in_contract.includes(countryFilter);

      return matchesSearch && matchesStatus && matchesEmployer && matchesSales && matchesCountry;
    });
  }, [projects, search, statusFilter, employerFilter, salesFilter, countryFilter]);

  // Sorting
  const sortedProjects = useMemo(() => {
    const sorted = [...filteredProjects];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'employer_name':
          cmp = a.employer_name.localeCompare(b.employer_name);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'fill_percentage':
          cmp = a.fill_percentage - b.fill_percentage;
          break;
        case 'days_since_contract':
          cmp = (a.days_since_contract ?? 0) - (b.days_since_contract ?? 0);
          break;
        case 'jobs_count':
          cmp = a.jobs.length - b.jobs.length;
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [filteredProjects, sortField, sortDirection]);

  // Toggle sort
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
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  // Stats
  const stats = {
    total: projects?.length || 0,
    active: projects?.filter(p => p.status === 'active').length || 0,
    totalPlaced: projects?.reduce((sum, p) => sum + p.filled_positions, 0) || 0,
    avgFillRate: projects?.length
      ? Math.round(projects.reduce((sum, p) => sum + p.fill_percentage, 0) / projects.length)
      : 0,
  };

  const hasActiveFilters = statusFilter !== 'all' || employerFilter !== 'all' || salesFilter !== 'all' || countryFilter !== 'all' || search;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground">
              Manage client projects and track recruitment fulfillment
            </p>
          </div>
          <CreateProjectDialog />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FolderKanban className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent rounded-lg">
                  <Clock className="h-4 w-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-lg">
                  <Users className="h-4 w-4 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums">{stats.totalPlaced}</p>
                  <p className="text-xs text-muted-foreground">Placed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums">{stats.avgFillRate}%</p>
                  <p className="text-xs text-muted-foreground">Avg Fill</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters row */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects, employers, locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* View toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none gap-1.5 px-3"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Table</span>
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none gap-1.5 px-3"
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Cards</span>
              </Button>
            </div>
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProjectStatus | 'all')}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(PROJECT_STATUS_CONFIG).map(([value, config]) => (
                  <SelectItem key={value} value={value}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={employerFilter} onValueChange={setEmployerFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Employer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employers</SelectItem>
                {employers.map(e => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {salesPersons.length > 0 && (
              <Select value={salesFilter} onValueChange={setSalesFilter}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="Sales Person" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sales</SelectItem>
                  {salesPersons.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {countries.length > 0 && (
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setEmployerFilter('all');
                  setSalesFilter('all');
                  setCountryFilter('all');
                }}
              >
                Clear filters
              </Button>
            )}

            <span className="text-xs text-muted-foreground self-center ml-auto tabular-nums">
              {sortedProjects.length} project{sortedProjects.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sortedProjects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Create your first project to get started'}
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'table' ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Project <SortIcon field="name" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status <SortIcon field="status" />
                    </div>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead className="hidden lg:table-cell">Sales</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('fill_percentage')}
                  >
                    <div className="flex items-center">
                      Fulfillment <SortIcon field="fill_percentage" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="hidden md:table-cell text-center cursor-pointer select-none"
                    onClick={() => handleSort('jobs_count')}
                  >
                    <div className="flex items-center justify-center">
                      Roles <SortIcon field="jobs_count" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="hidden lg:table-cell cursor-pointer select-none"
                    onClick={() => handleSort('days_since_contract')}
                  >
                    <div className="flex items-center">
                      Days <SortIcon field="days_since_contract" />
                    </div>
                  </TableHead>
                  <TableHead className="hidden xl:table-cell text-center">Tasks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProjects.map(project => (
                  <ProjectTableRow
                    key={project.id}
                    project={project}
                    pendingTasksCount={pendingTasksByProject.get(project.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
