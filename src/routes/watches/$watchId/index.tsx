import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  useGetWatchById,
  useDeleteWatchPhoto,
  useUpdateWatch,
  useUploadWatchPhotos,
} from '#/hooks/watches';
import { useGetPostsByWatch } from '#/hooks/posts';
import { useUser } from '#/hooks/user';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { fmt, profit } from '#/lib/helpers';
import type { WatchStage } from '#/types';
import { format } from 'date-fns/format';
import { UploadZone } from '#/components/watches/UploadZone';
import type { PendingPhoto } from '#/components/watches/UploadZone';

export const Route = createFileRoute('/watches/$watchId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { watchId } = Route.useParams();
  const { data: watch, isLoading } = useGetWatchById(watchId);
  const { data: user } = useUser();
  const { data: posts } = useGetPostsByWatch(watchId);
  const postCount = posts?.length ?? 0;
  const deletePhoto = useDeleteWatchPhoto(watchId);
  const uploadPhotos = useUploadWatchPhotos(watchId);
  const updateWatch = useUpdateWatch();

  const [editingNotes, setEditingNotes] = useState(false);
  const [draftNotes, setDraftNotes] = useState('');

  const handleUpload = (pending: PendingPhoto[]) => {
    uploadPhotos.mutate(
      pending.map((p) => ({
        file: p.file,
        stage: p.stage,
        caption: p.caption,
      })),
    );
  };

  if (isLoading) {
    return (
      <div className='text-sm text-muted-foreground font-mono'>
        Loading watch…
      </div>
    );
  }

  if (!watch) {
    return (
      <div className='space-y-3'>
        <Link
          to='/watches'
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          ← Back to Watches
        </Link>
        <div className='text-sm text-red-400 font-mono'>Watch not found.</div>
      </div>
    );
  }

  const p = profit(watch);

  return (
    <div className='space-y-5'>
      {/* Back link */}
      <Link
        to='/watches'
        className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
      >
        ← Back to Watches
      </Link>

      {/* Two-column layout */}
      <div className='grid grid-cols-[1fr_280px] gap-6 items-start'>
        {/* Left column: meta + financials + repair log */}
        <div className='space-y-5'>
          {/* Watch identity */}
          <section>
            <h1 className='text-2xl font-serif font-semibold text-foreground'>
              {watch.make} {watch.model}
            </h1>
            <div className='mt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-muted-foreground'>
              <span>{watch.reference}</span>
              <span className='text-muted-foreground/60'>·</span>
              <span>{watch.year}</span>
              <span className='text-muted-foreground/60'>·</span>
              <StatusBadge status={watch.status} />
            </div>
          </section>

          {/* Financials row */}
          <section className='rounded-md border border-border bg-card px-4 py-3'>
            <div className='grid grid-cols-6 gap-4 text-xs font-mono'>
              {[
                { label: 'Paid', value: fmt(watch.bought_price) },
                { label: 'Parts', value: fmt(watch.parts_cost) },
                {
                  label: 'Total In',
                  value: fmt(watch.bought_price + (watch.parts_cost ?? 0)),
                },
                { label: 'Sold For', value: fmt(watch.sold_price) },
                {
                  label: 'Profit',
                  value: fmt(p),
                  valueClass:
                    p === null
                      ? ''
                      : p >= 0
                        ? 'text-green-400'
                        : 'text-red-400',
                },
                { label: 'Hours', value: `${watch.hours_spent}h` },
              ].map(({ label, value, valueClass }) => (
                <div key={label} className='space-y-1'>
                  <div className='text-[10px] uppercase tracking-widest text-muted-foreground/80'>
                    {label}
                  </div>
                  <div className={valueClass ?? 'text-foreground/90'}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Dates */}
          <section className='grid grid-cols-2 gap-6'>
            <div className='space-y-1 text-xs font-mono text-muted-foreground'>
              <div className='text-[10px] uppercase tracking-widest text-muted-foreground/80'>
                Acquired
              </div>
              <div>{format(watch.bought_date, 'MMM d, yyyy')}</div>
            </div>
            <div className='space-y-1 text-xs font-mono text-muted-foreground'>
              <div className='text-[10px] uppercase tracking-widest text-muted-foreground/80'>
                Sold
              </div>
              <div>{watch.sold_date ?? '—'}</div>
            </div>
          </section>

          {/* Notes */}
          <section className='space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80'>
                Notes
              </div>
              {user && !editingNotes && (
                <button
                  onClick={() => {
                    setDraftNotes(watch.notes ?? '');
                    setEditingNotes(true);
                  }}
                  className='text-xs font-mono text-primary hover:text-primary/80'
                >
                  Edit
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className='space-y-2'>
                <textarea
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  rows={4}
                  autoFocus
                  placeholder='Add general notes about this watch…'
                  className='w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary'
                />
                <div className='flex gap-3'>
                  <button
                    onClick={() => {
                      updateWatch.mutate({ ...watch, notes: draftNotes });
                      setEditingNotes(false);
                    }}
                    disabled={updateWatch.isPending}
                    className='text-xs font-mono text-primary hover:text-primary/80 disabled:opacity-50'
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingNotes(false)}
                    className='text-xs font-mono text-muted-foreground hover:text-foreground'
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : watch.notes ? (
              <p className='text-sm leading-relaxed text-foreground/85'>
                {watch.notes}
              </p>
            ) : (
              <p className='font-mono text-xs italic text-muted-foreground/50'>
                No notes yet.
              </p>
            )}
          </section>

          {/* Repair Log */}
          <section className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80'>
                Repair Log
              </div>
              <Link
                to='/watches/$watchId/posts'
                params={{ watchId }}
                className='text-xs font-mono text-primary hover:text-primary/80 no-underline'
              >
                View all ({postCount})
              </Link>
            </div>
            {postCount === 0 ? (
              <div className='text-center py-6 text-xs font-mono text-muted-foreground border border-dashed border-border rounded-md'>
                No repair sessions yet.{' '}
                {user && (
                  <Link
                    to='/watches/$watchId/posts/new'
                    params={{ watchId }}
                    className='text-primary'
                  >
                    Log the first one →
                  </Link>
                )}
              </div>
            ) : (
              <ul className='space-y-1.5'>
                {posts!.slice(0, 5).map((post) => (
                  <li key={post.id}>
                    <Link
                      to='/watches/$watchId/posts/$postId'
                      params={{ watchId, postId: post.id }}
                      className='flex items-center justify-between rounded-md px-3 py-2 border border-border bg-card hover:bg-accent/10 transition-colors no-underline'
                    >
                      <span className='text-sm text-foreground'>
                        {post.title}
                      </span>
                      <span className='text-[11px] font-mono text-muted-foreground'>
                        {post.session_date
                          ? format(new Date(post.session_date), 'MMM d, yyyy')
                          : '—'}
                      </span>
                    </Link>
                  </li>
                ))}
                {postCount > 5 && (
                  <li>
                    <Link
                      to='/watches/$watchId/posts'
                      params={{ watchId }}
                      className='block text-center text-xs font-mono text-muted-foreground hover:text-primary py-1 no-underline'
                    >
                      + {postCount - 5} more
                    </Link>
                  </li>
                )}
              </ul>
            )}
            {user && postCount > 0 && (
              <Link
                to='/watches/$watchId/posts/new'
                params={{ watchId }}
                className='inline-flex items-center gap-1 text-xs font-mono text-primary hover:text-primary/80 no-underline'
              >
                + New session
              </Link>
            )}
          </section>
        </div>

        {/* Right column: photos */}
        {(() => {
          const STAGE_ORDER: WatchStage[] = [
            'before',
            'during',
            'after',
            'listing',
          ];
          const STAGE_LABELS: Record<WatchStage, string> = {
            before: 'Before',
            during: 'During',
            after: 'After',
            listing: 'Listing',
          };
          const photos = watch.photos ?? [];
          const grouped = STAGE_ORDER.map((stage) => ({
            stage,
            photos: photos.filter((ph) => ph.stage === stage),
          })).filter((g) => g.photos.length > 0);

          return (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80'>
                  Photos ({photos.length})
                </div>
                {user && <UploadZone onUpload={handleUpload} />}
              </div>
              {grouped.length > 0 ? (
                <div className='space-y-4'>
                  {grouped.map(({ stage, photos: stagePhs }) => (
                    <div key={stage} className='space-y-1.5'>
                      <div className='text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60'>
                        {STAGE_LABELS[stage]}
                      </div>
                      <div className='grid grid-cols-2 gap-2'>
                        {stagePhs.map((ph) => (
                          <figure
                            key={ph.id}
                            className='group relative overflow-hidden rounded-md border border-border bg-card aspect-square'
                          >
                            <a
                              href={ph.image}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='block h-full w-full'
                            >
                              <img
                                src={ph.image}
                                alt={ph.caption}
                                className='h-full w-full object-cover cursor-zoom-in'
                                loading='lazy'
                              />
                            </a>
                            {user && (
                              <button
                                onClick={() => deletePhoto.mutate(ph.id)}
                                disabled={deletePhoto.isPending}
                                className='absolute top-1.5 right-1.5 hidden group-hover:flex items-center justify-center w-6 h-6 rounded bg-black/70 text-white/80 hover:text-red-400 hover:bg-black/90 transition-colors'
                                aria-label='Delete photo'
                              >
                                ×
                              </button>
                            )}
                            {ph.caption && (
                              <figcaption className='absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-2 pb-1.5 pt-4 text-[10px] text-white/90'>
                                {ph.caption}
                              </figcaption>
                            )}
                          </figure>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8 text-xs font-mono text-muted-foreground border border-dashed border-border rounded-md'>
                  No photos yet.
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
