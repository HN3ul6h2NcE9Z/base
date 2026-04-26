import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInHours, differenceInDays, format, isValid } from 'date-fns';
import { FolderKanban, CheckSquare, Clock, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/StatusBadge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const STATUS_COLORS = {
  New: '#3b82f6',
  Pending: '#f59e0b',
  'In Progress': '#8b5cf6',
  Closed: '#10b981',
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDuration(hours) {
  if (!hours || hours <= 0) return 'N/A';
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

export default function Dashboard() {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  // Tasks per user
  const tasksPerUser = users
    .map(u => ({
      name: u.full_name || u.email,
      email: u.email,
      total: tasks.filter(t => t.assigned_to === u.email).length,
      open: tasks.filter(t => t.assigned_to === u.email && t.status !== 'Closed').length,
    }))
    .filter(u => u.total > 0)
    .sort((a, b) => b.total - a.total);

  const unassigned = tasks.filter(t => !t.assigned_to).length;

  const closedProjects = projects.filter(p => p.status === 'Closed' && p.start_date && p.closed_date);
  const avgCloseTimeProjHours = closedProjects.length
    ? closedProjects.reduce((sum, p) => sum + differenceInHours(new Date(p.closed_date), new Date(p.start_date)), 0) / closedProjects.length
    : null;

  const closedTasks = tasks.filter(t => t.status === 'Closed' && t.start_date && t.closed_date);
  const avgCloseTimeTaskHours = closedTasks.length
    ? closedTasks.reduce((sum, t) => sum + differenceInHours(new Date(t.closed_date), new Date(t.start_date)), 0) / closedTasks.length
    : null;

  const overdueProjects = projects.filter(p => p.end_date && p.status !== 'Closed' && new Date(p.end_date) < new Date());
  const overdueTasks = tasks.filter(t => t.end_date && t.status !== 'Closed' && new Date(t.end_date) < new Date());

  // Project status distribution
  const projectStatusData = ['New', 'Pending', 'In Progress', 'Closed'].map(s => ({
    name: s,
    value: projects.filter(p => p.status === s).length,
  })).filter(d => d.value > 0);

  // Tasks per status
  const taskStatusData = ['New', 'Pending', 'In Progress', 'Closed'].map(s => ({
    status: s,
    count: tasks.filter(t => t.status === s).length,
  }));

  // Recent projects
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of Scojet IT projects</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Total Projects" value={projects.length} sub={`${projects.filter(p => p.status === 'In Progress').length} in progress`} color="bg-blue-500" />
        <StatCard icon={CheckSquare} label="Total Tasks" value={tasks.length} sub={`${tasks.filter(t => t.status === 'Closed').length} closed`} color="bg-violet-500" />
        <StatCard icon={Clock} label="Avg Project Lifetime" value={avgCloseTimeProjHours ? formatDuration(avgCloseTimeProjHours) : 'N/A'} sub="from start to close" color="bg-emerald-500" />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdueProjects.length + overdueTasks.length} sub={`${overdueProjects.length} projects · ${overdueTasks.length} tasks`} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task status bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={taskStatusData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {taskStatusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project status pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projects by Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {projectStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                    {projectStatusData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No projects yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Avg time to close tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Time Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-4 bg-muted/40 rounded-xl">
              <p className="text-xs text-muted-foreground">Avg. Project Lifetime</p>
              <p className="text-2xl font-bold mt-1">{avgCloseTimeProjHours ? formatDuration(avgCloseTimeProjHours) : '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">{closedProjects.length} closed project(s)</p>
            </div>
            <div className="p-4 bg-muted/40 rounded-xl">
              <p className="text-xs text-muted-foreground">Avg. Task Time to Close</p>
              <p className="text-2xl font-bold mt-1">{avgCloseTimeTaskHours ? formatDuration(avgCloseTimeTaskHours) : '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">{closedTasks.length} closed task(s)</p>
            </div>
            <div className="p-4 bg-muted/40 rounded-xl">
              <p className="text-xs text-muted-foreground">Overdue Items</p>
              <p className="text-2xl font-bold mt-1 text-amber-600">{overdueProjects.length + overdueTasks.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{overdueProjects.length} projects · {overdueTasks.length} tasks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks per user */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Tasks by Assignee</CardTitle>
        </CardHeader>
        <CardContent>
          {tasksPerUser.length === 0 && unassigned === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No assigned tasks yet.</p>
          ) : (
            <div className="space-y-3">
              {tasksPerUser.map(u => (
                <div key={u.email} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{u.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">{u.open} open · {u.total} total</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.round((u.total / tasks.length) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {unassigned > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-muted-foreground">?</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-muted-foreground">Unassigned</p>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">{unassigned} total</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: `${Math.round((unassigned / tasks.length) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent projects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No projects yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentProjects.map(p => (
                <div key={p.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    {p.start_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Started {format(new Date(p.start_date), 'MMM d, yyyy')}
                        {p.end_date ? ` · Due ${format(new Date(p.end_date), 'MMM d, yyyy')}` : ''}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}