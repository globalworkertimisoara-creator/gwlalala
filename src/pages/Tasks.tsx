import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, CheckCircle, Clock, Circle, AlertTriangle, Loader2 } from 'lucide-react';
import { useTasks, useCreateTask, useUpdateTask, type CreateTaskInput } from '@/hooks/useTasks';
import { format, isPast, isToday } from 'date-fns';

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-amber-100 text-amber-800',
  urgent: 'bg-destructive/10 text-destructive',
};

const statusIcons: Record<string, React.ReactNode> = {
  todo: <Circle className="h-4 w-4 text-muted-foreground" />,
  in_progress: <Clock className="h-4 w-4 text-blue-600" />,
  done: <CheckCircle className="h-4 w-4 text-green-600" />,
};

const TaskCard = ({ task, onCycleStatus }: { task: any; onCycleStatus: (id: string, status: string) => void }) => (
  <div className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
    <button
      className="mt-0.5 shrink-0"
      onClick={() => onCycleStatus(task.id, task.status)}
    >
      {statusIcons[task.status] || statusIcons.todo}
    </button>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium">{task.title}</p>
      {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <Badge className={`text-xs ${priorityColors[task.priority]}`}>{task.priority}</Badge>
        <Badge variant="outline" className="text-xs">{task.task_type}</Badge>
        {task.due_date && (
          <span className={`text-xs ${isPast(new Date(task.due_date)) && task.status !== 'done' ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            Due {format(new Date(task.due_date), 'MMM d, yyyy')}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data: tasks = [], isLoading } = useTasks(statusFilter ? { status: statusFilter } : undefined);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');
  const overdueTasks = tasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && t.status !== 'done');

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Task Management</h1>
            <p className="text-muted-foreground">Assign and track tasks across your team</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New Task</Button>
            </DialogTrigger>
            <DialogContent>
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
                  <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
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
                        <SelectItem value="candidate_follow_up">Candidate Follow-up</SelectItem>
                        <SelectItem value="visa_check">Visa Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={form.due_date || ''} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={createTask.isPending}>
                    {createTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Circle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{todoTasks.length}</p>
                  <p className="text-sm text-muted-foreground">To Do</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{inProgressTasks.length}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{doneTasks.length}</p>
                  <p className="text-sm text-muted-foreground">Done</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{overdueTasks.length}</p>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban-style Tabs */}
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
                <TabsTrigger value="todo">To Do ({todoTasks.length})</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress ({inProgressTasks.length})</TabsTrigger>
                <TabsTrigger value="done">Done ({doneTasks.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-2 mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tasks yet</p>
                    <p className="text-sm">Create your first task to get started.</p>
                  </div>
                ) : tasks.map(t => <TaskCard key={t.id} task={t} onCycleStatus={cycleStatus} />)}
              </TabsContent>
              <TabsContent value="todo" className="space-y-2 mt-4">
                {todoTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No tasks to do</p>
                ) : todoTasks.map(t => <TaskCard key={t.id} task={t} onCycleStatus={cycleStatus} />)}
              </TabsContent>
              <TabsContent value="in_progress" className="space-y-2 mt-4">
                {inProgressTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No tasks in progress</p>
                ) : inProgressTasks.map(t => <TaskCard key={t.id} task={t} onCycleStatus={cycleStatus} />)}
              </TabsContent>
              <TabsContent value="done" className="space-y-2 mt-4">
                {doneTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No completed tasks</p>
                ) : doneTasks.map(t => <TaskCard key={t.id} task={t} onCycleStatus={cycleStatus} />)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
