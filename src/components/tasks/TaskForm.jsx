import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUSES = ['New', 'Pending', 'In Progress', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function TaskForm({ task, projectId, users, onSubmit, onCancel, isLoading }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    project_id: task?.project_id || projectId || '',
    status: task?.status || 'New',
    priority: task?.priority || 'Medium',
    assigned_to: task?.assigned_to || '',
    start_date: task?.start_date ? task.start_date.slice(0, 16) : '',
    end_date: task?.end_date ? task.end_date.slice(0, 16) : '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form };
    if (data.start_date) data.start_date = new Date(data.start_date).toISOString();
    else delete data.start_date;
    if (data.end_date) data.end_date = new Date(data.end_date).toISOString();
    else delete data.end_date;

    // Auto-set closed_date when status is Closed
    if (data.status === 'Closed' && !task?.closed_date) {
      data.closed_date = new Date().toISOString();
    } else if (data.status !== 'Closed') {
      data.closed_date = null;
    }

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Task Title *</Label>
        <Input id="title" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Configure firewall rules" />
      </div>
      <div>
        <Label htmlFor="desc">Description</Label>
        <Textarea id="desc" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the task..." rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => set('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Priority</Label>
          <Select value={form.priority} onValueChange={v => set('priority', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Assign To</Label>
        <Select value={form.assigned_to} onValueChange={v => set('assigned_to', v)}>
          <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Unassigned</SelectItem>
            {users?.map(u => <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="task_start">Start Date & Time</Label>
          <Input id="task_start" type="datetime-local" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="task_end">End Date & Time</Label>
          <Input id="task_end" type="datetime-local" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}</Button>
      </div>
    </form>
  );
}