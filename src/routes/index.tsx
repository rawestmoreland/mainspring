import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { cn, fmt, fmtPct, profit, roi } from '#/lib/helpers';
import { KpiCard } from '#/components/primitives/KpiCard';
import { SectionLabel } from '#/components/primitives/SectionLabel';
import { Btn } from '#/components/primitives/Button';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { Th, Td, TableRow, TableWrap } from '#/components/table';
import { ThumbStrip } from '#/components/watches/ThumbStrip';
import { useWatches } from '#/hooks/watches';
import { useEquipment } from '#/hooks/equipment';
import { useInventory } from '#/hooks/inventory';
import { useUser } from '#/hooks/user';
import type { UserProfile, Watch, RepairPost } from '#/types';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

function IndexPage() {
  const ctx = Route.useRouteContext() as { tenant?: UserProfile | null };
  if (ctx.tenant) return <PublicProfile tenant={ctx.tenant} />;
  return <Dashboard />;
}

// ─── Public profile (subdomain visitors) ────────────────────────────────────

function PublicProfile({ tenant }: { tenant: UserProfile }) {
  const pbUrl = import.meta.env.VITE_POCKETBASE_URL;

  const { data: watches } = useQuery<Watch[]>({
    queryKey: ['public', 'watches', tenant.user],
    queryFn: async () => {
      const res = await fetch(
        `${pbUrl}/api/collections/watches/records?filter=user%3D%22${tenant.user}%22&sort=-created&perPage=100`,
      );
      if (!res.ok) return [];
      return ((await res.json()) as { items?: Watch[] }).items ?? [];
    },
  });

  const { data: posts } = useQuery<RepairPost[]>({
    queryKey: ['public', 'posts', tenant.user],
    queryFn: async () => {
      const res = await fetch(
        `${pbUrl}/api/collections/repair_posts/records?filter=user%3D%22${tenant.user}%22&sort=-session_date&perPage=50`,
      );
      if (!res.ok) return [];
      return ((await res.json()) as { items?: RepairPost[] }).items ?? [];
    },
  });

  return (
    <div className='space-y-10'>
      <section>
        <h2 className='font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4'>
          Watch Projects
        </h2>
        {watches?.length ? (
          <div className='grid gap-3 sm:grid-cols-2'>
            {watches.map((w) => (
              <div
                key={w.id}
                className='bg-card border border-border rounded-md px-4 py-3'
              >
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-medium text-sm text-foreground'>
                    {w.make} {w.model}
                  </span>
                  <StatusBadge status={w.status} />
                </div>
                {w.reference && (
                  <span className='font-mono text-[11px] text-muted-foreground'>
                    {w.reference}
                    {w.year ? ` · ${w.year}` : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>No projects yet.</p>
        )}
      </section>

      <section>
        <h2 className='font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4'>
          Repair Posts
        </h2>
        {posts?.length ? (
          <div className='space-y-3'>
            {posts.map((p) => (
              <div
                key={p.id}
                className='bg-card border border-border rounded-md px-4 py-3'
              >
                <div className='font-medium text-sm text-foreground'>{p.title}</div>
                {p.session_date && (
                  <div className='font-mono text-[11px] text-muted-foreground mt-0.5'>
                    {new Date(p.session_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>No posts yet.</p>
        )}
      </section>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const { data: watches, isLoading: isWatchesLoading } = useWatches();
  const { data: equipment, isLoading: isEquipmentLoading } = useEquipment();
  const { data: inventory, isLoading: isInventoryLoading } = useInventory();

  const { data: user, isLoading: isUserLoading } = useUser();

  if (
    isWatchesLoading ||
    isEquipmentLoading ||
    isInventoryLoading ||
    isUserLoading
  ) {
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
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7'>
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
          valueClass='text-primary'
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
        {user && (
          <Btn
            sm
            onClick={() =>
              navigate({
                to: '/watches/new',
              })
            }
          >
            + Add Watch
          </Btn>
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
                  <div className='font-medium text-foreground'>
                    {w.make} {w.model}
                  </div>
                  <div className='font-mono text-[11px] text-muted-foreground mt-0.5'>
                    {w.reference} · {w.year}
                  </div>
                </Td>
                <Td>
                  <StatusBadge status={w.status} />
                </Td>
                <Td className='font-mono text-xs'>{fmt(w.bought_price)}</Td>
                <Td className='hidden sm:table-cell font-mono text-xs text-muted-foreground'>
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
                <Td className='hidden sm:table-cell font-mono text-xs text-muted-foreground'>
                  {w.hours_spent}h
                </Td>
              </TableRow>
            );
          })}
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
              {user && (
                <Btn ghost sm>
                  + Add Part
                </Btn>
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
              {inventory?.map((i) => (
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
              ))}
            </tbody>
          </TableWrap>
        </div>

        {/* Equipment */}
        <div>
          <div className='flex items-center justify-between mb-3.5'>
            <SectionLabel>Tools &amp; Equipment</SectionLabel>
            {user && (
              <Btn ghost sm>
                + Add Tool
              </Btn>
            )}
          </div>
          <div className='bg-card border border-border rounded overflow-hidden'>
            {equipment?.map((e) => (
              <div
                key={e.id}
                className='flex justify-between items-center px-3.5 py-2.5 border-b border-border last:border-0 text-sm'
              >
                <span className='text-foreground'>{e.name}</span>
                <span className='font-mono text-xs text-muted-foreground'>
                  {fmt(e.cost)}
                </span>
              </div>
            ))}
            <div className='flex justify-between items-center px-3.5 py-2.5 border-t-2 border-border text-sm'>
              <span className='font-medium text-foreground'>Total</span>
              <span className='font-mono text-xs text-primary font-semibold'>
                {fmt(equipCost)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
