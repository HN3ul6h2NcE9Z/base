import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUSES = ['New', 'Pending', 'In Progress', 'Closed'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function ProjectForm({ project, onSubmit, onCancel, isLoading }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'New',
    priority: project?.priority || 'Medium',
    start_date: project?.start_date ? project.start_date.slice(0, 16) : '',
    end_date: project?.end_date ? project.end_date.slice(0, 16) : '',
    owner: project?.owner || '',
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    await fetch('/api/send-invite', {
      method: 'POST',
    });

    onSubmit?.(); // optional success callback
  } catch (err) {
    console.error('Email send failed', err);
  }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Project Name *</Label>
        <Input id="name" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Network Infrastructure Upgrade" />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the project..." rows={3} />
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Start Date & Time</Label>
          <Input id="start_date" type="datetime-local" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="end_date">End Date & Time</Label>
          <Input id="end_date" type="datetime-local" value={form.end_date} onChange={e => set('end_date', e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="owner">Owner (email)</Label>
        <Input id="owner" type="email" value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="owner@company.com" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}</Button>
      </div>
    </form>
  );
}