import { cn } from '@/lib/utils';

const config = {
  Low: 'bg-slate-100 text-slate-600 border-slate-200',
  Medium: 'bg-sky-100 text-sky-700 border-sky-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
  Critical: 'bg-red-100 text-red-700 border-red-200',
};

export default function PriorityBadge({ priority, className }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      config[priority] || 'bg-gray-100 text-gray-700 border-gray-200',
      className
    )}>
      {priority}
    </span>
  );
}