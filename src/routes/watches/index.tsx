import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { cn, fmt, profit } from '#/lib/helpers';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { Th, Td, TableRow, TableWrap } from '#/components/table';
import { ThumbStrip } from '#/components/watches/ThumbStrip';
import type { WatchStatus } from '#/types';
import { useWatches } from '#/hooks/watches';

export const Route = createFileRoute('/watches/')({ component: WatchesPage });

type FilterValue = 'all' | WatchStatus;
const FILTERS: [FilterValue, string][] = [
  ['all', 'All'],
  ['in_progress', 'In Progress'],
  ['listed', 'Listed'],
  ['sold', 'Sold'],
];

function WatchesPage() {
  const { data: watches, isLoading } = useWatches();
  const [filter, setFilter] = useState<FilterValue>('all');

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!watches) {
    return <div>No watches found</div>;
  }

  const filtered =
    filter === 'all' ? watches : watches.filter((w) => w.status === filter);

  return (
    <>
      {/* Filter tabs */}
      <div className='flex gap-0.5 mb-5'>
        {FILTERS.map(([v, l]) => (
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
        <div className='ml-auto'>
          <Link
            to='/watches/new'
            className='rounded font-semibold tracking-wide transition-opacity hover:opacity-90 cursor-pointer bg-primary text-primary-foreground px-2.5 py-1 text-[11px] inline-block'
          >
            + Add Watch
          </Link>
        </div>
      </div>

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
                  <Link
                    to='/watches/$watchId'
                    params={{ watchId: String(w.id) }}
                    className='inline-block'
                  >
                    <ThumbStrip photos={w.photos} />
                  </Link>
                </Td>
                <Td>
                  <Link
                    to='/watches/$watchId'
                    params={{ watchId: String(w.id) }}
                    className='block no-underline'
                  >
                    <div className='font-medium text-foreground'>
                      {w.make} {w.model}
                    </div>
                    <div className='font-mono text-[11px] text-muted-foreground mt-0.5'>
                      {w.reference}
                    </div>
                  </Link>
                </Td>
                <Td className='font-mono text-xs text-muted-foreground'>{w.year}</Td>
                <Td>
                  <StatusBadge status={w.status} />
                </Td>
                <Td className='text-xs text-muted-foreground capitalize'>
                  {w.condition_bought.replace('_', ' ')}
                </Td>
                <Td className='font-mono text-xs'>{fmt(w.bought_price)}</Td>
                <Td className='font-mono text-xs text-muted-foreground'>
                  {fmt(w.parts_cost)}
                </Td>
                <Td className='font-mono text-xs'>{fmt(w.sold_price)}</Td>
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

      {filtered.length === 0 && (
        <div className='text-center py-12 text-muted-foreground font-mono text-xs'>
          No watches match this filter
        </div>
      )}
    </>
  );
}
