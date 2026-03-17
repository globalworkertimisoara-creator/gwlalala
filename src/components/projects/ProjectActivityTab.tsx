import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckSquare, Plus, Circle, CheckCircle2, Loader2 } from 'lucide-react';
import { useTasks, useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import WorkflowPhaseTracker from '@/components/projects/WorkflowPhaseTracker';
import { format } from 'date-fns';

interface ProjectActivityTabProps {
  projectId: string;
}

export function ProjectActivityTab({ projectId }: ProjectActivityTabProps) {
  const { data: tasks = [], isLoading: tasksLoading } = useTasks({ entity_type: 'project', entity_id: projectId });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');

  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const completedTasks = tasks.filter(t => t.status === 'done');

  const handleQuickAdd = async () => {
    if (!newTaskTitle.trim()) return;
    await createTask.mutateAsync({
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      entity_type: 'project',
      entity_id: projectId,
      task_type: 'project',
    });
    setNewTaskTitle('');
    setNewTaskPriority('medium');
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    await updateTask.mutateAsync({
      id: taskId,
      status: currentStatus === 'done' ? 'todo' : 'done',
    });
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Tasks ({pendingTasks.length} pending)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Add */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add a task..."
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(); }}
              className="flex-1"
            />
            <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleQuickAdd} disabled={createTask.isPending || !newTaskTitle.trim()}>
              {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>

          {/* Task List */}
          {tasksLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tasks for this project yet
            </p>
          ) : (
            <div className="space-y-1">
              {pendingTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-accent/30 transition-colors"
                >
                  <button
                    onClick={() => handleToggleTask(task.id, task.status)}
                    disabled={updateTask.isPending}
                    className="shrink-0"
                  >
                    <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </button>
                  <span className="flex-1 text-sm">{task.title}</span>
                  <Badge className={`text-[10px] px-1.5 py-0 ${priorityColor(task.priority)}`}>
                    {task.priority}
                  </Badge>
                  {task.assignee_name && (
                    <span className="text-xs text-muted-foreground">{task.assignee_name}</span>
                  )}
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(task.due_date), 'MMM d')}
                    </span>
                  )}
                </div>
              ))}
              {completedTasks.length > 0 && (
                <div className="pt-2 border-t mt-2">
                  <p className="text-xs text-muted-foreground mb-1">{completedTasks.length} completed</p>
                  {completedTasks.slice(0, 5).map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-2 rounded-lg opacity-60"
                    >
                      <button
                        onClick={() => handleToggleTask(task.id, task.status)}
                        disabled={updateTask.isPending}
                        className="shrink-0"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </button>
                      <span className="flex-1 text-sm line-through">{task.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Phase Tracker */}
      <WorkflowPhaseTracker projectId={projectId} />
    </div>
  );
}
