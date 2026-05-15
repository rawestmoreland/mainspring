import { useEffect } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { cn, fmt, fmtPct, profit, roi } from '#/lib/helpers';
import { KpiCard } from '#/components/primitives/KpiCard';
import { SectionLabel } from '#/components/primitives/SectionLabel';
import { Th, Td, TableRow, TableWrap } from '#/components/table';
import { ThumbStrip } from '#/components/watches/ThumbStrip';
import { useWatches } from '#/hooks/watches';
import { useEquipment } from '#/hooks/equipment';
import { useInventory } from '#/hooks/inventory';
import { useUser } from '#/hooks/user';
import { Button } from '#/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { DashboardSkeleton } from '#/components/skeletons';
import { StatusPicker } from '#/components/watches/StatusPicker';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#/components/ui/tooltip';
import { FREE_PROJECT_LIMIT } from '#/lib/constants';
import { useSubscription } from '#/hooks/subscription';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    import('#/lib/pocketbase').then(({ default: pb }) => {
      if (!pb.authStore.isValid) {
        navigate({ to: '/login', replace: true });
      }
    });
  }, [navigate]);

  const { data: watches, isPending: isWatchesPending } = useWatches();
  const { data: equipment, isPending: isEquipmentPending } = useEquipment();
  const { data: inventory, isPending: isInventoryPending } = useInventory();
  const { data: user, isPending: isUserPending } = useUser();
  const { isPro } = useSubscription();

  if (
    isWatchesPending ||
    isEquipmentPending ||
    isInventoryPending ||
    isUserPending
  ) {
    return <DashboardSkeleton />;
  }

  const activeCount = watches?.filter((w) => w.status !== 'sold').length ?? 0;

  const atProjectLimit = !isPro && activeCount >= FREE_PROJECT_LIMIT;
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
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7'>
        <KpiCard
          highlight
          label='Total Profit (sold)'
          value={fmt(totalProfit)}
          valueClass={totalProfit >= 0 ? 'text-forest' : 'text-wax'}
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
          valueClass='text-brass-deep'
          sub='per sold watch'
        />
        <KpiCard
          label='Hours Logged'
          value={`${totalHours ?? 0}h`}
          sub='bench time'
        />
      </div>

      {/* Watch ledger */}
      <div className='flex items-center justify-between mb-3.5'>
        <SectionLabel>Watch Ledger</SectionLabel>
        {user && !!watches?.length && (
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
                    Free accounts are limited to {FREE_PROJECT_LIMIT} active
                    projects.{' '}
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
      <TableWrap className='mb-7'>
        <thead>
          <tr>
            <Th className='hidden sm:table-cell'>Photos</Th>
            <Th>Watch</Th>
            <Th>Status</Th>
            <Th>Paid</Th>
            <Th className='hidden sm:table-cell'>Parts</Th>
            <Th>Sold</Th>
            <Th>Profit</Th>
            <Th>ROI</Th>
            <Th className='hidden sm:table-cell'>Hrs</Th>
          </tr>
        </thead>
        <tbody>
          {watches?.length ? (
            watches?.map((w) => {
              const p = profit(w);
              const r = roi(w);
              return (
                <TableRow key={w.id}>
                  <Td className='hidden sm:table-cell'>
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
                    <div
                      className='cursor-pointer'
                      onClick={() =>
                        navigate({
                          to: '/watches/$watchId',
                          params: { watchId: w.id },
                        })
                      }
                    >
                      <div className='font-medium text-foreground'>
                        {w.make} {w.model}
                      </div>
                      <div className='font-mono text-[11px] text-muted-foreground mt-0.5'>
                        {w.reference} · {w.year}
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <StatusPicker watch={w} disabled={w.is_frozen} />
                  </Td>
                  <Td className='font-mono text-xs'>{fmt(w.bought_price)}</Td>
                  <Td className='hidden sm:table-cell font-mono text-xs text-muted-foreground'>
                    {fmt(w.parts_cost)}
                  </Td>
                  <Td className='font-mono text-xs'>{fmt(w.sold_price)}</Td>
                  <Td
                    className={cn(
                      'font-mono text-xs',
                      p === null ? '' : p >= 0 ? 'text-forest' : 'text-wax',
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
                          ? 'text-forest'
                          : 'text-wax',
                    )}
                  >
                    {fmtPct(r)}
                  </Td>
                  <Td className='hidden sm:table-cell font-mono text-xs text-muted-foreground'>
                    {w.hours_spent}h
                  </Td>
                </TableRow>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={9}
                className='py-10 text-center text-sm text-muted-foreground'
              >
                No watches yet.{' '}
                <Link
                  to='/watches/new'
                  className='text-foreground underline underline-offset-2'
                >
                  Add your first watch
                </Link>
              </td>
            </tr>
          )}
        </tbody>
      </TableWrap>

      {/* Bottom grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Inventory */}
        <div>
          <div className='flex items-center justify-between mb-3.5'>
            <SectionLabel>Parts Inventory</SectionLabel>
            <div className='flex items-center gap-2'>
              <span className='font-mono text-[10px] text-muted-foreground'>
                {fmt(inventoryValue)} value
              </span>
              {user && !!inventory?.length && (
                <Button variant='outline' asChild>
                  <Link to='/inventory/new'>
                    <PlusIcon className='size-3' />
                    Add Part
                  </Link>
                </Button>
              )}
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
              {inventory?.length ? (
                inventory?.map((i) => (
                  <TableRow key={i.id}>
                    <Td className='text-xs'>{i.name}</Td>
                    <Td>
                      <span className='font-mono text-[9px] uppercase tracking-widest text-muted-foreground px-1.5 py-0.5 border border-border rounded'>
                        {i.category}
                      </span>
                    </Td>
                    <Td className='font-mono text-xs text-muted-foreground'>
                      {i.qty}
                    </Td>
                    <Td className='font-mono text-xs'>
                      {fmt(i.qty * i.unit_cost)}
                    </Td>
                  </TableRow>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className='py-10 text-center text-sm text-muted-foreground'
                  >
                    No inventory yet.{' '}
                    <Link
                      to='/inventory/new'
                      className='text-foreground underline underline-offset-2'
                    >
                      Add your first item
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </div>

        {/* Equipment */}
        <div>
          <div className='flex items-center justify-between mb-3.5'>
            <SectionLabel>Tools &amp; Equipment</SectionLabel>
            {user && !!equipment?.length && (
              <Button variant='outline' asChild>
                <Link to='/equipment/new'>
                  <PlusIcon className='size-3' />
                  Add Tool
                </Link>
              </Button>
            )}
          </div>
          <TableWrap>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Cost</Th>
              </tr>
            </thead>
            <tbody>
              {equipment?.length ? (
                equipment?.map((e) => (
                  <TableRow key={e.id}>
                    <Td className='text-xs'>{e.name}</Td>
                    <Td className='font-mono text-xs'>{fmt(e.cost)}</Td>
                  </TableRow>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={2}
                    className='py-10 text-center text-sm text-muted-foreground'
                  >
                    No tools yet.{' '}
                    <Link
                      to='/equipment/new'
                      className='text-foreground underline underline-offset-2'
                    >
                      Add your first item
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
            {!!equipCost && (
              <tfoot>
                <tr className='border-t-2 border-border'>
                  <Td className='font-medium text-foreground text-xs'>Total</Td>
                  <Td className='font-mono text-xs text-brass font-semibold'>
                    {fmt(equipCost)}
                  </Td>
                </tr>
              </tfoot>
            )}
          </TableWrap>
        </div>
      </div>
    </>
  );
}
