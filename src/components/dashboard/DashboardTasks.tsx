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
import { Plus, CheckCircle, Clock, Circle, AlertTriangle, Loader2 } from 'lucide-react';
import { useTasks, useCreateTask, useUpdateTask, type CreateTaskInput } from '@/hooks/useTasks';
import { format, isPast, isToday, addDays, isBefore } from 'date-fns';

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-amber-100 text-amber-800',
  urgent: 'bg-destructive/10 text-destructive',
};

const statusIcons: Record<string, React.ReactNode> = {
  todo: <Circle className="h-3.5 w-3.5 text-muted-foreground" />,
  in_progress: <Clock className="h-3.5 w-3.5 text-blue-600" />,
  done: <CheckCircle className="h-3.5 w-3.5 text-green-600" />,
};

function TaskItem({ task, onCycleStatus }: { task: any; onCycleStatus: (id: string, status: string) => void }) {
  const getDueBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    const d = new Date(dueDate);
    if (isPast(d) && !isToday(d)) return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Overdue</Badge>;
    if (isToday(d)) return <Badge className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0">Today</Badge>;
    if (isBefore(d, addDays(new Date(), 3))) return <Badge className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0">Soon</Badge>;
    return null;
  };

  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-card hover:bg-accent/50 transition-colors group">
      <button
        className="mt-0.5 shrink-0"
        onClick={() => onCycleStatus(task.id, task.status)}
      >
        {statusIcons[task.status] || statusIcons.todo}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <Badge className={`text-[10px] px-1.5 py-0 ${priorityColors[task.priority]}`}>{task.priority}</Badge>
          {task.due_date && (
            <span className="text-[11px] text-muted-foreground">
              {format(new Date(task.due_date), 'MMM d')}
            </span>
          )}
          {getDueBadge(task.due_date)}
        </div>
      </div>
    </div>
  );
}

export function DashboardTasks() {
  const { data: tasks = [], isLoading } = useTasks();
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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Tasks</CardTitle>
          <div className="flex items-center gap-2">
            {overdueTasks.length > 0 && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                {overdueTasks.length} overdue
              </Badge>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 h-7 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
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
            <Circle className="h-3 w-3" /> {todoTasks.length} to do
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 text-blue-600" /> {inProgressTasks.length} active
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle className="h-3 w-3 text-green-600" /> {doneTasks.length} done
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full h-8">
            <TabsTrigger value="active" className="text-xs flex-1">Active ({todoTasks.length + inProgressTasks.length})</TabsTrigger>
            <TabsTrigger value="done" className="text-xs flex-1">Done ({doneTasks.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : todoTasks.length + inProgressTasks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                {[...inProgressTasks, ...todoTasks].map(t => (
                  <TaskItem key={t.id} task={t} onCycleStatus={cycleStatus} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="done" className="mt-3">
            {doneTasks.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 text-sm">No completed tasks</p>
            ) : (
              <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                {doneTasks.slice(0, 10).map(t => (
                  <TaskItem key={t.id} task={t} onCycleStatus={cycleStatus} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}