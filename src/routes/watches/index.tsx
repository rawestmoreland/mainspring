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
import { FREE_PROJECT_LIMIT, LocalStorageKeys } from '#/lib/constants';
import type { WatchStatus } from '#/types';
import { useTranslation } from 'react-i18next';
import { useAuth } from '#/hooks/auth';

export const Route = createFileRoute('/watches/')({
  component: WatchesPage,
});

type FilterValue = 'all' | WatchStatus;
type ViewMode = 'board' | 'table';

function WatchesPage() {
  const { t } = useTranslation();
  const FILTERS: [FilterValue, string][] = [
    ['all', t('filterAll')],
    ['in_progress', t('statusInProgress')],
    ['paused', t('statusPaused')],
    ['listed', t('statusListed')],
    ['sold', t('statusSold')],
  ];
  const { profile } = useAuth();
  const { data: watches, isPending } = useWatches();
  const { data: user, isPending: isUserPending } = useUser();
  const { isPro } = useSubscription();
  const [filter, setFilter] = useState<FilterValue>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [selectedWatchId, setSelectedWatchId] = useState<string | null>(null);

  useEffect(() => {
    const getSavedViewMode = async () => {
      const localMode = localStorage.getItem(
        LocalStorageKeys.InventoryViewModeKey,
      ) as ViewMode;
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
    localStorage.setItem(LocalStorageKeys.InventoryViewModeKey, mode);
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
                title={t('boardView')}
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
                title={t('tableView')}
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
                          {t('addWatch')}
                        </Link>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {atProjectLimit && (
                    <TooltipContent>
                      <p className='font-mono text-xs'>
                        {t('freeAccountLimit', { limit: FREE_PROJECT_LIMIT })}
                        <Link
                          to='/pro'
                          className='text-amber-400 hover:underline'
                        >
                          {t('upgradeToPro')}
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
                  <Th>{t('colPhoto_other')}</Th>
                  <Th>{t('colWatch')}</Th>
                  <Th>{t('colYear')}</Th>
                  <Th>{t('colStatus')}</Th>
                  <Th>{t('colCondition')}</Th>
                  <Th>{t('colPaid')}</Th>
                  <Th>{t('colParts')}</Th>
                  <Th>{t('colSoldFor')}</Th>
                  <Th>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className='flex items-center gap-1 cursor-default'>
                          {t('breakdown')}
                          <Info className='size-3 text-muted-foreground' />
                        </TooltipTrigger>
                        <TooltipContent
                          side='top'
                          className='font-mono text-xs'
                        >
                          <div className='flex flex-col gap-1.5 py-0.5'>
                            <div className='flex items-center gap-2'>
                              <span className='inline-block size-2.5 rounded-sm bg-amber-600 shrink-0' />
                              {t('amountPaid')}
                            </div>
                            <div className='flex items-center gap-2'>
                              <span className='inline-block size-2.5 rounded-sm bg-zinc-500 shrink-0' />
                              {t('partsCost')}
                            </div>
                            <div className='flex items-center gap-2'>
                              <span className='inline-block size-2.5 rounded-sm bg-green-400 shrink-0' />
                              {t('colProfit')}
                            </div>
                            <div className='flex items-center gap-2'>
                              <span className='inline-block size-2.5 rounded-sm bg-red-400 shrink-0' />
                              {t('loss')}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Th>
                  <Th>{t('colProfit')}</Th>
                  <Th>{t('colHour_other')}</Th>
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
                                {t('frozen')}
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
                        {fmt({
                          n: w.bought_price,
                          symbol: profile?.currency?.symbol ?? '',
                        })}
                      </Td>
                      <Td className='font-mono text-xs text-muted-foreground'>
                        {fmt({
                          n: w.parts_cost,
                          symbol: profile?.currency?.symbol ?? '',
                        })}
                      </Td>
                      <Td className='font-mono text-xs'>
                        {fmt({
                          n: w.sold_price,
                          symbol: profile?.currency?.symbol ?? '',
                        })}
                      </Td>
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
                        {fmt({
                          n: p,
                          symbol: profile?.currency?.symbol ?? '',
                        })}
                      </Td>
                      <Td className='font-mono text-xs text-muted-foreground'>
                        {/* eslint-disable-next-line i18next/no-literal-string */}
                        {w.hours_spent}h
                      </Td>
                    </TableRow>
                  );
                })}
              </tbody>
            </TableWrap>

            {allWatches.length === 0 && (
              <div className='text-center py-12 text-muted-foreground font-mono text-xs'>
                {t('noWatches')} - {t('addFirstWatch')}
              </div>
            )}
            {allWatches.length > 0 && filtered.length === 0 && (
              <div className='text-center py-12 text-muted-foreground font-mono text-xs'>
                {t('noWatchesMatchFilter')}
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
