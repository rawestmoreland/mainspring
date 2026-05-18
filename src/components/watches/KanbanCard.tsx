import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { cn, fmt, profit } from '#/lib/helpers';
import type { Watch } from '#/types';

type KanbanCardProps = {
  watch: Watch;
  isSelected: boolean;
  onClick: () => void;
  dragDisabled?: boolean;
};

export function KanbanCard({ watch, isSelected, onClick, dragDisabled }: KanbanCardProps) {
  const p = profit(watch);
  const cardImage = watch.featured_image_url ?? watch.photos?.[0]?.image;
  const frozen = !!watch.is_frozen;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: watch.id,
    disabled: dragDisabled || frozen,
  });

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      style={{ transform: CSS.Transform.toString(transform) }}
      {...listeners}
      {...attributes}
      className={cn(
        'relative w-full text-left rounded-lg border bg-card p-3 transition-all block',
        frozen ? 'cursor-default opacity-60' : 'cursor-pointer',
        isDragging ? 'opacity-30' : '',
        isSelected
          ? 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20'
          : 'border-border hover:border-border hover:bg-black/[0.04]',
      )}
    >
      {frozen && (
        <div className="absolute inset-0 rounded-lg z-10 flex items-start justify-end p-1.5 pointer-events-none">
          <span className="font-mono text-[9px] uppercase tracking-widest bg-amber-500/15 text-amber-400 rounded px-1.5 py-0.5 flex items-center gap-1">
            <svg width="8" height="8" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M11.5 8h-1V5.5a2.5 2.5 0 0 0-5 0V8h-1A1.5 1.5 0 0 0 3 9.5v4A1.5 1.5 0 0 0 4.5 15h7A1.5 1.5 0 0 0 13 13.5v-4A1.5 1.5 0 0 0 11.5 8zM6 5.5a2 2 0 1 1 4 0V8H6V5.5z"/>
            </svg>
            Frozen
          </span>
        </div>
      )}
      {cardImage ? (
        <img
          src={cardImage}
          alt=""
          className="w-full aspect-video rounded-md object-cover mb-2.5 border border-border"
        />
      ) : (
        <div className="w-full aspect-video rounded-md bg-zinc-900 border border-dashed border-border mb-2.5 flex items-center justify-center">
          {/* text-muted-foreground at full opacity on zinc-900: 5.6:1 */}
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
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
              p >= 0 ? 'text-forest' : 'text-wax',
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
