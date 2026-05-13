import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { LayoutGrid, List, PlusIcon } from 'lucide-react';

import { cn, fmt, profit } from '#/lib/helpers';
import { Th, Td, TableRow, TableWrap } from '#/components/table';
import { ThumbStrip } from '#/components/watches/ThumbStrip';
import { CostBar } from '#/components/watches/CostBar';
import { KanbanBoard } from '#/components/watches/KanbanBoard';
import { WatchDetailPanel } from '#/components/watches/WatchDetailPanel';
import { StatusPicker } from '#/components/watches/StatusPicker';
import { Button } from '#/components/ui/button';
import { WatchesListSkeleton } from '#/components/skeletons';
import { useWatches } from '#/hooks/watches';
import { useUser } from '#/hooks/user';
import type { WatchStatus } from '#/types';

export const Route = createFileRoute('/watches/')({
  component: WatchesPage,
});

type FilterValue = 'all' | WatchStatus;
type ViewMode = 'board' | 'table';

const FILTERS: [FilterValue, string][] = [
  ['all', 'All'],
  ['in_progress', 'In Progress'],
  ['paused', 'Paused'],
  ['listed', 'Listed'],
  ['sold', 'Sold'],
];

function WatchesPage() {
  const { data: watches, isPending } = useWatches();
  const { data: user, isPending: isUserPending } = useUser();
  const [filter, setFilter] = useState<FilterValue>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [selectedWatchId, setSelectedWatchId] = useState<string | null>(null);

  if (isPending || isUserPending) {
    return <WatchesListSkeleton />;
  }

  const allWatches = watches ?? [];
  const filtered =
    filter === 'all'
      ? allWatches
      : allWatches.filter((w) => w.status === filter);

  const selectedWatch = selectedWatchId
    ? (allWatches.find((w) => w.id === selectedWatchId) ?? null)
    : null;

  const handleSelectWatch = (id: string) => {
    setSelectedWatchId((prev) => (prev === id ? null : id));
  };

  return (
    <>
      <div>
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 mb-5">
          {viewMode === 'table' &&
            FILTERS.map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-mono rounded tracking-wide transition-all cursor-pointer border-none',
                  filter === v
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 bg-transparent',
                )}
              >
                {l}
              </button>
            ))}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center rounded-md border border-border bg-muted/30 p-0.5">
              <button
                onClick={() => {
                  setViewMode('board');
                  setSelectedWatchId(null);
                }}
                className={cn(
                  'p-1.5 rounded transition-colors cursor-pointer border-none',
                  viewMode === 'board'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground bg-transparent',
                )}
                title="Board view"
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'p-1.5 rounded transition-colors cursor-pointer border-none',
                  viewMode === 'table'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground bg-transparent',
                )}
                title="Table view"
              >
                <List className="size-3.5" />
              </button>
            </div>
            {user && (
              <Button asChild>
                <Link to="/watches/new">
                  <PlusIcon className="size-3" />
                  Add Watch
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Board view */}
        {viewMode === 'board' && (
          <KanbanBoard
            watches={allWatches}
            selectedWatchId={selectedWatchId}
            onSelectWatch={handleSelectWatch}
          />
        )}

        {/* Table view */}
        {viewMode === 'table' && (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Photos</Th>
                  <Th>Watch</Th>
                  <Th>Year</Th>
                  <Th>Status</Th>
                  <Th>Condition</Th>
                  <Th>Paid</Th>
                  <Th>Parts</Th>
                  <Th>Sold For</Th>
                  <Th>Breakdown</Th>
                  <Th>Profit</Th>
                  <Th>Hours</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => {
                  const p = profit(w);
                  return (
                    <TableRow key={w.id}>
                      <Td>
                        <button
                          onClick={() => handleSelectWatch(w.id)}
                          className="inline-block bg-transparent border-none p-0 cursor-pointer"
                        >
                          <ThumbStrip photos={w.photos} />
                        </button>
                      </Td>
                      <Td>
                        <button
                          onClick={() => handleSelectWatch(w.id)}
                          className="block text-left bg-transparent border-none p-0 cursor-pointer"
                        >
                          <div className="font-medium text-foreground">
                            {w.make} {w.model}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground mt-0.5">
                            {w.reference}
                          </div>
                        </button>
                      </Td>
                      <Td className="font-mono text-xs text-muted-foreground">
                        {w.year}
                      </Td>
                      <Td>
                        <StatusPicker watch={w} />
                      </Td>
                      <Td className="text-xs text-muted-foreground capitalize">
                        {w.condition_bought.replace('_', ' ')}
                      </Td>
                      <Td className="font-mono text-xs">{fmt(w.bought_price)}</Td>
                      <Td className="font-mono text-xs text-muted-foreground">
                        {fmt(w.parts_cost)}
                      </Td>
                      <Td className="font-mono text-xs">{fmt(w.sold_price)}</Td>
                      <Td>
                        <CostBar watch={w} />
                      </Td>
                      <Td
                        className={cn(
                          'font-mono text-xs',
                          p === null
                            ? ''
                            : p >= 0
                              ? 'text-green-400'
                              : 'text-red-400',
                        )}
                      >
                        {fmt(p)}
                      </Td>
                      <Td className="font-mono text-xs text-muted-foreground">
                        {w.hours_spent}h
                      </Td>
                    </TableRow>
                  );
                })}
              </tbody>
            </TableWrap>

            {allWatches.length === 0 && (
              <div className="text-center py-12 text-muted-foreground font-mono text-xs">
                No watches yet — add your first one.
              </div>
            )}
            {allWatches.length > 0 && filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground font-mono text-xs">
                No watches match this filter.
              </div>
            )}
          </>
        )}
      </div>

      <WatchDetailPanel
        watch={selectedWatch}
        open={!!selectedWatch}
        onClose={() => setSelectedWatchId(null)}
      />
    </>
  );
}
