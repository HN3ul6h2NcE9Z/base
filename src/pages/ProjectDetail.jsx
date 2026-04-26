import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, List, LayoutGrid, ArrowLeft, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';
import TaskForm from '@/components/tasks/TaskForm';
import TaskListView from '@/components/tasks/TaskListView';
import TaskKanbanView from '@/components/tasks/TaskKanbanView';
import { format } from 'date-fns';
import { differenceInHours } from 'date-fns';

function formatDuration(hours) {
  if (!hours || hours <= 0) return null;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [view, setView] = useState('list');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const { data: project, isLoading: projLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => base44.entities.Project.filter({ id }),
    select: data => data[0],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', id],
    queryFn: () => base44.entities.Task.filter({ project_id: id }),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const sendTaskNotification = async (data, isNew, oldAssignedTo = null) => {
    if (!data.assigned_to) return;
    if (!isNew && data.assigned_to === oldAssignedTo) return;
    await base44.functions.invoke('onTaskAssigned', {
      taskTitle: data.title,
      assignedTo: data.assigned_to,
      projectName: project?.name,
      priority: data.priority,
      startDate: data.start_date,
      endDate: data.end_date,
      isNew,
    });
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks', id] });
      setDialogOpen(false);
      sendTaskNotification(variables, true);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, data }) => base44.entities.Task.update(taskId, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks', id] });
      setDialogOpen(false);
      sendTaskNotification(variables.data, false, editingTask?.assigned_to);
      setEditingTask(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId) => base44.entities.Task.delete(taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', id] }),
  });

  const handleSubmit = (data) => {
    if (editingTask) {
      updateMutation.mutate({ taskId: editingTask.id, data });
    } else {
      createMutation.mutate({ ...data, project_id: id });
    }
  };

  const openEdit = (task) => { setEditingTask(task); setDialogOpen(true); };
  const openCreate = () => { setEditingTask(null); setDialogOpen(true); };

  if (projLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return <div className="p-6 text-muted-foreground">Project not found.</div>;
  }

  const lifetime = project.start_date && project.end_date
    ? formatDuration(differenceInHours(new Date(project.end_date), new Date(project.start_date)))
    : null;

  const closedCount = tasks.filter(t => t.status === 'Closed').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/projects" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{project.name}</h1>
          {project.description && <p className="text-muted-foreground text-sm mt-0.5">{project.description}</p>}
        </div>
      </div>

      {/* Project meta */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap gap-6 items-start">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
            </div>
            {(project.start_date || project.end_date) && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 shrink-0" />
                {project.start_date && format(new Date(project.start_date), 'MMM d, yyyy HH:mm')}
                {project.start_date && project.end_date && ' → '}
                {project.end_date && format(new Date(project.end_date), 'MMM d, yyyy HH:mm')}
                {lifetime && <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">{lifetime}</span>}
              </div>
            )}
            {project.owner && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="w-4 h-4" />{project.owner}
              </div>
            )}
            <div className="ml-auto text-sm text-muted-foreground">
              {tasks.length} tasks · {closedCount} closed
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
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
          <Button onClick={openCreate} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />Add Task
          </Button>
        </div>
      </div>

      {/* Tasks */}
      {tasksLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : view === 'list' ? (
        <Card>
          <CardContent className="p-4">
            <TaskListView tasks={tasks} users={users} onEdit={openEdit} onDelete={(taskId) => deleteMutation.mutate(taskId)} />
          </CardContent>
        </Card>
      ) : (
        <TaskKanbanView tasks={tasks} users={users} onEdit={openEdit} onDelete={(taskId) => deleteMutation.mutate(taskId)} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>
          <TaskForm
            task={editingTask}
            projectId={id}
            users={users}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}