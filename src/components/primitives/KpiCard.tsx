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
        'bg-[var(--paper-bright)] border border-border rounded-md p-4 relative overflow-hidden shadow-[var(--shadow-card,0_1px_2px_rgba(76,52,28,0.08),0_8px_16px_-8px_rgba(76,52,28,0.10))]',
        highlight && 'before:absolute before:left-3.5 before:right-3.5 before:top-0 before:h-0.5 before:bg-brass before:rounded-b-sm',
      )}
    >
      <div className="font-mono text-[9.5px] uppercase tracking-widest text-ink-faded mb-2">
        {label}
      </div>
      <div className={cn('font-serif text-3xl font-bold leading-none tracking-tight', valueClass ?? 'text-ink')}>
        {value}
      </div>
      {sub && (
        <div className="font-sans italic text-[11px] text-ink-soft mt-1.5">{sub}</div>
      )}
    </div>
  );
}
