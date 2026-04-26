import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';

export default function InviteUserDialog({ open, onOpenChange }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Invite the user (platform registration email)
      await base44.users.inviteUser(form.email, form.role);

      // Send custom branded invite email via Resend
      await base44.functions.invoke('sendInviteEmail', {
        firstName: form.first_name,
        lastName: form.last_name,
        email: form.email,
        role: form.role,
      });

      // Find the created user record and update with name fields
      const users = await base44.entities.User.list();
      const match = users.find(u => u.email === form.email);
      if (match) {
        await base44.entities.User.update(match.id, {
          first_name: form.first_name,
          last_name: form.last_name,
        });
      }

      qc.invalidateQueries({ queryKey: ['users'] });
      setForm({ first_name: '', last_name: '', email: '', role: 'user' });
      onOpenChange(false);
    } catch (err) {
      setError(err.message || 'Failed to invite user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Jane" required />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Doe" required />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@company.com" required />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={form.role} onValueChange={v => set('role', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Inviting...' : 'Send Invite'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}