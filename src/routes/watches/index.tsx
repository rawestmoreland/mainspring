import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Info, LayoutGrid, List, LockIcon, PlusIcon } from 'lucide-react';

import { cn, fmt, profit } from '#/lib/helpers';
import { Th, Td, TableRow, TableWrap } from '#/components/table';
import { ThumbStrip } from '#/components/watches/ThumbStrip';
import { CostBar } from '#/components/watches/CostBar';
import { KanbanBoard } from '#/components/watches/KanbanBoard';
import { WatchDetailPanel } from '#/components/watches/WatchDetailPanel';
import { StatusPicker } from '#/components/watches/StatusPicker';
import { Button } from '#/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip';
import { WatchesListSkeleton } from '#/components/skeletons';
import { useWatches } from '#/hooks/watches';
import { useUser } from '#/hooks/user';
import { useSubscription } from '#/hooks/subscription';
import { FREE_PROJECT_LIMIT } from '#/lib/constants';
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
  const { isPro } = useSubscription();
  const [filter, setFilter] = useState<FilterValue>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [selectedWatchId, setSelectedWatchId] = useState<string | null>(null);

  useEffect(() => {
    const getSavedViewMode = async () => {
      const localMode = localStorage.getItem('hairspring-viewmode') as ViewMode;
      if (localMode) setViewMode(localMode);
    };
    getSavedViewMode();
  }, []);

  if (isPending || isUserPending) {
    return <WatchesListSkeleton />;
  }

  const allWatches = watches ?? [];
  const activeCount = allWatches.filter((w) => w.status !== 'sold').length;
  const atProjectLimit = !isPro && activeCount >= FREE_PROJECT_LIMIT;
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

  const handleChangeViewMode = async (mode: ViewMode) => {
    localStorage.setItem('hairspring-viewmode', mode);
    setViewMode(mode);
  };

  return (
    <>
      <div>
        {/* Toolbar */}
        <div className='flex items-center gap-0.5 mb-5'>
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
          <div className='ml-auto flex items-center gap-2'>
            <div className='flex items-center rounded-md border border-border bg-muted/30 p-0.5'>
              <button
                onClick={() => {
                  handleChangeViewMode('board');
                  setSelectedWatchId(null);
                }}
                className={cn(
                  'p-1.5 rounded transition-colors cursor-pointer border-none',
                  viewMode === 'board'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground bg-transparent',
                )}
                title='Board view'
              >
                <LayoutGrid className='size-3.5' />
              </button>
              <button
                onClick={() => {
                  handleChangeViewMode('table');
                }}
                className={cn(
                  'p-1.5 rounded transition-colors cursor-pointer border-none',
                  viewMode === 'table'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground bg-transparent',
                )}
                title='Table view'
              >
                <List className='size-3.5' />
              </button>
            </div>
            {user && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button asChild disabled={atProjectLimit}>
                        <Link to='/watches/new'>
                          <PlusIcon className='size-3' />
                          Add Watch
                        </Link>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {atProjectLimit && (
                    <TooltipContent>
                      <p className='font-mono text-xs'>
                        Free accounts are limited to {FREE_PROJECT_LIMIT} active projects.{' '}
                        <Link to='/pro' className='text-amber-400 hover:underline'>
                          Upgrade to Pro
                        </Link>
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
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
                  <Th>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className='flex items-center gap-1 cursor-default'>
                          Breakdown
                          <Info className='size-3 text-muted-foreground' />
                        </TooltipTrigger>
                        <TooltipContent
                          side='top'
                          className='font-mono text-xs'
                        >
                          <div className='flex flex-col gap-1.5 py-0.5'>
                            <div className='flex items-center gap-2'>
                              <span className='inline-block size-2.5 rounded-sm bg-amber-600 shrink-0' />
                              Amount paid
                            </div>
                            <div className='flex items-center gap-2'>
                              <span className='inline-block size-2.5 rounded-sm bg-zinc-500 shrink-0' />
                              Parts cost
                            </div>
                            <div className='flex items-center gap-2'>
                              <span className='inline-block size-2.5 rounded-sm bg-green-400 shrink-0' />
                              Profit
                            </div>
                            <div className='flex items-center gap-2'>
                              <span className='inline-block size-2.5 rounded-sm bg-red-400 shrink-0' />
                              Loss
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Th>
                  <Th>Profit</Th>
                  <Th>Hours</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => {
                  const p = profit(w);
                  const frozen = !!w.is_frozen && !isPro;
                  return (
                    <TableRow key={w.id}>
                      <Td>
                        <button
                          onClick={() => handleSelectWatch(w.id)}
                          className='inline-block bg-transparent border-none p-0 cursor-pointer'
                        >
                          <ThumbStrip photos={w.photos} />
                        </button>
                      </Td>
                      <Td>
                        <button
                          onClick={() => handleSelectWatch(w.id)}
                          className='block text-left bg-transparent border-none p-0 cursor-pointer'
                        >
                          <div className='flex items-center gap-1.5 font-medium text-foreground'>
                            {w.make} {w.model}
                            {frozen && (
                              <span className='inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-400'>
                                <LockIcon className='size-2' />
                                Frozen
                              </span>
                            )}
                          </div>
                          <div className='font-mono text-[11px] text-muted-foreground mt-0.5'>
                            {w.reference}
                          </div>
                        </button>
                      </Td>
                      <Td className='font-mono text-xs text-muted-foreground'>
                        {w.year}
                      </Td>
                      <Td>
                        <StatusPicker watch={w} disabled={frozen} />
                      </Td>
                      <Td className='text-xs text-muted-foreground capitalize'>
                        {w.condition_bought.replace('_', ' ')}
                      </Td>
                      <Td className='font-mono text-xs'>
                        {fmt(w.bought_price)}
                      </Td>
                      <Td className='font-mono text-xs text-muted-foreground'>
                        {fmt(w.parts_cost)}
                      </Td>
                      <Td className='font-mono text-xs'>{fmt(w.sold_price)}</Td>
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
                      <Td className='font-mono text-xs text-muted-foreground'>
                        {w.hours_spent}h
                      </Td>
                    </TableRow>
                  );
                })}
              </tbody>
            </TableWrap>

            {allWatches.length === 0 && (
              <div className='text-center py-12 text-muted-foreground font-mono text-xs'>
                No watches yet — add your first one.
              </div>
            )}
            {allWatches.length > 0 && filtered.length === 0 && (
              <div className='text-center py-12 text-muted-foreground font-mono text-xs'>
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
