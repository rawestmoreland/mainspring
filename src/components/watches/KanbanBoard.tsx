import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';

import { useUpdateWatch } from '#/hooks/watches';
import { cn } from '#/lib/helpers';
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

type DroppableColumnProps = {
  status: WatchStatus;
  label: string;
  color: string;
  cards: Watch[];
  selectedWatchId: string | null;
  onSelectWatch: (id: string) => void;
};

function DroppableColumn({ status, label, color, cards, selectedWatchId, onSelectWatch }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="w-[230px] shrink-0 flex flex-col gap-2">
      <div className="flex items-center justify-between px-1 mb-0.5">
        <span className={`font-mono text-[10px] uppercase tracking-widest ${color}`}>
          {label}
        </span>
        {/* text-ink-soft on bg-muted/40 badge: 7.8:1 */}
        <span className="font-mono text-[10px] text-ink-soft bg-muted/40 rounded px-1.5 py-0.5">
          {cards.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 min-h-[80px] rounded-lg p-1 transition-colors',
          isOver ? 'ring-1 ring-amber-500/30 bg-amber-500/[0.03]' : '',
        )}
      >
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
}

export function KanbanBoard({ watches, selectedWatchId, onSelectWatch }: KanbanBoardProps) {
  const [activeWatchId, setActiveWatchId] = useState<string | null>(null);
  const { mutate: updateWatch } = useUpdateWatch();

  const activeWatch = activeWatchId ? watches.find((w) => w.id === activeWatchId) ?? null : null;

  function handleDragStart({ active }: DragStartEvent) {
    setActiveWatchId(active.id as string);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveWatchId(null);
    if (!over) return;
    const watch = watches.find((w) => w.id === active.id);
    if (!watch || watch.status === over.id) return;
    updateWatch({ ...watch, status: over.id as WatchStatus });
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {COLUMNS.map(({ status, label, color }) => {
          const cards = watches.filter((w) => w.status === status);
          return (
            <DroppableColumn
              key={status}
              status={status}
              label={label}
              color={color}
              cards={cards}
              selectedWatchId={selectedWatchId}
              onSelectWatch={onSelectWatch}
            />
          );
        })}
      </div>
      <DragOverlay>
        {activeWatch ? (
          <div className="scale-[1.02] shadow-lg opacity-95">
            <KanbanCard
              watch={activeWatch}
              isSelected={false}
              onClick={() => {}}
              dragDisabled
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
