import { cn } from '@/lib/utils';

const config = {
  New: 'bg-blue-100 text-blue-700 border-blue-200',
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  'In Progress': 'bg-violet-100 text-violet-700 border-violet-200',
  Closed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function StatusBadge({ status, className }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      config[status] || 'bg-gray-100 text-gray-700 border-gray-200',
      className
    )}>
      {status}
    </span>
  );
}