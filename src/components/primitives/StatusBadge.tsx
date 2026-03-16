import { cn } from '#/lib/helpers';
import { STATUS_META } from '#/lib/mocks/meta';

export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || {
    label: status,
    className: 'bg-zinc-500/10 text-zinc-400',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-medium tracking-wide',
        m.className,
      )}
    >
      {m.label}
    </span>
  );
}
