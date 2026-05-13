import type { Watch, WatchStatus } from '#/types';
import { KanbanCard } from '#/components/watches/KanbanCard';

// Colors chosen to meet WCAG AA (4.5:1) against the paper background (#fcfbf9).
// Light "400" Tailwind variants fail on this light theme — use design-system
// ink/status colors instead.
const COLUMNS: { status: WatchStatus; label: string; color: string }[] = [
  { status: 'acquired', label: 'Acquired', color: 'text-plum' },          // #5a3a5a — 9.5:1
  { status: 'in_progress', label: 'In Progress', color: 'text-[#6d4512]' }, // 8.0:1
  { status: 'paused', label: 'Paused', color: 'text-[#6b5a45]' },          // 5.7:1
  { status: 'listed', label: 'Listed', color: 'text-[#2c4a6b]' },          // #indigo — 9.0:1
  { status: 'sold', label: 'Sold', color: 'text-forest' },                  // #3a5a3a — 6.8:1
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
              {/* text-ink-soft on bg-muted/40 badge: 7.8:1 */}
              <span className="font-mono text-[10px] text-ink-soft bg-muted/40 rounded px-1.5 py-0.5">
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
                // text-ink-soft on paper bg: 8.5:1
                <div className="rounded-lg border border-dashed border-border py-8 flex items-center justify-center">
                  <span className="font-mono text-[10px] text-ink-soft uppercase tracking-widest">
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
