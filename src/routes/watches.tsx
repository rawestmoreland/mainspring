import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { cn, fmt, profit } from '#/lib/helpers';
import { useWatches } from '#/context/watches';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { Btn } from '#/components/primitives/Button';
import { Th, Td, TableRow, TableWrap } from '#/components/table';
import { ThumbStrip } from '#/components/watches/ThumbStrip';
import type { WatchStatus } from '#/types';

export const Route = createFileRoute('/watches')({ component: WatchesPage });

type FilterValue = 'all' | WatchStatus;
const FILTERS: [FilterValue, string][] = [
  ['all',         'All'],
  ['in_progress', 'In Progress'],
  ['listed',      'Listed'],
  ['sold',        'Sold'],
];

function WatchesPage() {
  const { watches, selectWatch } = useWatches();
  const [filter, setFilter] = useState<FilterValue>('all');

  const filtered = filter === 'all' ? watches : watches.filter((w) => w.status === filter);

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-0.5 mb-5">
        {FILTERS.map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={cn(
              'px-3.5 py-1.5 text-xs font-mono rounded tracking-wide transition-all cursor-pointer border-none',
              filter === v
                ? 'text-amber-400 bg-amber-500/10'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 bg-transparent',
            )}
          >
            {l}
          </button>
        ))}
        <div className="ml-auto">
          <Btn sm>+ Add Watch</Btn>
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
              <TableRow key={w.id} onClick={() => selectWatch(w)}>
                <Td>
                  <ThumbStrip photos={w.photos} onClick={() => selectWatch(w)} />
                </Td>
                <Td>
                  <div className="font-medium text-zinc-100">{w.make} {w.model}</div>
                  <div className="font-mono text-[11px] text-zinc-500 mt-0.5">{w.reference}</div>
                </Td>
                <Td className="font-mono text-xs text-zinc-500">{w.year}</Td>
                <Td><StatusBadge status={w.status} /></Td>
                <Td className="text-xs text-zinc-400 capitalize">
                  {w.condition_bought.replace('_', ' ')}
                </Td>
                <Td className="font-mono text-xs">{fmt(w.bought_price)}</Td>
                <Td className="font-mono text-xs text-zinc-500">{fmt(w.parts_cost)}</Td>
                <Td className="font-mono text-xs">{fmt(w.sold_price)}</Td>
                <Td className={cn('font-mono text-xs', p === null ? '' : p >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {fmt(p)}
                </Td>
                <Td className="font-mono text-xs text-zinc-500">{w.hours_spent}h</Td>
              </TableRow>
            );
          })}
        </tbody>
      </TableWrap>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-zinc-600 font-mono text-xs">
          No watches match this filter
        </div>
      )}
    </>
  );
}
