import { format } from 'date-fns';
import { Pencil, Trash2, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import PriorityBadge from '@/components/PriorityBadge';

export default function TaskListView({ tasks, users, onEdit, onDelete }) {
  const getUserName = (email) => {
    const u = users?.find(u => u.email === email);
    return u ? (u.full_name || u.email) : email;
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">No tasks yet. Add your first task above.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {tasks.map(task => (
        <div key={task.id} className="flex items-start gap-4 py-4 px-1 hover:bg-muted/30 transition-colors rounded-lg group">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-foreground">{task.title}</span>
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              {task.assigned_to && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />{getUserName(task.assigned_to)}
                </span>
              )}
              {task.start_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />Start: {format(new Date(task.start_date), 'MMM d, yyyy HH:mm')}
                </span>
              )}
              {task.end_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />Due: {format(new Date(task.end_date), 'MMM d, yyyy HH:mm')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(task)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(task.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}