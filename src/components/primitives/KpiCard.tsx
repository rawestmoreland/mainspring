import { cn } from '#/lib/helpers';

type KpiCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
  valueClass?: string;
};

export function KpiCard({ label, value, sub, highlight, valueClass }: KpiCardProps) {
  return (
    <div
      className={cn(
        'bg-zinc-900 border border-zinc-800 rounded p-4 relative overflow-hidden',
        'before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-amber-500',
        highlight ? 'before:opacity-100' : 'before:opacity-40',
      )}
    >
      <div className="font-mono text-[9.5px] uppercase tracking-widest text-zinc-500 mb-2">
        {label}
      </div>
      <div className={cn('font-mono text-2xl font-medium leading-none', valueClass ?? 'text-zinc-100')}>
        {value}
      </div>
      {sub && (
        <div className="font-mono text-[10px] text-zinc-500 mt-1.5">{sub}</div>
      )}
    </div>
  );
}
