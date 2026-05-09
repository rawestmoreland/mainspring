import { cn } from '#/lib/helpers';
import { STATUS_META } from '#/lib/mocks/meta';

export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || {
    label: status,
    className: 'bg-[rgba(60,55,46,0.06)] text-[#9a8b73] border-[rgba(34,26,18,0.14)]',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[10px] tracking-wide border',
        m.className,
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      {m.label}
    </span>
  );
}
