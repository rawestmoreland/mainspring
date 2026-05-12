import { cn, fmt, profit } from '#/lib/helpers';
import type { Watch } from '#/types';

type KanbanCardProps = {
  watch: Watch;
  isSelected: boolean;
  onClick: () => void;
};

export function KanbanCard({ watch, isSelected, onClick }: KanbanCardProps) {
  const p = profit(watch);
  const firstPhoto = watch.photos?.[0];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border bg-card p-3 transition-all cursor-pointer block',
        isSelected
          ? 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20'
          : 'border-border hover:border-border/80 hover:bg-white/3',
      )}
    >
      {firstPhoto ? (
        <img
          src={firstPhoto.image}
          alt=""
          className="w-full aspect-video rounded-md object-cover mb-2.5 border border-border"
        />
      ) : (
        <div className="w-full aspect-video rounded-md bg-zinc-900 border border-dashed border-border mb-2.5 flex items-center justify-center">
          <span className="font-mono text-[9px] text-muted-foreground/30 uppercase tracking-widest">
            No photo
          </span>
        </div>
      )}
      <div className="font-medium text-sm text-foreground leading-tight">
        {watch.make} {watch.model}
      </div>
      <div className="font-mono text-[10px] text-muted-foreground mt-0.5 truncate">
        {watch.reference} · {watch.year}
      </div>
      <div className="flex items-center justify-between mt-2.5 gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">
          {fmt(watch.bought_price)}
        </span>
        {p !== null && (
          <span
            className={cn(
              'font-mono text-[11px] font-medium',
              p >= 0 ? 'text-green-400' : 'text-red-400',
            )}
          >
            {p >= 0 ? '+' : ''}
            {fmt(p)}
          </span>
        )}
      </div>
    </button>
  );
}
