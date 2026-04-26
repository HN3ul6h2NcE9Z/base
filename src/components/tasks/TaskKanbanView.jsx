import { format } from 'date-fns';
import { Pencil, Trash2, User, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PriorityBadge from '@/components/PriorityBadge';

const COLUMNS = ['New', 'Pending', 'In Progress', 'Closed'];

const colStyles = {
  New: 'bg-blue-50 border-blue-200',
  Pending: 'bg-amber-50 border-amber-200',
  'In Progress': 'bg-violet-50 border-violet-200',
  Closed: 'bg-emerald-50 border-emerald-200',
};

const headerStyles = {
  New: 'text-blue-700 bg-blue-100',
  Pending: 'text-amber-700 bg-amber-100',
  'In Progress': 'text-violet-700 bg-violet-100',
  Closed: 'text-emerald-700 bg-emerald-100',
};

export default function TaskKanbanView({ tasks, users, onEdit, onDelete }) {
  const getUserName = (email) => {
    const u = users?.find(u => u.email === email);
    return u ? (u.full_name || u.email) : email;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col);
        return (
          <div key={col} className={`rounded-xl border p-3 ${colStyles[col]}`}>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-3 ${headerStyles[col]}`}>
              {col}
              <span className="ml-1 bg-white/70 px-1.5 py-0.5 rounded-full text-xs">{colTasks.length}</span>
            </div>
            <div className="space-y-2">
              {colTasks.map(task => (
                <Card key={task.id} className="p-3 bg-white shadow-sm border-0 group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground leading-snug flex-1">{task.title}</p>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(task)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => onDelete(task.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                  )}
                  <div className="mt-2 space-y-1">
                    <PriorityBadge priority={task.priority} />
                    {task.assigned_to && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <User className="w-3 h-3" />{getUserName(task.assigned_to)}
                      </div>
                    )}
                    {task.end_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />{format(new Date(task.end_date), 'MMM d, HH:mm')}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
              {colTasks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4 opacity-60">No tasks</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}