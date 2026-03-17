import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { cn, fmt, fmtPct, profit, roi } from '#/lib/helpers';
import { HOURLY_RATE } from '#/lib/constants';
import { KpiCard } from '#/components/primitives/KpiCard';
import { SectionLabel } from '#/components/primitives/SectionLabel';
import { Btn } from '#/components/primitives/Button';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { Th, Td, TableRow, TableWrap } from '#/components/table';
import { ThumbStrip } from '#/components/watches/ThumbStrip';
import { useWatches } from '#/hooks/watches';
import { useEquipment } from '#/hooks/equipment';
import { useInventory } from '#/hooks/inventory';

export const Route = createFileRoute('/')({ component: Dashboard });

function Dashboard() {
  const navigate = useNavigate();
  const { data: watches, isLoading: isWatchesLoading } = useWatches();
  const { data: equipment, isLoading: isEquipmentLoading } = useEquipment();
  const { data: inventory, isLoading: isInventoryLoading } = useInventory();

  if (isWatchesLoading || isEquipmentLoading || isInventoryLoading) {
    return <div>Loading...</div>;
  }

  const sold = watches?.filter((w) => w.status === 'sold') ?? [];
  const totalProfit = sold.reduce((s, w) => s + (profit(w) ?? 0), 0);
  const totalInvested = watches?.reduce(
    (s, w) => s + (w.bought_price ?? 0) + (w.parts_cost ?? 0),
    0,
  );
  const totalHours = watches?.reduce((s, w) => s + w.hours_spent, 0);
  const equipCost = equipment?.reduce((s, e) => s + e.cost, 0);

  const avgRoi = sold.length
    ? (
        sold.reduce((s, w) => s + parseFloat(roi(w) ?? '0'), 0) / sold.length
      ).toFixed(1)
    : '0';

  const inventoryValue = inventory?.reduce(
    (s, i) => s + (i.qty ?? 0) * (i.unit_cost ?? 0),
    0,
  );

  return (
    <>
      {/* KPIs */}
      <div className='grid grid-cols-4 gap-4 mb-7'>
        <KpiCard
          highlight
          label='Total Profit (sold)'
          value={fmt(totalProfit)}
          valueClass={totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}
          sub={`net after parts · ${sold.length} watches`}
        />
        <KpiCard
          label='Capital Deployed'
          value={fmt(totalInvested)}
          sub={`across ${watches?.length ?? 0} watches`}
        />
        <KpiCard
          label='Avg ROI (sold)'
          value={fmtPct(avgRoi)}
          valueClass='text-amber-400'
          sub='per sold watch'
        />
        <KpiCard
          label='Hours Logged'
          value={`${totalHours ?? 0}h`}
          sub={`${fmt(totalHours ?? 0 * HOURLY_RATE)} imputed labor`}
        />
      </div>

      {/* Watch ledger */}
      <div className='flex items-center justify-between mb-3.5'>
        <SectionLabel>Watch Ledger</SectionLabel>
        <Btn sm>+ Add Watch</Btn>
      </div>
      <TableWrap className='mb-7'>
        <thead>
          <tr>
            <Th>Photos</Th>
            <Th>Watch</Th>
            <Th>Status</Th>
            <Th>Paid</Th>
            <Th>Parts</Th>
            <Th>Sold</Th>
            <Th>Profit</Th>
            <Th>ROI</Th>
            <Th>Hrs</Th>
          </tr>
        </thead>
        <tbody>
          {watches?.map((w) => {
            const p = profit(w);
            const r = roi(w);
            return (
              <TableRow
                key={w.id}
                onClick={() =>
                  navigate({
                    to: '/watches/$watchId',
                    params: { watchId: w.id },
                  })
                }
              >
                <Td>
                  <ThumbStrip
                    photos={w.photos}
                    onClick={() =>
                      navigate({
                        to: '/watches/$watchId',
                        params: { watchId: w.id },
                      })
                    }
                  />
                </Td>
                <Td>
                  <div className='font-medium text-zinc-100'>
                    {w.make} {w.model}
                  </div>
                  <div className='font-mono text-[11px] text-zinc-500 mt-0.5'>
                    {w.reference} · {w.year}
                  </div>
                </Td>
                <Td>
                  <StatusBadge status={w.status} />
                </Td>
                <Td className='font-mono text-xs'>{fmt(w.bought_price)}</Td>
                <Td className='font-mono text-xs text-zinc-500'>
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
                <Td
                  className={cn(
                    'font-mono text-xs',
                    r === null
                      ? ''
                      : parseFloat(r) >= 0
                        ? 'text-green-400'
                        : 'text-red-400',
                  )}
                >
                  {fmtPct(r)}
                </Td>
                <Td className='font-mono text-xs text-zinc-500'>
                  {w.hours_spent}h
                </Td>
              </TableRow>
            );
          })}
        </tbody>
      </TableWrap>

      {/* Bottom grid */}
      <div className='grid grid-cols-2 gap-4'>
        {/* Inventory */}
        <div>
          <div className='flex items-center justify-between mb-3.5'>
            <SectionLabel>Parts Inventory</SectionLabel>
            <div className='flex items-center gap-2'>
              <span className='font-mono text-[10px] text-zinc-500'>
                {fmt(inventoryValue)} value
              </span>
              <Btn ghost sm>
                + Add Part
              </Btn>
            </div>
          </div>
          <TableWrap>
            <thead>
              <tr>
                <Th>Part</Th>
                <Th>Cat</Th>
                <Th>Qty</Th>
                <Th>Value</Th>
              </tr>
            </thead>
            <tbody>
              {inventory?.map((i) => (
                <TableRow key={i.id}>
                  <Td className='text-xs'>{i.name}</Td>
                  <Td>
                    <span className='font-mono text-[9px] uppercase tracking-widest text-zinc-500 px-1.5 py-0.5 border border-zinc-700 rounded'>
                      {i.category}
                    </span>
                  </Td>
                  <Td className='font-mono text-xs text-zinc-400'>{i.qty}</Td>
                  <Td className='font-mono text-xs'>
                    {fmt(i.qty * i.unit_cost)}
                  </Td>
                </TableRow>
              ))}
            </tbody>
          </TableWrap>
        </div>

        {/* Equipment */}
        <div>
          <div className='flex items-center justify-between mb-3.5'>
            <SectionLabel>Tools &amp; Equipment</SectionLabel>
            <Btn ghost sm>
              + Add Tool
            </Btn>
          </div>
          <div className='bg-zinc-900 border border-zinc-800 rounded overflow-hidden'>
            {equipment?.map((e) => (
              <div
                key={e.id}
                className='flex justify-between items-center px-3.5 py-2.5 border-b border-zinc-800 last:border-0 text-sm'
              >
                <span className='text-zinc-200'>{e.name}</span>
                <span className='font-mono text-xs text-zinc-500'>
                  {fmt(e.cost)}
                </span>
              </div>
            ))}
            <div className='flex justify-between items-center px-3.5 py-2.5 border-t-2 border-zinc-700 text-sm'>
              <span className='font-medium text-zinc-100'>Total</span>
              <span className='font-mono text-xs text-amber-400 font-semibold'>
                {fmt(equipCost)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
