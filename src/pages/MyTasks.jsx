import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckSquare, List, LayoutGrid } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TaskForm from '@/components/tasks/TaskForm';
import TaskListView from '@/components/tasks/TaskListView';
import TaskKanbanView from '@/components/tasks/TaskKanbanView';

const STATUSES = ['All', 'New', 'Pending', 'In Progress', 'Closed'];

export default function MyTasks() {
  const qc = useQueryClient();
  const [view, setView] = useState('list');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date'),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const sendTaskNotification = async (data, oldAssignedTo) => {
    if (!data.assigned_to) return;
    if (data.assigned_to === oldAssignedTo) return;
    await base44.functions.invoke('onTaskAssigned', {
      taskTitle: data.title,
      assignedTo: data.assigned_to,
      priority: data.priority,
      startDate: data.start_date,
      endDate: data.end_date,
      isNew: false,
    });
  };

  const updateMutation = useMutation({
    mutationFn: ({ taskId, data }) => base44.entities.Task.update(taskId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      setDialogOpen(false);
      sendTaskNotification(variables.data, editingTask?.assigned_to);
      setEditingTask(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId) => base44.entities.Task.delete(taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const openEdit = (task) => { setEditingTask(task); setDialogOpen(true); };

  const filtered = tasks.filter(t => statusFilter === 'All' || t.status === statusFilter);

  const getProjectName = (pid) => projects.find(p => p.id === pid)?.name || 'Unknown';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Tasks</h1>
        <p className="text-muted-foreground text-sm mt-1">{tasks.length} total task(s) across all projects</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex items-center border border-border rounded-lg overflow-hidden ml-auto">
          <button
            onClick={() => setView('list')}
            className={`p-2 transition-colors ${view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`p-2 transition-colors ${view === 'kanban' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No tasks found</p>
        </div>
      ) : view === 'list' ? (
        <Card>
          <CardContent className="p-4">
            <TaskListView
              tasks={filtered}
              users={users}
              onEdit={openEdit}
              onDelete={(taskId) => deleteMutation.mutate(taskId)}
            />
          </CardContent>
        </Card>
      ) : (
        <TaskKanbanView
          tasks={filtered}
          users={users}
          onEdit={openEdit}
          onDelete={(taskId) => deleteMutation.mutate(taskId)}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <TaskForm
              task={editingTask}
              users={users}
              onSubmit={(data) => updateMutation.mutate({ taskId: editingTask.id, data })}
              onCancel={() => setDialogOpen(false)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}