import DOMPurify from 'dompurify';
import { useState, useRef } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  useGetWatchById,
  useDeleteWatchPhoto,
  useUpdateWatch,
  useUploadWatchPhotos,
  useDeleteWatch,
  useUploadFeaturedImage,
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
import { useGetTimegrapherReadings } from '#/hooks/timegrapher';
import { useGetPartsShoppingList } from '#/hooks/watch-parts-shopping-list';
import { useCompletedWorkSessions } from '#/hooks/workSessions';
import { useSubscription } from '#/hooks/subscription';
import { UpgradeButton } from '#/components/primitives/UpgradeButton';
import { FREE_PHOTO_LIMIT } from '#/lib/constants';
import { capitalize } from 'lodash-es';
import { Button } from '#/components/ui/button';
import {
  LockIcon,
  Trash2Icon,
  ImagePlusIcon,
  UploadCloudIcon,
  PencilIcon,
  CameraIcon,
  TimerIcon,
} from 'lucide-react';
import { StatusPicker } from '#/components/watches/StatusPicker';
import { Skeleton } from '#/components/ui/skeleton';

export const Route = createFileRoute('/watches/$watchId/')({
  component: RouteComponent,
});

type Tab = 'log' | 'timegrapher' | 'parts' | 'notes';

function RouteComponent() {
  const navigate = useNavigate();
  const { watchId } = Route.useParams();
  const { data: watch, isLoading } = useGetWatchById(watchId);
  const { data: user } = useUser();
  const { data: posts } = useGetPostsByWatch(watchId);
  const postCount = posts?.length ?? 0;
  const deletePhoto = useDeleteWatchPhoto(watchId);
  const uploadPhotos = useUploadWatchPhotos(watchId);
  const uploadFeaturedImage = useUploadFeaturedImage(watchId);
  const updateWatch = useUpdateWatch();
  const deleteWatch = useDeleteWatch();
  const deletePartUsed = useDeletePartUsed(watchId);
  const { data: timegrapherReadings = [] } = useGetTimegrapherReadings(watchId);
  const { data: partsShoppingItems = [] } = useGetPartsShoppingList(watchId);
  const { data: completedSessions = [] } = useCompletedWorkSessions(watchId);
  const { isPro } = useSubscription();

  const totalSessionSeconds = completedSessions.reduce(
    (sum, s) => sum + (s.final_duration_seconds ?? 0),
    0,
  );
  const totalSessionHours =
    totalSessionSeconds > 0
      ? (() => {
          const h = Math.floor(totalSessionSeconds / 3600);
          const m = Math.floor((totalSessionSeconds % 3600) / 60);
          return h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`;
        })()
      : '—';

  const [stageFilter, setStageFilter] = useState<string>('all');
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState<{
    photos: WatchPhoto[];
    index: number;
  } | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [draftNotes, setDraftNotes] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('log');
  const featuredInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return <SkeletonLoader />;
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

  const isFrozen = !!watch.is_frozen && !isPro;
  const photos = watch.photos ?? [];
  const canUploadPhotos =
    !isFrozen && (isPro || photos.length < FREE_PHOTO_LIMIT);
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

  const handleFeaturedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFeaturedImage.mutate(file);
    e.target.value = '';
  };

  const partsUsed = watch.expand?.parts_used_via_watch ?? [];
  const p = profit(watch);
  const r = roi(watch);

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'log', label: 'Repair Log', badge: postCount },
    { id: 'timegrapher', label: 'Timegrapher' },
    { id: 'parts', label: 'Parts' },
    { id: 'notes', label: 'Notes' },
  ];

  return (
    <div className='space-y-5 min-w-0'>
      {/* Back link */}
      <Link
        to='/watches'
        className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
      >
        ← Back to Watches
      </Link>

      {/* Frozen banner */}
      {isFrozen && (
        <div className='flex items-center gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3'>
          <LockIcon className='w-4 h-4 text-amber-400 shrink-0' />
          <div className='flex-1 min-w-0'>
            <p className='font-mono text-xs text-foreground'>
              This project is frozen — you&apos;ve reached the 2-project limit
              on the free plan.
            </p>
            <p className='font-mono text-[11px] text-muted-foreground mt-0.5'>
              Archive another watch or{' '}
              <Link to='/pro' className='text-amber-400 hover:text-amber-300'>
                upgrade to Pro
              </Link>{' '}
              to edit.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex items-start gap-3'>
          {/* Featured image avatar */}
          {user && (
            <div className='relative group/avatar shrink-0 mt-0.5'>
              <input
                ref={featuredInputRef}
                type='file'
                accept='image/*'
                className='sr-only'
                onChange={handleFeaturedFileChange}
              />
              <button
                type='button'
                onClick={() => !isFrozen && featuredInputRef.current?.click()}
                disabled={uploadFeaturedImage.isPending || isFrozen}
                className='relative w-12 h-12 rounded-lg overflow-hidden border border-border bg-zinc-900 cursor-pointer p-0 block disabled:opacity-50'
                aria-label={
                  watch.featured_image_url
                    ? 'Change featured image'
                    : 'Set featured image'
                }
              >
                {watch.featured_image_url ? (
                  <img
                    src={watch.featured_image_url}
                    alt='Featured'
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <ImagePlusIcon className='w-4 h-4 text-muted' />
                  </div>
                )}
                <div className='absolute inset-0 flex items-center justify-center bg-black/0 group-hover/avatar:bg-black/50 transition-all rounded-lg'>
                  <PencilIcon className='w-4 h-4 text-muted opacity-0 group-hover/avatar:opacity-100 transition-opacity' />
                </div>
              </button>
              {uploadFeaturedImage.isPending && (
                <div className='absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 pointer-events-none'>
                  <span className='font-mono text-[8px] text-white'>…</span>
                </div>
              )}
            </div>
          )}
          <div>
            <h1 className='text-2xl font-serif font-semibold text-foreground'>
              {watch.make} {watch.model}
            </h1>
            <div className='mt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-muted-foreground'>
              <span>{watch.reference}</span>
              <span className='text-muted-foreground/60'>·</span>
              <span>{watch.year}</span>
              <span className='text-muted-foreground/60'>·</span>
              {user ? (
                <StatusPicker watch={watch} disabled={watch.is_frozen} />
              ) : (
                <StatusBadge status={watch.status} />
              )}
            </div>
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
          {user && !isFrozen && (
            <Link
              to='/watches/$watchId/edit'
              params={{ watchId }}
              className='text-muted-foreground hover:text-foreground no-underline'
            >
              Edit Watch
            </Link>
          )}
        </div>
      </div>

      {/* Two-column body */}
      <div className='flex flex-col md:flex-row gap-6 items-start'>
        {/* LEFT: Photo panel */}
        <div className='w-full md:w-[54%] shrink-0 rounded-xl border border-border overflow-hidden bg-card'>
          {photos.length === 0 ? (
            /* Empty state — inline upload zone */
            <div>
              <div className='flex flex-col items-center px-6 pt-8 pb-1 text-center'>
                <div className='w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3'>
                  <CameraIcon className='w-4.5 h-4.5 text-zinc-200' />
                </div>
                <p className='font-mono text-sm text-foreground/80 mb-1'>
                  No photos yet
                </p>
                <p className='font-mono text-xs text-muted-foreground max-w-60 leading-relaxed'>
                  Document each stage — before, during, after, and listing
                  shots.
                </p>
              </div>
              {user && !isFrozen && (
                <div className='px-4 pb-5'>
                  {canUploadPhotos ? (
                    <>
                      <UploadZone
                        onUpload={handleUpload}
                        currentCount={!isPro ? photos.length : undefined}
                        limit={!isPro ? FREE_PHOTO_LIMIT : undefined}
                      />
                      {uploadPhotos.isError && (
                        <p
                          role='alert'
                          className='mt-2 font-mono text-[11px] text-red-400'
                        >
                          {(uploadPhotos.error as Error)?.message ??
                            'Upload failed. Please try again.'}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className='mt-4 flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-border py-6'>
                      <LockIcon className='w-4 h-4 text-amber-400' />
                      <p className='font-mono text-xs text-muted-foreground'>
                        {FREE_PHOTO_LIMIT} photo limit reached
                      </p>
                      <UpgradeButton pbUserId={user.id} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Has photos — full viewer */
            <>
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
                  {user && !isFrozen && (
                    <div className='absolute top-2 right-2'>
                      <Button
                        className='cursor-pointer'
                        size='icon'
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              'Are you sure you want to delete this photo?',
                            )
                          ) {
                            deletePhoto.mutate(activePhoto.id);
                          }
                        }}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  )}
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
              {displayedPhotos.sort((a, b) => {
                // If photos have a sort_order, use it. Otherwise, fall back to created date.
                const aOrder =
                  a.sort_order ?? new Date(a.created ?? new Date()).getTime();
                const bOrder =
                  b.sort_order ?? new Date(b.created ?? new Date()).getTime();
                return bOrder - aOrder;
              }).length > 1 && (
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
                    </button>
                  ))}
                </div>
              )}

              {/* Compact photo-actions footer */}
              {user && !isFrozen && (
                <>
                  <div className='flex items-center px-4 py-2.5 border-t border-border'>
                    <button
                      type='button'
                      onClick={() => setShowUpload((v) => !v)}
                      className='flex items-center gap-1.5 text-[10.5px] font-mono text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer p-0'
                    >
                      <UploadCloudIcon className='w-3.5 h-3.5' />
                      Upload photos ({photos.length})
                    </button>
                  </div>
                  {showUpload && (
                    <div className='px-4 pb-4 border-t border-border'>
                      {canUploadPhotos ? (
                        <div className='mt-3 space-y-2'>
                          <UploadZone
                            onUpload={handleUpload}
                            currentCount={!isPro ? photos.length : undefined}
                            limit={!isPro ? FREE_PHOTO_LIMIT : undefined}
                          />
                          {uploadPhotos.isError && (
                            <p
                              role='alert'
                              className='font-mono text-[11px] text-red-400'
                            >
                              {(uploadPhotos.error as Error)?.message ??
                                'Upload failed. Please try again.'}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className='flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-border py-6 mt-3'>
                          <LockIcon className='w-4 h-4 text-amber-400' />
                          <p className='font-mono text-xs text-muted-foreground'>
                            {FREE_PHOTO_LIMIT} photo limit reached
                          </p>
                          <UpgradeButton pbUserId={user.id} />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* RIGHT: Details + Tabs panel */}
        <div className='w-full space-y-4 min-w-0'>
          {/* Financial KPI grid */}
          <div className='grid grid-cols-2 gap-2'>
            {(
              [
                [
                  'Invested',
                  fmt(watch.bought_price + (watch.parts_cost ?? 0)),
                  null,
                ],
                ['Sale Price', fmt(watch.sold_price), null],
                [
                  'Profit',
                  p !== null ? fmt(p) : '—',
                  p !== null
                    ? p >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                    : null,
                ],
                [
                  'ROI',
                  r !== null ? fmtPct(r) : '—',
                  r !== null
                    ? parseFloat(r) >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                    : null,
                ],
              ] as [string, string, string | null][]
            ).map(([label, value, colorClass]) => (
              <div
                key={label}
                className='rounded-lg border border-border bg-card px-3 py-2.5'
              >
                <div className='font-mono text-[9.5px] uppercase tracking-widest text-muted-foreground'>
                  {label}
                </div>
                <div
                  className={cn(
                    'font-mono text-[13px] font-semibold mt-0.5',
                    colorClass ?? 'text-foreground',
                  )}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Compact watch details */}
          <section className='rounded-xl border border-border bg-card overflow-hidden'>
            <div className='flex items-center justify-between px-4 py-2.5 border-b border-border'>
              <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                Details
              </span>
              {user && !isFrozen && (
                <Link
                  to='/watches/$watchId/edit'
                  params={{ watchId }}
                  className='font-mono text-[10px] text-muted-foreground hover:text-foreground no-underline'
                >
                  Edit
                </Link>
              )}
            </div>
            <div className='grid grid-cols-2 divide-x divide-border'>
              <div className='divide-y divide-border'>
                {(
                  [
                    [
                      'Condition',
                      capitalize(watch.condition_bought?.replace('_', ' ')) ??
                        '—',
                    ],
                    ['Purchase', fmt(watch.bought_price)],
                    ['Parts Cost', fmt(watch.parts_cost)],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className='flex flex-col px-3 py-2'>
                    <span className='font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground'>
                      {k}
                    </span>
                    <span className='font-mono text-[11px] text-foreground mt-0.5'>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
              <div className='divide-y divide-border'>
                {(
                  [
                    ['Hours', totalSessionHours],
                    [
                      'Acquired',
                      watch.bought_date
                        ? format(watch.bought_date, 'MMM d, yyyy')
                        : '—',
                    ],
                    [
                      'Sold',
                      watch.sold_date
                        ? format(
                            new Date(watch.sold_date as string),
                            'MMM d, yyyy',
                          )
                        : '—',
                    ],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className='flex flex-col px-3 py-2'>
                    <span className='font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground'>
                      {k}
                    </span>
                    <span className='font-mono text-[11px] text-foreground mt-0.5'>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Time Tracker card */}
          {isPro ? (
            <Link
              to='/watches/$watchId/time'
              params={{ watchId }}
              className='relative block rounded-xl border border-border bg-card overflow-hidden no-underline group hover:border-amber-500/40 transition-colors before:absolute before:left-3.5 before:right-3.5 before:top-0 before:h-0.5 before:bg-amber-500 before:rounded-b-sm'
            >
              <div className='flex items-center justify-between px-4 py-3.5'>
                <div className='flex items-center gap-3'>
                  <TimerIcon className='w-4 h-4 text-amber-500 shrink-0' />
                  <div>
                    <div className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                      Time Tracker
                    </div>
                    <div className='font-mono text-sm font-semibold text-foreground mt-0.5'>
                      {totalSessionHours}
                    </div>
                  </div>
                </div>
                <span className='font-mono text-[10px] text-muted-foreground group-hover:text-foreground transition-colors'>
                  Track Time →
                </span>
              </div>
            </Link>
          ) : (
            <div className='rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 overflow-hidden shadow-[0_0_16px_rgba(245,158,11,0.06)]'>
              <div className='flex items-center justify-between px-4 py-3.5'>
                <div className='flex items-center gap-3'>
                  <LockIcon className='w-4 h-4 text-amber-400 shrink-0' />
                  <div>
                    <div className='flex items-center gap-2'>
                      <span className='font-mono text-[10px] uppercase tracking-widest text-amber-500/80'>
                        Time Tracker
                      </span>
                      <span className='inline-flex items-center px-1.5 py-0.5 rounded-full font-mono text-[8px] tracking-widest border border-amber-500/40 bg-amber-500/10 text-amber-500 uppercase'>
                        Pro
                      </span>
                    </div>
                    <div className='font-mono text-[11px] text-muted-foreground mt-0.5'>
                      Track hours per session with pause &amp; resume
                    </div>
                  </div>
                </div>
                {user && <UpgradeButton pbUserId={user.id} />}
              </div>
            </div>
          )}

          {/* Tabbed workflow sections */}
          <div className='rounded-xl border border-border bg-card overflow-hidden'>
            <div className='flex border-b border-border overflow-x-auto overflow-y-hidden'>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex-1 px-3 py-2.5 font-mono text-[9.5px] uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 -mb-px cursor-pointer bg-transparent border-l-0 border-r-0 border-t-0',
                    activeTab === tab.id
                      ? 'border-amber-500 text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={cn(
                        'ml-1.5 text-[8px]',
                        activeTab === tab.id
                          ? 'text-amber-500'
                          : 'text-muted-foreground/60',
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Repair Log tab */}
            {activeTab === 'log' && (
              <div>
                {postCount === 0 ? (
                  <div className='text-center py-8 text-xs font-mono text-muted-foreground'>
                    No repair sessions yet.{' '}
                    {user && !isFrozen && (
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
                  <>
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
                                ? format(
                                    new Date(post.session_date),
                                    'MMM d, yyyy',
                                  )
                                : '—'}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <div className='flex items-center justify-between px-4 py-2.5 border-t border-border'>
                      {user && !isFrozen && (
                        <Link
                          to='/watches/$watchId/posts/new'
                          params={{ watchId }}
                          className='text-xs font-mono text-primary hover:text-primary/80 no-underline'
                        >
                          + New session
                        </Link>
                      )}
                      {postCount > 5 && (
                        <Link
                          to='/watches/$watchId/posts'
                          params={{ watchId }}
                          className='text-xs font-mono text-muted-foreground hover:text-primary no-underline ml-auto'
                        >
                          View all ({postCount}) →
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Timegrapher tab */}
            {activeTab === 'timegrapher' && (
              <div>
                {timegrapherReadings.length === 0 ? (
                  <div className='text-center py-8 text-xs font-mono text-muted-foreground'>
                    No timegrapher sessions yet.{' '}
                    {user && !isFrozen && (
                      <Link
                        to='/watches/$watchId/timegrapher'
                        params={{ watchId }}
                        className='text-primary'
                      >
                        Log the first one →
                      </Link>
                    )}
                  </div>
                ) : (
                  (() => {
                    const latest = timegrapherReadings[0];
                    const rows = isPro
                      ? [
                          [
                            'DU Rate',
                            latest.du_rate != null
                              ? `${latest.du_rate >= 0 ? '+' : ''}${latest.du_rate.toFixed(1)} s/d`
                              : '—',
                          ],
                          [
                            'DU Amplitude',
                            latest.du_amp != null ? `${latest.du_amp}°` : '—',
                          ],
                          [
                            'DU Beat Error',
                            latest.du_be != null
                              ? `${latest.du_be.toFixed(1)} ms`
                              : '—',
                          ],
                        ]
                      : [
                          [
                            'Avg Rate',
                            latest.du_rate != null
                              ? `${latest.du_rate >= 0 ? '+' : ''}${latest.du_rate.toFixed(1)} s/d`
                              : '—',
                          ],
                          [
                            'Avg Amplitude',
                            latest.du_amp != null ? `${latest.du_amp}°` : '—',
                          ],
                        ];
                    return (
                      <div>
                        <div className='divide-y divide-border'>
                          {rows.map(([k, v]) => (
                            <div
                              key={String(k)}
                              className='flex justify-between items-center px-4 py-2.5 hover:bg-white/2 transition-colors'
                            >
                              <span className='font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground'>
                                {k}
                              </span>
                              <span className='font-mono text-[11.5px] text-foreground'>
                                {v}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className='px-4 py-2.5 border-t border-border'>
                          <Link
                            to='/watches/$watchId/timegrapher'
                            params={{ watchId }}
                            className='text-xs font-mono text-primary hover:text-primary/80 no-underline'
                          >
                            Full log ({timegrapherReadings.length}) →
                          </Link>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            )}

            {/* Parts tab */}
            {activeTab === 'parts' && (
              <div>
                {/* Parts Used */}
                <div className='border-b border-border'>
                  <div className='flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border'>
                    <span className='font-mono text-[9.5px] uppercase tracking-widest text-muted-foreground'>
                      Parts Used
                    </span>
                    {user && !isFrozen && (
                      <AddPartUsedDialog watchId={watchId} />
                    )}
                  </div>
                  {partsUsed.length === 0 ? (
                    <p className='px-4 py-3 font-mono text-xs italic text-muted-foreground/50'>
                      No parts logged yet.
                    </p>
                  ) : (
                    <table className='w-full text-xs font-mono'>
                      <thead>
                        <tr className='border-b border-border bg-muted/20'>
                          <th className='px-3.5 py-2 text-left text-[9.5px] uppercase tracking-wider text-muted-foreground font-medium'>
                            Part
                          </th>
                          <th className='px-3.5 py-2 text-right text-[9.5px] uppercase tracking-wider text-muted-foreground font-medium'>
                            Qty
                          </th>
                          <th className='px-3.5 py-2 text-right text-[9.5px] uppercase tracking-wider text-muted-foreground font-medium'>
                            Unit
                          </th>
                          <th className='px-3.5 py-2 text-right text-[9.5px] uppercase tracking-wider text-muted-foreground font-medium'>
                            Total
                          </th>
                          {user && <th className='px-3.5 py-2 w-6' />}
                        </tr>
                      </thead>
                      <tbody className='divide-y divide-border'>
                        {partsUsed.map((part) => {
                          const unitCost =
                            part.expand?.inventory_item?.unit_cost ?? 0;
                          const total = (part.qty_used ?? 0) * unitCost;
                          return (
                            <tr
                              key={part.id}
                              className='hover:bg-white/2 transition-colors'
                            >
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
                              {user && !isFrozen && (
                                <td className='px-3.5 py-2.5 text-right'>
                                  <button
                                    onClick={() => {
                                      if (
                                        confirm(
                                          'Remove this part from the log?',
                                        )
                                      ) {
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
                          <td
                            colSpan={3}
                            className='px-3.5 py-2 text-right text-[9.5px] uppercase tracking-wider text-muted-foreground font-medium'
                          >
                            Total
                          </td>
                          <td className='px-3.5 py-2 text-right font-semibold text-foreground'>
                            {fmt(watch.parts_cost)}
                          </td>
                          {user && <td />}
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>

                {/* Parts Shopping List */}
                <div>
                  <div className='flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border'>
                    <div className='flex items-center gap-2'>
                      <span className='font-mono text-[9.5px] uppercase tracking-widest text-muted-foreground'>
                        Shopping List
                      </span>
                      {!isPro && (
                        <span className='inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-400'>
                          <LockIcon className='w-2.5 h-2.5' />
                          Pro
                        </span>
                      )}
                    </div>
                    {isPro && (
                      <Link
                        to='/watches/$watchId/shopping-list'
                        params={{ watchId }}
                        className='text-xs font-mono text-primary hover:text-primary/80 no-underline'
                      >
                        View all ({partsShoppingItems.length})
                      </Link>
                    )}
                  </div>
                  {!isPro ? (
                    <div className='relative'>
                      <div
                        className='divide-y divide-border blur-sm select-none pointer-events-none'
                        aria-hidden
                      >
                        {[
                          ['Mainspring', 'Needed'],
                          ['Crystal', 'Ordered'],
                          ['Crown', 'In Hand'],
                        ].map(([k, v]) => (
                          <div
                            key={String(k)}
                            className='flex justify-between items-center px-4 py-2.5'
                          >
                            <span className='font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground'>
                              {k}
                            </span>
                            <span className='font-mono text-[11.5px] text-foreground'>
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className='absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-card/70 backdrop-blur-[2px]'>
                        <LockIcon className='w-4 h-4 text-amber-400' />
                        <p className='font-mono text-xs text-muted-foreground'>
                          Parts shopping list is a Pro feature
                        </p>
                        {user && <UpgradeButton pbUserId={user.id} />}
                      </div>
                    </div>
                  ) : partsShoppingItems.length === 0 ? (
                    <div className='text-center py-6 text-xs font-mono text-muted-foreground'>
                      No parts on the list yet.{' '}
                      {user && (
                        <Link
                          to='/watches/$watchId/shopping-list'
                          params={{ watchId }}
                          className='text-primary'
                        >
                          Add the first one →
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className='divide-y divide-border'>
                      {[
                        [
                          'Needed',
                          partsShoppingItems.filter(
                            (i) => i.status === 'needed',
                          ).length,
                        ],
                        [
                          'Ordered',
                          partsShoppingItems.filter(
                            (i) => i.status === 'ordered',
                          ).length,
                        ],
                        [
                          'In Hand',
                          partsShoppingItems.filter(
                            (i) => i.status === 'in_hand',
                          ).length,
                        ],
                      ].map(([k, v]) => (
                        <div
                          key={String(k)}
                          className='flex justify-between items-center px-4 py-2.5 hover:bg-white/2 transition-colors'
                        >
                          <span className='font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground'>
                            {k}
                          </span>
                          <span className='font-mono text-[11.5px] text-foreground'>
                            {v}
                          </span>
                        </div>
                      ))}
                      <div className='px-4 py-2.5'>
                        <Link
                          to='/watches/$watchId/shopping-list'
                          params={{ watchId }}
                          className='text-xs font-mono text-primary hover:text-primary/80 no-underline'
                        >
                          Full list →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes tab */}
            {activeTab === 'notes' && (
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
                ) : (
                  <div>
                    {!!watch.notes ? (
                      <div
                        className='prose text-sm max-w-none'
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(watch.notes ?? ''),
                        }}
                      />
                    ) : (
                      <p className='font-mono text-xs italic text-muted-foreground/50'>
                        No notes yet.
                      </p>
                    )}
                    {user && !isFrozen && (
                      <button
                        onClick={() => {
                          setDraftNotes(watch.notes ?? '');
                          setEditingNotes(true);
                        }}
                        className='mt-2 text-xs font-mono text-primary hover:text-primary/80 bg-transparent border-none cursor-pointer p-0'
                      >
                        {watch.notes ? 'Edit notes' : 'Add notes'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Delete watch */}
          <section className='flex justify-end'>
            <Button
              disabled={deleteWatch.isPending}
              onClick={async (e) => {
                e.preventDefault();
                if (
                  confirm(
                    'Are you sure you want to delete this watch? All associated photos, and part usage will also be deleted.',
                  )
                ) {
                  await deleteWatch.mutateAsync(watch.id);
                  navigate({ to: '/dashboard' });
                }
              }}
              size='sm'
              variant='link'
            >
              <Trash2Icon />
              Delete this watch
            </Button>
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

const SkeletonLoader = () => {
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-between'>
        <div className='flex gap-2'>
          <Skeleton className='size-14' />
          <div className='flex flex-col justify-between'>
            <Skeleton className='w-24 h-5' />
            <Skeleton className='w-32 h-4' />
          </div>
        </div>
        <Skeleton className='w-20 h-4' />
      </div>
      <div className='flex flex-col md:flex-row gap-6 items-start'>
        <Skeleton className='w-full md:w-1/2 shrink-0 rounded-xl h-128' />
        <div className='flex flex-col gap-4 w-full'>
          <div className='grid grid-cols-2 gap-2'>
            <Skeleton className='rounded-xl h-12'></Skeleton>
            <Skeleton className='rounded-xl h-12'></Skeleton>
            <Skeleton className='rounded-xl h-12'></Skeleton>
            <Skeleton className='rounded-xl h-12'></Skeleton>
          </div>
          <Skeleton className='w-full h-54 rounded-xl' />
          <Skeleton className='w-full h-18 rounded-xl' />
          <Skeleton className='w-full h-24 rounded-xl' />
        </div>
      </div>
    </div>
  );
};
