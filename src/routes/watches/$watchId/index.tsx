import { createFileRoute, Link } from '@tanstack/react-router';
import { useGetWatchById } from '#/hooks/watches';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { fmt, profit } from '#/lib/helpers';
import type { WatchPhoto } from '#/types';

export const Route = createFileRoute('/watches/$watchId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { watchId } = Route.useParams();
  const { data: watch, isLoading } = useGetWatchById(watchId);

  if (isLoading) {
    return (
      <div className='text-sm text-zinc-500 font-mono'>Loading watch…</div>
    );
  }

  if (!watch) {
    return (
      <div className='space-y-3'>
        <Link
          to='/watches'
          className='inline-flex items-center gap-1 text-xs font-mono text-zinc-500 hover:text-zinc-200'
        >
          ← Back to Watches
        </Link>
        <div className='text-sm text-red-400 font-mono'>Watch not found.</div>
      </div>
    );
  }

  const p = profit(watch);

  return (
    <div className='space-y-8'>
      {/* Back link */}
      <div>
        <Link
          to='/watches'
          className='inline-flex items-center gap-1 text-xs font-mono text-zinc-500 hover:text-zinc-200'
        >
          ← Back to Watches
        </Link>
      </div>

      {/* Header */}
      <section className='flex items-start justify-between gap-6'>
        <div>
          <h1 className='text-2xl font-serif font-semibold text-zinc-100'>
            {watch.make} {watch.model}
          </h1>
          <div className='mt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-500'>
            <span>{watch.reference}</span>
            <span className='text-zinc-700'>·</span>
            <span>{watch.year}</span>
            <span className='text-zinc-700'>·</span>
            <StatusBadge status={watch.status} />
          </div>
        </div>

        <div className='shrink-0 rounded-md border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs font-mono text-zinc-300 space-y-1.5'>
          <div className='flex justify-between gap-6'>
            <span className='text-zinc-500 uppercase tracking-widest text-[10px]'>
              Paid
            </span>
            <span>{fmt(watch.bought_price)}</span>
          </div>
          <div className='flex justify-between gap-6'>
            <span className='text-zinc-500 uppercase tracking-widest text-[10px]'>
              Parts
            </span>
            <span>{fmt(watch.parts_cost)}</span>
          </div>
          <div className='flex justify-between gap-6'>
            <span className='text-zinc-500 uppercase tracking-widest text-[10px]'>
              Total In
            </span>
            <span>{fmt(watch.bought_price + (watch.parts_cost ?? 0))}</span>
          </div>
          <div className='flex justify-between gap-6'>
            <span className='text-zinc-500 uppercase tracking-widest text-[10px]'>
              Sold For
            </span>
            <span>{fmt(watch.sold_price)}</span>
          </div>
          <div className='flex justify-between gap-6'>
            <span className='text-zinc-500 uppercase tracking-widest text-[10px]'>
              Profit
            </span>
            <span
              className={
                p === null ? '' : p >= 0 ? 'text-green-400' : 'text-red-400'
              }
            >
              {fmt(p)}
            </span>
          </div>
          <div className='flex justify-between gap-6'>
            <span className='text-zinc-500 uppercase tracking-widest text-[10px]'>
              Hours
            </span>
            <span>{watch.hours_spent}h</span>
          </div>
        </div>
      </section>

      {/* Dates & notes */}
      <section className='grid grid-cols-3 gap-6'>
        <div className='space-y-1 text-xs font-mono text-zinc-400'>
          <div className='text-[10px] uppercase tracking-widest text-zinc-600'>
            Acquired
          </div>
          <div>{watch.bought_date}</div>
        </div>
        <div className='space-y-1 text-xs font-mono text-zinc-400'>
          <div className='text-[10px] uppercase tracking-widest text-zinc-600'>
            Sold
          </div>
          <div>{watch.sold_date ?? '—'}</div>
        </div>
        {watch.notes && (
          <div className='space-y-1 text-sm text-zinc-300'>
            <div className='text-[10px] font-mono uppercase tracking-widest text-zinc-600'>
              Notes
            </div>
            <p className='leading-relaxed text-zinc-400 italic'>
              "{watch.notes}"
            </p>
          </div>
        )}
      </section>

      {/* Photos */}
      <section className='space-y-3'>
        <div className='flex items-center justify-between'>
          <div className='text-[11px] font-mono uppercase tracking-widest text-zinc-600'>
            Photos ({watch.photos?.length ?? 0})
          </div>
        </div>
        {watch.photos && watch.photos.length > 0 ? (
          <div className='grid grid-cols-3 gap-3'>
            {watch.photos.map((ph: WatchPhoto) => (
              <figure
                key={ph.id}
                className='relative overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 aspect-4/3'
              >
                <img
                  src={ph.url}
                  alt={ph.caption}
                  className='h-full w-full object-cover'
                  loading='lazy'
                />
                <figcaption className='absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-2.5 pb-2 pt-5 text-[11px] text-white/90'>
                  <span className='mr-2 uppercase tracking-widest text-[9px] text-amber-300'>
                    {ph.stage}
                  </span>
                  {ph.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className='text-center py-8 text-xs font-mono text-zinc-600 border border-dashed border-zinc-800 rounded-md'>
            No photos for this watch yet.
          </div>
        )}
      </section>
    </div>
  );
}
