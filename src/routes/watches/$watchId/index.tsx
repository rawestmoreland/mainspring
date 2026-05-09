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
import { StagePill } from '#/components/primitives/StagePill';
import { StageTag } from '#/components/primitives/StageTag';
import { fmt, fmtPct, profit, roi, cn } from '#/lib/helpers';
import { STAGE_META } from '#/lib/mocks/meta';
import type { WatchPhoto } from '#/types';
import { format } from 'date-fns/format';
import { UploadZone } from '#/components/watches/UploadZone';
import type { PendingPhoto } from '#/components/watches/UploadZone';
import { Lightbox } from '#/components/watches/Lightbox';
import { AddPartUsedDialog } from '#/components/watches/AddPartUsedDialog';
import TipTapEditor from '#/components/TipTap';
import { useDeletePartUsed } from '#/hooks/parts_used';
import { capitalize } from 'lodash';

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
  const deletePartUsed = useDeletePartUsed(watchId);

  const [stageFilter, setStageFilter] = useState<string>('all');
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState<{
    photos: WatchPhoto[];
    index: number;
  } | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [draftNotes, setDraftNotes] = useState('');

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

  const photos = watch.photos ?? [];
  const displayedPhotos =
    stageFilter === 'all'
      ? photos
      : photos.filter((ph) => ph.stage === stageFilter);
  const activePhoto = displayedPhotos[activeIdx] ?? null;

  const handleStageFilter = (s: string) => {
    setStageFilter((f) => (f === s ? 'all' : s));
    setActiveIdx(0);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx(
      (i) => (i - 1 + displayedPhotos.length) % displayedPhotos.length,
    );
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((i) => (i + 1) % displayedPhotos.length);
  };

  const handleUpload = (pending: PendingPhoto[]) => {
    uploadPhotos.mutate(
      pending.map((p) => ({
        file: p.file,
        stage: p.stage,
        caption: p.caption,
      })),
    );
  };

  const partsUsed = watch.expand?.parts_used_via_watch ?? [];

  const p = profit(watch);
  const r = roi(watch);

  return (
    <div className='space-y-5 min-w-0'>
      {/* Back link */}
      <Link
        to='/watches'
        className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
      >
        ← Back to Watches
      </Link>

      {/* Header */}
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
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
        </div>
        <div className='flex items-center gap-3 text-xs font-mono'>
          {photos.length > 0 && (
            <Link
              to='/watches/$watchId/gallery'
              params={{ watchId }}
              className='text-primary hover:text-primary/80 no-underline'
            >
              View Gallery →
            </Link>
          )}
        </div>
      </div>

      {/* Two-column body */}
      <div className='flex flex-col md:flex-row gap-6 items-start'>
        {/* LEFT: Photo panel */}
        <div className='w-full md:w-[54%] shrink-0 rounded-xl border border-border overflow-hidden bg-card'>
          {/* Stage filter */}
          <div className='flex flex-wrap gap-1.5 px-4 py-3 border-b border-border'>
            {Object.keys(STAGE_META).map((s) => (
              <StagePill
                key={s}
                stage={s}
                active={stageFilter === s}
                onClick={() => handleStageFilter(s)}
              />
            ))}
          </div>

          {/* Main photo viewer */}
          {activePhoto ? (
            <div className='relative w-full aspect-4/3 bg-zinc-950 overflow-hidden group'>
              <img
                src={activePhoto.image}
                alt={activePhoto.caption}
                className='w-full h-full object-contain cursor-zoom-in'
                onClick={() =>
                  setLightbox({ photos: displayedPhotos, index: activeIdx })
                }
              />
              {displayedPhotos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className='absolute left-2 top-1/2 -translate-y-1/2 bg-black/55 hover:bg-black/75 text-white text-xl px-3 py-2 rounded-lg border-none cursor-pointer transition-colors opacity-0 group-hover:opacity-100'
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextPhoto}
                    className='absolute right-2 top-1/2 -translate-y-1/2 bg-black/55 hover:bg-black/75 text-white text-xl px-3 py-2 rounded-lg border-none cursor-pointer transition-colors opacity-0 group-hover:opacity-100'
                  >
                    ›
                  </button>
                  <div className='absolute bottom-2 right-2 bg-black/60 text-white/70 font-mono text-[10px] px-2 py-0.5 rounded-full'>
                    {activeIdx + 1} / {displayedPhotos.length}
                  </div>
                </>
              )}
              <div className='absolute top-2 left-2'>
                <StageTag stage={activePhoto.stage} />
              </div>
              {activePhoto.caption && (
                <div className='absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent px-3 pb-2.5 pt-6 text-[11px] text-white/85 opacity-0 group-hover:opacity-100 transition-opacity leading-tight'>
                  {activePhoto.caption}
                </div>
              )}
            </div>
          ) : (
            <div className='w-full aspect-4/3 flex items-center justify-center text-muted-foreground font-mono text-xs bg-zinc-950'>
              No photos for this stage
            </div>
          )}

          {/* Thumbnail strip */}
          {displayedPhotos.length > 1 && (
            <div className='flex gap-1.5 px-4 py-3 border-t border-border overflow-x-auto'>
              {displayedPhotos.map((ph, i) => (
                <button
                  key={ph.id}
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    'group/thumb relative shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-all cursor-pointer bg-transparent p-0',
                    i === activeIdx
                      ? 'border-amber-500 opacity-100'
                      : 'border-border opacity-50 hover:opacity-100',
                  )}
                >
                  <img
                    src={ph.image}
                    alt={ph.caption}
                    className='w-full h-full object-cover'
                  />
                  {user && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm('Are you sure you want to delete this photo?')
                        ) {
                          deletePhoto.mutate(ph.id);
                        } else {
                          return;
                        }
                      }}
                      className='absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity cursor-pointer'
                    >
                      <span className='text-red-400 text-lg leading-none'>
                        ×
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Upload zone */}
          {user && (
            <div className='px-4 pb-4 pt-3 border-t border-border'>
              <div className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2.5'>
                Restoration Photos ({photos.length})
              </div>
              <UploadZone onUpload={handleUpload} />
            </div>
          )}
        </div>

        {/* RIGHT: Details panel */}
        <div className='flex-1 space-y-5 min-w-0'>
          {/* Financials */}
          <section className='rounded-xl border border-border bg-card overflow-hidden'>
            <div className='flex justify-between px-4 py-2.5 border-b border-border'>
              <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                Details
              </span>
              {user && (
                <Link
                  to='/watches/$watchId/edit'
                  params={{ watchId }}
                  className='font-mono text-[10px] text-muted-foreground'
                >
                  Edit
                </Link>
              )}
            </div>
            {[
              [
                'Condition',
                capitalize(watch.condition_bought?.replace('_', ' ')) ?? '—',
              ],
              ['Purchase Price', fmt(watch.bought_price)],
              ['Parts Cost', fmt(watch.parts_cost)],
              [
                'Total Invested',
                fmt(watch.bought_price + (watch.parts_cost ?? 0)),
              ],
              ['Sale Price', fmt(watch.sold_price)],
              [
                'Profit',
                p !== null ? (
                  <span className={p >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {fmt(p)}
                  </span>
                ) : (
                  '—'
                ),
              ],
              [
                'ROI',
                r !== null ? (
                  <span
                    className={
                      parseFloat(r) >= 0 ? 'text-green-400' : 'text-red-400'
                    }
                  >
                    {fmtPct(r)}
                  </span>
                ) : (
                  '—'
                ),
              ],
              ['Hours Spent', `${watch.hours_spent ?? 0} hrs`],
              [
                'Acquired',
                watch.bought_date
                  ? format(watch.bought_date, 'MMM d, yyyy')
                  : '—',
              ],
              ['Sold', watch.sold_date ?? '—'],
            ].map(([k, v]) => (
              <div
                key={String(k)}
                className='flex justify-between items-center gap-4 px-4 py-2.5 border-b border-border last:border-0 hover:bg-white/2 transition-colors'
              >
                <span className='font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground'>
                  {k}
                </span>
                <span className='font-mono text-[11.5px] text-foreground'>
                  {v}
                </span>
              </div>
            ))}
          </section>

          {/* Parts Used */}
          <section className='rounded-xl border border-border bg-card overflow-hidden'>
            <div className='flex items-center justify-between px-4 py-2.5 border-b border-border'>
              <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                Parts Used
              </span>
              {user && <AddPartUsedDialog watchId={watchId} />}
            </div>
            {partsUsed.length === 0 ? (
              <p className='px-4 py-3 font-mono text-xs italic text-muted-foreground/50'>
                No parts logged yet.
              </p>
            ) : (
              <>
                <table className='w-full text-xs font-mono'>
                  <thead>
                    <tr className='border-b border-border bg-muted/40'>
                      <th className='px-3.5 py-2 text-left text-[9.5px] uppercase tracking-wider text-muted-foreground font-medium'>Part</th>
                      <th className='px-3.5 py-2 text-right text-[9.5px] uppercase tracking-wider text-muted-foreground font-medium'>Qty</th>
                      <th className='px-3.5 py-2 text-right text-[9.5px] uppercase tracking-wider text-muted-foreground font-medium'>Unit</th>
                      <th className='px-3.5 py-2 text-right text-[9.5px] uppercase tracking-wider text-muted-foreground font-medium'>Total</th>
                      {user && <th className='px-3.5 py-2 w-6' />}
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border'>
                    {partsUsed.map((part) => {
                      const unitCost = part.expand?.inventory_item?.unit_cost ?? 0;
                      const total = (part.qty_used ?? 0) * unitCost;
                      return (
                        <tr key={part.id} className='hover:bg-white/2 transition-colors'>
                          <td className='px-3.5 py-2.5 text-foreground'>
                            {part.expand?.inventory_item?.name ?? '—'}
                          </td>
                          <td className='px-3.5 py-2.5 text-right text-muted-foreground'>
                            {part.qty_used}
                          </td>
                          <td className='px-3.5 py-2.5 text-right text-muted-foreground'>
                            {fmt(unitCost)}
                          </td>
                          <td className='px-3.5 py-2.5 text-right text-foreground'>
                            {fmt(total)}
                          </td>
                          {user && (
                            <td className='px-3.5 py-2.5 text-right'>
                              <button
                                onClick={() => {
                                  if (confirm('Remove this part from the log?')) {
                                    deletePartUsed.mutate(part.id);
                                  }
                                }}
                                className='text-muted-foreground hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer text-base leading-none p-0'
                                aria-label='Remove part'
                              >
                                ×
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className='border-t border-border bg-muted/20'>
                      <td colSpan={user ? 3 : 3} className='px-3.5 py-2 text-right text-[9.5px] uppercase tracking-wider text-muted-foreground font-medium'>
                        Total
                      </td>
                      <td className='px-3.5 py-2 text-right font-semibold text-foreground'>
                        {fmt(watch.parts_cost)}
                      </td>
                      {user && <td />}
                    </tr>
                  </tfoot>
                </table>
              </>
            )}
          </section>

          {/* Repair Log */}
          <section className='rounded-xl border border-border bg-card overflow-hidden'>
            <div className='flex items-center justify-between px-4 py-2.5 border-b border-border'>
              <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                Repair Log
              </span>
              <Link
                to='/watches/$watchId/posts'
                params={{ watchId }}
                className='text-xs font-mono text-primary hover:text-primary/80 no-underline'
              >
                View all ({postCount})
              </Link>
            </div>
            {postCount === 0 ? (
              <div className='text-center py-6 text-xs font-mono text-muted-foreground'>
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
              <ul className='divide-y divide-border'>
                {posts!.slice(0, 5).map((post) => (
                  <li key={post.id}>
                    <Link
                      to='/watches/$watchId/posts/$postId'
                      params={{ watchId, postId: post.id }}
                      className='flex items-center justify-between px-4 py-2.5 hover:bg-white/2 transition-colors no-underline'
                    >
                      <span className='text-sm text-foreground'>
                        {post.title}
                      </span>
                      <span className='text-[11px] font-mono text-muted-foreground shrink-0 ml-3'>
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
                      className='block text-center text-xs font-mono text-muted-foreground hover:text-primary py-2.5 no-underline'
                    >
                      + {postCount - 5} more
                    </Link>
                  </li>
                )}
              </ul>
            )}
            {user && postCount > 0 && (
              <div className='px-4 py-2.5 border-t border-border'>
                <Link
                  to='/watches/$watchId/posts/new'
                  params={{ watchId }}
                  className='text-xs font-mono text-primary hover:text-primary/80 no-underline'
                >
                  + New session
                </Link>
              </div>
            )}
          </section>

          {/* Notes */}
          <section className='rounded-xl border border-border bg-card overflow-hidden'>
            <div className='flex items-center justify-between px-4 py-2.5 border-b border-border'>
              <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                Notes
              </span>
              {user && !editingNotes && (
                <button
                  onClick={() => {
                    setDraftNotes(watch.notes ?? '');
                    setEditingNotes(true);
                  }}
                  className='text-xs font-mono text-primary hover:text-primary/80 bg-transparent border-none cursor-pointer p-0'
                >
                  Edit
                </button>
              )}
            </div>
            <div className='px-4 py-3'>
              {editingNotes ? (
                <div className='space-y-3'>
                  <TipTapEditor
                    value={draftNotes}
                    onChange={setDraftNotes}
                    toolbarConfig={{
                      headings: [true, true, true],
                      bold: true,
                      italic: true,
                      strike: true,
                      bulletList: true,
                      orderedList: true,
                    }}
                  />
                  <div className='flex gap-3'>
                    <button
                      onClick={() => {
                        updateWatch.mutate({ ...watch, notes: draftNotes });
                        setEditingNotes(false);
                      }}
                      disabled={updateWatch.isPending}
                      className='text-xs font-mono text-primary hover:text-primary/80 disabled:opacity-50 bg-transparent border-none cursor-pointer p-0'
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingNotes(false)}
                      className='text-xs font-mono text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer p-0'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : !!watch.notes ? (
                <div
                  className='prose text-sm max-w-none'
                  dangerouslySetInnerHTML={{ __html: watch.notes }}
                />
              ) : (
                <p className='font-mono text-xs italic text-muted-foreground/50'>
                  No notes yet.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          startIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
