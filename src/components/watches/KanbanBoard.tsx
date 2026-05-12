import type { Watch, WatchStatus } from '#/types';
import { KanbanCard } from '#/components/watches/KanbanCard';

const COLUMNS: { status: WatchStatus; label: string; color: string }[] = [
  { status: 'acquired', label: 'Acquired', color: 'text-violet-400/70' },
  { status: 'in_progress', label: 'In Progress', color: 'text-amber-400/70' },
  { status: 'paused', label: 'Paused', color: 'text-zinc-400/60' },
  { status: 'listed', label: 'Listed', color: 'text-blue-400/70' },
  { status: 'sold', label: 'Sold', color: 'text-green-400/70' },
];

type KanbanBoardProps = {
  watches: Watch[];
  selectedWatchId: string | null;
  onSelectWatch: (id: string) => void;
};

export function KanbanBoard({
  watches,
  selectedWatchId,
  onSelectWatch,
}: KanbanBoardProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {COLUMNS.map(({ status, label, color }) => {
        const cards = watches.filter((w) => w.status === status);
        return (
          <div key={status} className="w-[230px] shrink-0 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1 mb-0.5">
              <span
                className={`font-mono text-[10px] uppercase tracking-widest ${color}`}
              >
                {label}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground/50 bg-muted/40 rounded px-1.5 py-0.5">
                {cards.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {cards.map((w) => (
                <KanbanCard
                  key={w.id}
                  watch={w}
                  isSelected={selectedWatchId === w.id}
                  onClick={() => onSelectWatch(w.id)}
                />
              ))}
              {cards.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/40 py-8 flex items-center justify-center">
                  <span className="font-mono text-[9px] text-muted-foreground/25 uppercase tracking-widest">
                    Empty
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
