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
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const { t } = useTranslation();
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
          label={t('kpiTotalProfit')}
          value={fmt(totalProfit)}
          valueClass={totalProfit >= 0 ? 'text-forest' : 'text-wax'}
          sub={t('kpiTotalProfitSub', { count: sold.length })}
        />
        <KpiCard
          label={t('kpiCapitalDeployed')}
          value={fmt(totalInvested)}
          sub={t('kpiCapitalDeployedSub', { count: watches?.length ?? 0 })}
        />
        <KpiCard
          label={t('kpiAvgRoi')}
          value={fmtPct(avgRoi)}
          valueClass='text-brass-deep'
          sub={t('kpiAvgRoiSub')}
        />
        <KpiCard
          label={t('kpiHoursLogged')}
          value={`${totalHours ?? 0}${t('unitH')}`}
          sub={t('kpiBenchTimeSub')}
        />
      </div>

      {/* Watch ledger */}
      <div className='flex items-center justify-between mb-3.5'>
        <SectionLabel>{t('watchLedger')}</SectionLabel>
        {user && !!watches?.length && (
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
                    {t('freeAccountLimit', { limit: FREE_PROJECT_LIMIT })}{' '}
                    <Link to='/pro' className='text-amber-400 hover:underline'>
                      {t('upgradeToPro')}
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
            <Th className='hidden sm:table-cell'>{t('colPhoto_other')}</Th>
            <Th>{t('colWatch')}</Th>
            <Th>{t('colStatus')}</Th>
            <Th>{t('colPaid')}</Th>
            <Th className='hidden sm:table-cell'>{t('colParts')}</Th>
            <Th>{t('colSold')}</Th>
            <Th>{t('colProfit')}</Th>
            <Th>{t('colRoi')}</Th>
            <Th className='hidden sm:table-cell'>{t('colHrs')}</Th>
          </tr>
        </thead>
        <tbody>
          {watches?.length ? (
            watches
              ?.slice()
              .sort((a, b) => {
                const order: Record<string, number> = {
                  in_progress: 0,
                  acquired: 1,
                  listed: 2,
                  paused: 3,
                  sold: 4,
                };
                const statusDiff =
                  (order[a.status] ?? 99) - (order[b.status] ?? 99);
                if (statusDiff !== 0) return statusDiff;
                return (
                  new Date(b.updated).getTime() - new Date(a.updated).getTime()
                );
              })
              .map((w) => {
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
                    {/* eslint-disable-next-line i18next/no-literal-string */}
                    <Td className='hidden sm:table-cell font-mono text-xs text-muted-foreground'>{w.hours_spent}h</Td>
                  </TableRow>
                );
              })
          ) : (
            <tr>
              <td
                colSpan={9}
                className='py-10 text-center text-sm text-muted-foreground'
              >
                {t('noWatches')}{' '}
                <Link
                  to='/watches/new'
                  className='text-foreground underline underline-offset-2'
                >
                  {t('addFirstWatch')}
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
            <SectionLabel>{t('partsInventory')}</SectionLabel>
            <div className='flex items-center gap-2'>
              <span className='font-mono text-[10px] text-muted-foreground'>
                {t('inventoryValue', { value: fmt(inventoryValue) })}
              </span>
              {user && !!inventory?.length && (
                <Button variant='outline' asChild>
                  <Link to='/inventory/new'>
                    <PlusIcon className='size-3' />
                    {t('addPart')}
                  </Link>
                </Button>
              )}
            </div>
          </div>
          <TableWrap>
            <thead>
              <tr>
                <Th>{t('colPart')}</Th>
                <Th>{t('colCat')}</Th>
                <Th>{t('colQty')}</Th>
                <Th>{t('colValue')}</Th>
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
                    {t('noInventory')}{' '}
                    <Link
                      to='/inventory/new'
                      className='text-foreground underline underline-offset-2'
                    >
                      {t('addFirstItem')}
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
            <SectionLabel>{t('toolsEquipment')}</SectionLabel>
            {user && !!equipment?.length && (
              <Button variant='outline' asChild>
                <Link to='/equipment/new'>
                  <PlusIcon className='size-3' />
                  {t('addTool')}
                </Link>
              </Button>
            )}
          </div>
          <TableWrap>
            <thead>
              <tr>
                <Th>{t('colName')}</Th>
                <Th>{t('colCost')}</Th>
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
                    {t('noTools')}{' '}
                    <Link
                      to='/equipment/new'
                      className='text-foreground underline underline-offset-2'
                    >
                      {t('addFirstItem')}
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
            {!!equipCost && (
              <tfoot>
                <tr className='border-t-2 border-border'>
                  <Td className='font-medium text-foreground text-xs'>{t('total')}</Td>
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
