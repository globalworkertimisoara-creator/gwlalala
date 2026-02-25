import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckSquare, Plus, Clock, AlertTriangle, CheckCircle, Circle } from 'lucide-react';
import { useMyTasks, useCreateTask, useUpdateTask, type CreateTaskInput } from '@/hooks/useTasks';
import { format, isPast, isToday, addDays, isBefore } from 'date-fns';

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

export function TasksSidebar() {
  const { data: tasks = [], isLoading } = useMyTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState<CreateTaskInput>({ title: '', priority: 'medium', task_type: 'general' });

  const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
  const overdueTasks = activeTasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)));

  const handleCreate = async () => {
    if (!newTask.title.trim()) return;
    await createTask.mutateAsync(newTask);
    setNewTask({ title: '', priority: 'medium', task_type: 'general' });
    setShowForm(false);
  };

  const cycleStatus = (id: string, current: string) => {
    const next = current === 'todo' ? 'in_progress' : current === 'in_progress' ? 'done' : 'todo';
    updateTask.mutate({ id, status: next });
  };

  const getDueBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    const d = new Date(dueDate);
    if (isPast(d) && !isToday(d)) return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    if (isToday(d)) return <Badge className="bg-amber-100 text-amber-800 text-xs">Due today</Badge>;
    if (isBefore(d, addDays(new Date(), 3))) return <Badge className="bg-blue-100 text-blue-800 text-xs">Soon</Badge>;
    return null;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <CheckSquare className="h-5 w-5" />
          {overdueTasks.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-4 w-4 text-[10px] flex items-center justify-center">
              {overdueTasks.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[440px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            My Tasks
            <Badge variant="outline">{activeTasks.length} active</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {/* Quick Add */}
          {!showForm ? (
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Add Task
            </Button>
          ) : (
            <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
              <Input
                placeholder="Task title..."
                value={newTask.title}
                onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                autoFocus
              />
              <Textarea
                placeholder="Description (optional)"
                value={newTask.description || ''}
                onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                rows={2}
              />
              <div className="flex gap-2">
                <Select value={newTask.priority} onValueChange={v => setNewTask(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  className="flex-1"
                  value={newTask.due_date || ''}
                  onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" onClick={handleCreate} disabled={createTask.isPending}>Create</Button>
              </div>
            </div>
          )}

          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <div className="flex items-center gap-2 text-destructive text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
            </div>
          )}

          {/* Task List */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : activeTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No active tasks</p>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
              {activeTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => cycleStatus(task.id, task.status)}
                >
                  <div className="mt-0.5">{statusIcons[task.status] || statusIcons.todo}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs ${priorityColors[task.priority]}`}>{task.priority}</Badge>
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(task.due_date), 'MMM d')}
                        </span>
                      )}
                      {getDueBadge(task.due_date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
