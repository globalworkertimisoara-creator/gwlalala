import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, CheckCircle, Clock, Circle, AlertTriangle, Loader2, LayoutList, LayoutGrid, ExternalLink } from 'lucide-react';
import { useTasks, useTeamTasks, useCreateTask, useUpdateTask, type CreateTaskInput } from '@/hooks/useTasks';
import { useStaffProfiles } from '@/hooks/useStaffProfiles';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { format, isPast, isToday, addDays, isBefore } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  urgent: 'bg-destructive/10 text-destructive',
};

const statusIcons: Record<string, React.ReactNode> = {
  todo: <Circle className="h-3.5 w-3.5 text-muted-foreground" />,
  in_progress: <Clock className="h-3.5 w-3.5 text-blue-600" />,
  done: <CheckCircle className="h-3.5 w-3.5 text-green-600" />,
};

const ENTITY_ROUTES: Record<string, string> = {
  candidate: '/candidates',
  project: '/projects',
  job: '/jobs',
};

const INTERNAL_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'operations_manager', label: 'Operations Manager' },
  { value: 'documentation_staff', label: 'Documentation Staff' },
  { value: 'documentation_lead', label: 'Documentation Lead' },
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'project_manager', label: 'Project Manager' },
];

function EntityLink({ entityType, entityId }: { entityType: string; entityId: string }) {
  const navigate = useNavigate();
  const route = ENTITY_ROUTES[entityType];
  if (!route) return null;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigate(`${route}/${entityId}`); }}
      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
    >
      {entityType}
      <ExternalLink className="h-2.5 w-2.5" />
    </button>
  );
}

function getDueBadge(dueDate: string | null) {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (isPast(d) && !isToday(d)) return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Overdue</Badge>;
  if (isToday(d)) return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] px-1.5 py-0">Today</Badge>;
  if (isBefore(d, addDays(new Date(), 3))) return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] px-1.5 py-0">Soon</Badge>;
  return null;
}

function TaskItem({ task, onCycleStatus }: { task: any; onCycleStatus: (id: string, status: string) => void }) {
  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
      <button className="mt-0.5 shrink-0" onClick={() => onCycleStatus(task.id, task.status)}>
        {statusIcons[task.status] || statusIcons.todo}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <Badge className={`text-[10px] px-1.5 py-0 ${priorityColors[task.priority]}`}>{task.priority}</Badge>
          {task.assignee_name && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{task.assignee_name}</span>
          )}
          {task.due_date && (
            <span className="text-[11px] text-muted-foreground">{format(new Date(task.due_date), 'MMM d')}</span>
          )}
          {getDueBadge(task.due_date)}
          {task.entity_type && task.entity_id && (
            <EntityLink entityType={task.entity_type} entityId={task.entity_id} />
          )}
        </div>
      </div>
    </div>
  );
}

function TaskTableView({ tasks, onCycleStatus }: { tasks: any[]; onCycleStatus: (id: string, status: string) => void }) {
  const navigate = useNavigate();
  return (
    <div className="max-h-[360px] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Task</TableHead>
            <TableHead className="w-20">Priority</TableHead>
            <TableHead className="w-24">Assignee</TableHead>
            <TableHead className="w-20">Due</TableHead>
            <TableHead className="w-16">Link</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(task => (
            <TableRow key={task.id} className="group">
              <TableCell>
                <button onClick={() => onCycleStatus(task.id, task.status)}>
                  {statusIcons[task.status] || statusIcons.todo}
                </button>
              </TableCell>
              <TableCell className={`text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </TableCell>
              <TableCell>
                <Badge className={`text-[10px] px-1.5 py-0 ${priorityColors[task.priority]}`}>{task.priority}</Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground truncate max-w-[100px]">
                {task.assignee_name || '—'}
              </TableCell>
              <TableCell className="text-xs">
                {task.due_date ? format(new Date(task.due_date), 'MMM d') : '—'}
              </TableCell>
              <TableCell>
                {task.entity_type && task.entity_id ? (
                  <button
                    onClick={() => navigate(`${ENTITY_ROUTES[task.entity_type] || ''}/${task.entity_id}`)}
                    className="text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function DashboardTasks() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const isManager = can('viewAllUsers');

  const { data: myTasks = [], isLoading: myLoading } = useTasks(user ? { assigned_to: user.id } : undefined);
  const { data: teamTasks = [], isLoading: teamLoading } = useTeamTasks();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const { data: staffProfiles = [] } = useStaffProfiles();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [teamFilter, setTeamFilter] = useState<{ assignee?: string; priority?: string }>({});
  const [form, setForm] = useState<CreateTaskInput>({
    title: '', description: '', priority: 'medium', task_type: 'general',
  });

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    await createTask.mutateAsync(form);
    setForm({ title: '', description: '', priority: 'medium', task_type: 'general' });
    setDialogOpen(false);
  };

  const cycleStatus = (id: string, current: string) => {
    const next = current === 'todo' ? 'in_progress' : current === 'in_progress' ? 'done' : 'todo';
    updateTask.mutate({ id, status: next });
  };

  // My tasks breakdown
  const myActive = myTasks.filter(t => t.status !== 'done');
  const myDone = myTasks.filter(t => t.status === 'done');
  const myOverdue = myTasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== 'done');

  // Team tasks with filters
  let filteredTeam = teamTasks;
  if (teamFilter.assignee) filteredTeam = filteredTeam.filter(t => t.assigned_to === teamFilter.assignee);
  if (teamFilter.priority) filteredTeam = filteredTeam.filter(t => t.priority === teamFilter.priority);

  const teamActive = filteredTeam.filter(t => t.status !== 'done');
  const teamDone = filteredTeam.filter(t => t.status === 'done');
  const teamOverdue = teamTasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== 'done');

  const renderTaskList = (tasks: any[], loading: boolean, emptyMsg: string) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      );
    }
    if (tasks.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{emptyMsg}</p>
        </div>
      );
    }
    if (viewMode === 'table') {
      return <TaskTableView tasks={tasks} onCycleStatus={cycleStatus} />;
    }
    return (
      <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
        {tasks.map(t => <TaskItem key={t.id} task={t} onCycleStatus={cycleStatus} />)}
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Tasks</CardTitle>
          <div className="flex items-center gap-1.5">
            {(myOverdue.length > 0 || teamOverdue.length > 0) && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                {Math.max(myOverdue.length, teamOverdue.length)} overdue
              </Badge>
            )}
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => setViewMode(v => v === 'cards' ? 'table' : 'cards')}
              title={viewMode === 'cards' ? 'Table view' : 'Card view'}
            >
              {viewMode === 'cards' ? <LayoutList className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Priority</Label>
                      <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select value={form.task_type} onValueChange={v => setForm(p => ({ ...p, task_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="document_review">Document Review</SelectItem>
                          <SelectItem value="candidate_follow_up">Follow-up</SelectItem>
                          <SelectItem value="visa_check">Visa Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Assignment fields — visible to managers */}
                  {isManager && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Assign to User</Label>
                        <Select value={form.assigned_to || '__none__'} onValueChange={v => setForm(p => ({ ...p, assigned_to: v === '__none__' ? undefined : v }))}>
                          <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Unassigned</SelectItem>
                            {staffProfiles.map(p => (
                              <SelectItem key={p.user_id} value={p.user_id}>
                                {p.full_name || 'Unnamed'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Assign to Role</Label>
                        <Select value={form.assigned_role || '__none__'} onValueChange={v => setForm(p => ({ ...p, assigned_role: v === '__none__' ? undefined : v }))}>
                          <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {INTERNAL_ROLES.map(r => (
                              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Entity linking */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Link to</Label>
                      <Select value={form.entity_type || '__none__'} onValueChange={v => setForm(p => ({ ...p, entity_type: v === '__none__' ? undefined : v, entity_id: v === '__none__' ? undefined : p.entity_id }))}>
                        <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          <SelectItem value="candidate">Candidate</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                          <SelectItem value="job">Job</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {form.entity_type && (
                      <div>
                        <Label>Entity ID</Label>
                        <Input
                          placeholder="Paste ID"
                          value={form.entity_id || ''}
                          onChange={e => setForm(p => ({ ...p, entity_id: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Due Date</Label>
                    <Input type="date" value={form.due_date || ''} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={createTask.isPending}>
                      {createTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Mini stats */}
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Circle className="h-3 w-3" /> {myActive.filter(t => t.status === 'todo').length} to do
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 text-blue-600" /> {myActive.filter(t => t.status === 'in_progress').length} active
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3 text-green-600" /> {myDone.length} done
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs defaultValue="my" className="w-full">
          <TabsList className="w-full h-8">
            <TabsTrigger value="my" className="text-xs flex-1">My Tasks ({myActive.length})</TabsTrigger>
            {isManager && (
              <TabsTrigger value="team" className="text-xs flex-1">Team ({teamActive.length})</TabsTrigger>
            )}
            <TabsTrigger value="done" className="text-xs flex-1">Done ({myDone.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="my" className="mt-3">
            {renderTaskList(myActive, myLoading, 'All caught up!')}
          </TabsContent>

          {isManager && (
            <TabsContent value="team" className="mt-3">
              {/* Team filters */}
              <div className="flex gap-2 mb-3">
                <Select value={teamFilter.assignee || '__all__'} onValueChange={v => setTeamFilter(f => ({ ...f, assignee: v === '__all__' ? undefined : v }))}>
                  <SelectTrigger className="h-7 text-xs w-[140px]"><SelectValue placeholder="All assignees" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All assignees</SelectItem>
                    {staffProfiles.map(p => (
                      <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || 'Unnamed'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={teamFilter.priority || '__all__'} onValueChange={v => setTeamFilter(f => ({ ...f, priority: v === '__all__' ? undefined : v }))}>
                  <SelectTrigger className="h-7 text-xs w-[110px]"><SelectValue placeholder="All priorities" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {renderTaskList(teamActive, teamLoading, 'No team tasks')}
            </TabsContent>
          )}

          <TabsContent value="done" className="mt-3">
            {myDone.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 text-sm">No completed tasks</p>
            ) : (
              renderTaskList(myDone.slice(0, 15), false, '')
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
