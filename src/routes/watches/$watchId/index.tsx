import DOMPurify from 'dompurify';
import { useState, useRef } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
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
  CopyIcon,
} from 'lucide-react';
import { StatusPicker } from '#/components/watches/StatusPicker';
import { Skeleton } from '#/components/ui/skeleton';
import { useAuth } from '#/hooks/auth';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog';
import { Label } from '#/components/ui/label';
import { Input } from '#/components/ui/input';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip';

export const Route = createFileRoute('/watches/$watchId/')({
  component: RouteComponent,
});

type Tab = 'log' | 'timegrapher' | 'parts' | 'notes';

function RouteComponent() {
  const { t } = useTranslation();
  const [confirmText, setConfirmText] = useState('');
  const navigate = useNavigate();
  const { watchId } = Route.useParams();
  const { data: watch, isLoading } = useGetWatchById(watchId);
  const { data: user } = useUser();
  const { profile } = useAuth();
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

  const performDelete = async () => {
    if (confirmText === t('delete').toLocaleUpperCase()) {
      await deleteWatch.mutateAsync(watchId);
      navigate({ to: '/dashboard' });
    }
  };

  const totalSessionSeconds = completedSessions.reduce(
    (sum, s) => sum + (s.final_duration_seconds ?? 0),
    0,
  );
  const totalSessionHours =
    totalSessionSeconds > 0
      ? (() => {
          const h = Math.floor(totalSessionSeconds / 3600);
          const m = Math.floor((totalSessionSeconds % 3600) / 60);
          return h > 0 && m > 0
            ? `${h}${t('unitH')} ${m}${t('unitM')}`
            : h > 0
              ? `${h}${t('unitH')}`
              : `${m}${t('unitM')}`;
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
          {t('watchesBackToWatches')}
        </Link>
        <div className='text-sm text-red-400 font-mono'>
          {t('equipmentItemNotFound')}
        </div>
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
    { id: 'log', label: t('watchTabRepairLog'), badge: postCount },
    { id: 'timegrapher', label: t('watchTabTimegrapher') },
    { id: 'parts', label: t('watchTabParts') },
    { id: 'notes', label: t('watchTabNotes') },
  ];

  return (
    <div className='space-y-5 min-w-0'>
      {/* Back link */}
      <Link
        to='/watches'
        className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
      >
        {t('watchesBackToWatches')}
      </Link>

      {/* Frozen banner */}
      {isFrozen && (
        <div className='flex items-center gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3'>
          <LockIcon className='w-4 h-4 text-amber-400 shrink-0' />
          <div className='flex-1 min-w-0'>
            <p className='font-mono text-xs text-foreground'>
              {t('watchFrozenTitle')}
            </p>
            <p className='font-mono text-[11px] text-muted-foreground mt-0.5'>
              {t('watchFrozenArchive')}{' '}
              <Link to='/pro' className='text-amber-400 hover:text-amber-300'>
                {t('watchFrozenUpgradePro')}
              </Link>{' '}
              {t('watchFrozenToEdit')}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div className='flex items-center gap-3'>
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
                className='relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-zinc-900 cursor-pointer p-0 block disabled:opacity-50'
                aria-label={
                  watch.featured_image_url
                    ? t('featuredImageChange')
                    : t('featuredImageUpload')
                }
              >
                {watch.featured_image_url ? (
                  <img
                    src={watch.featured_image_url}
                    alt={t('placeholderFeaturedImageAlt')}
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
          <div className='justify-between flex flex-col h-full'>
            <h1 className='text-2xl font-serif font-semibold text-foreground'>
              {watch.make} {watch.model}
            </h1>
            <div className='item-center flex gap-1'>
              <div>
                <span className='text-xs font-mono'>{watch.id}</span>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant='ghost'
                    size='icon-xs'
                    onClick={() => {
                      navigator.clipboard.writeText(watch.id).then(() => {
                        toast.success('Watch ID copied to clipboard');
                      });
                    }}
                  >
                    <CopyIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='text-center'>{t('watchIdTooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
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
              {t('watchViewGallery')}
            </Link>
          )}
          {user && !isFrozen && (
            <Link
              to='/watches/$watchId/edit'
              params={{ watchId }}
              className='text-muted-foreground hover:text-foreground no-underline'
            >
              {t('watchDetailsEdit')}
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
                  {t('watchNoPhotos')}
                </p>
                <p className='font-mono text-xs text-muted-foreground max-w-60 leading-relaxed'>
                  {t('watchPhotosSubtitle')}
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
                            t('watchUploadFailed')}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className='mt-4 flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-border py-6'>
                      <LockIcon className='w-4 h-4 text-amber-400' />
                      <p className='font-mono text-xs text-muted-foreground'>
                        {t('watchPhotoLimitReached', {
                          limit: FREE_PHOTO_LIMIT,
                        })}
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
                          if (confirm(t('watchDeletePhotoConfirm'))) {
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
                  {t('watchNoPhotosStage')}
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
                      {t('watchUploadPhotos', { count: photos.length })}
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
                                t('watchUploadFailed')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className='flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-border py-6 mt-3'>
                          <LockIcon className='w-4 h-4 text-amber-400' />
                          <p className='font-mono text-xs text-muted-foreground'>
                            {t('watchPhotoLimitReached', {
                              limit: FREE_PHOTO_LIMIT,
                            })}
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
                  t('watchKpiInvested'),
                  fmt({
                    n: watch.bought_price + (watch.parts_cost ?? 0),
                    symbol: profile?.currency?.symbol ?? '',
                  }),
                  null,
                ],
                [
                  t('watchKpiSalePrice'),
                  fmt({
                    n: watch.sold_price,
                    symbol: profile?.currency?.symbol ?? '',
                  }),
                  null,
                ],
                [
                  t('watchKpiProfit'),
                  p !== null
                    ? fmt({
                        n: p,
                        symbol: profile?.currency?.symbol ?? '',
                      })
                    : '—',
                  p !== null
                    ? p >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                    : null,
                ],
                [
                  t('watchKpiRoi'),
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
                {t('watchDetailsSection')}
              </span>
              {user && !isFrozen && (
                <Link
                  to='/watches/$watchId/edit'
                  params={{ watchId }}
                  className='font-mono text-[10px] text-muted-foreground hover:text-foreground no-underline'
                >
                  {t('watchDetailsEdit')}
                </Link>
              )}
            </div>
            <div className='grid grid-cols-2 divide-x divide-border'>
              <div className='divide-y divide-border'>
                {(
                  [
                    [
                      t('watchDetailsCondition'),
                      capitalize(watch.condition_bought?.replace('_', ' ')) ??
                        '—',
                    ],
                    [
                      t('watchDetailsPurchase'),
                      fmt({
                        n: watch.bought_price,
                        symbol: profile?.currency?.symbol ?? '',
                      }),
                    ],
                    [
                      t('watchDetailsPartsCost'),
                      fmt({
                        n: watch.parts_cost,
                        symbol: profile?.currency?.symbol ?? '',
                      }),
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
              <div className='divide-y divide-border'>
                {(
                  [
                    [t('watchDetailsHours'), totalSessionHours],
                    [
                      t('watchDetailsAcquired'),
                      watch.bought_date ? format(watch.bought_date, 'PP') : '—',
                    ],
                    [
                      t('watchDetailsSold'),
                      watch.sold_date
                        ? format(new Date(watch.sold_date as string), 'PP')
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
                      {t('watchTimeTracker')}
                    </div>
                    <div className='font-mono text-sm font-semibold text-foreground mt-0.5'>
                      {totalSessionHours}
                    </div>
                  </div>
                </div>
                <span className='font-mono text-[10px] text-muted-foreground group-hover:text-foreground transition-colors'>
                  {t('watchTrackTime')}
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
                        {t('watchTimeTracker')}
                      </span>
                      {/* eslint-disable-next-line i18next/no-literal-string */}
                      <span className='inline-flex items-center px-1.5 py-0.5 rounded-full font-mono text-[8px] tracking-widest border border-amber-500/40 bg-amber-500/10 text-amber-500 uppercase'>
                        Pro
                      </span>
                    </div>
                    <div className='font-mono text-[11px] text-muted-foreground mt-0.5'>
                      {t('watchTimeTrackerHint')}
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
                    {t('watchNoRepairSessions')}{' '}
                    {user && !isFrozen && (
                      <Link
                        to='/watches/$watchId/posts/new'
                        params={{ watchId }}
                        className='text-primary'
                      >
                        {t('watchLogFirstSession')}
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
                                ? format(new Date(post.session_date), 'PP')
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
                          {t('watchNewSession')}
                        </Link>
                      )}
                      {postCount > 5 && (
                        <Link
                          to='/watches/$watchId/posts'
                          params={{ watchId }}
                          className='text-xs font-mono text-muted-foreground hover:text-primary no-underline ml-auto'
                        >
                          {t('watchViewAll', { count: postCount })}
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
                    {t('watchNoTimegrapherSessions')}{' '}
                    {user && !isFrozen && (
                      <Link
                        to='/watches/$watchId/timegrapher'
                        params={{ watchId }}
                        className='text-primary'
                      >
                        {t('watchLogFirstSession')}
                      </Link>
                    )}
                  </div>
                ) : (
                  (() => {
                    const latest = timegrapherReadings[0];
                    const rows = isPro
                      ? [
                          [
                            t('watchDetailsDuRate'),
                            latest.du_rate != null
                              ? `${latest.du_rate >= 0 ? '+' : ''}${latest.du_rate.toFixed(1)} s/d`
                              : '—',
                          ],
                          [
                            t('watchDetailsDuAmplitude'),
                            latest.du_amp != null ? `${latest.du_amp}°` : '—',
                          ],
                          [
                            t('watchDetailsDuBeatError'),
                            latest.du_be != null
                              ? `${latest.du_be.toFixed(1)} ms`
                              : '—',
                          ],
                        ]
                      : [
                          [
                            t('timegrapherColAvgRate'),
                            latest.du_rate != null
                              ? `${latest.du_rate >= 0 ? '+' : ''}${latest.du_rate.toFixed(1)} s/d`
                              : '—',
                          ],
                          [
                            t('timegrapherColAvgAmplitude'),
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
                            {t('watchFullLog', {
                              count: timegrapherReadings.length,
                            })}
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
                      {t('watchPartsUsed')}
                    </span>
                    {user && !isFrozen && (
                      <AddPartUsedDialog watchId={watchId} />
                    )}
                  </div>
                  {partsUsed.length === 0 ? (
                    <p className='px-4 py-3 font-mono text-xs italic text-muted-foreground/50'>
                      {t('watchNoPartsLogged')}
                    </p>
                  ) : (
                    <table className='w-full text-xs font-mono'>
                      <thead>
                        <tr className='border-b border-border bg-muted/20'>
                          <th className='px-3.5 py-2 text-left text-[9.5px] uppercase tracking-wider text-muted-foreground font-medium'>
                            {t('watchColPart')}
                          </th>
                          <th className='px-3.5 py-2 text-right text-[9.5px] uppercase tracking-wider text-muted-foreground font-medium'>
                            {t('watchColQty')}
                          </th>
                          <th className='px-3.5 py-2 text-right text-[9.5px] uppercase tracking-wider text-muted-foreground font-medium'>
                            {t('watchColUnit')}
                          </th>
                          <th className='px-3.5 py-2 text-right text-[9.5px] uppercase tracking-wider text-muted-foreground font-medium'>
                            {t('watchColTotal')}
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
                                {fmt({
                                  n: unitCost,
                                  symbol: profile?.currency?.symbol ?? '',
                                })}
                              </td>
                              <td className='px-3.5 py-2.5 text-right text-foreground'>
                                {fmt({
                                  n: total,
                                  symbol: profile?.currency?.symbol ?? '',
                                })}
                              </td>
                              {user && !isFrozen && (
                                <td className='px-3.5 py-2.5 text-right'>
                                  <button
                                    onClick={() => {
                                      if (
                                        confirm(t('watchRemovePartConfirm'))
                                      ) {
                                        deletePartUsed.mutate(part.id);
                                      }
                                    }}
                                    className='text-muted-foreground hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer text-base leading-none p-0'
                                    aria-label={t('watchRemovePart')}
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
                            {t('watchColTotal')}
                          </td>
                          <td className='px-3.5 py-2 text-right font-semibold text-foreground'>
                            {fmt({
                              n: watch.parts_cost,
                              symbol: profile?.currency?.symbol ?? '',
                            })}
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
                        {t('watchShoppingList')}
                      </span>
                      {!isPro && (
                        <span className='inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber-400'>
                          <LockIcon className='w-2.5 h-2.5' />
                          {t('pro')}
                        </span>
                      )}
                    </div>
                    {isPro && (
                      <Link
                        to='/watches/$watchId/shopping-list'
                        params={{ watchId }}
                        className='text-xs font-mono text-primary hover:text-primary/80 no-underline'
                      >
                        {t('watchShoppingViewAll', {
                          count: partsShoppingItems.length,
                        })}
                      </Link>
                    )}
                  </div>
                  {!isPro ? (
                    <div className='relative'>
                      <div
                        className='divide-y divide-border blur-sm select-none pointer-events-none'
                        aria-hidden
                      >
                        {(
                          [
                            [t('categoryMainspring'), t('watchShoppingNeeded')],
                            [t('categoryCrystal'), t('watchShoppingOrdered')],
                            [t('categoryCrown'), t('watchShoppingInHand')],
                          ] as [string, string][]
                        ).map(([k, v]) => (
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
                          {t('watchPartsShoppingListProFeature')}
                        </p>
                        {user && <UpgradeButton pbUserId={user.id} />}
                      </div>
                    </div>
                  ) : partsShoppingItems.length === 0 ? (
                    <div className='text-center py-6 text-xs font-mono text-muted-foreground'>
                      {t('watchNoPartsOnList')}{' '}
                      {user && (
                        <Link
                          to='/watches/$watchId/shopping-list'
                          params={{ watchId }}
                          className='text-primary'
                        >
                          {t('watchAddFirstShoppingItem')}
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className='divide-y divide-border'>
                      {(
                        [
                          [
                            t('watchShoppingNeeded'),
                            partsShoppingItems.filter(
                              (i) => i.status === 'needed',
                            ).length,
                          ],
                          [
                            t('watchShoppingOrdered'),
                            partsShoppingItems.filter(
                              (i) => i.status === 'ordered',
                            ).length,
                          ],
                          [
                            t('watchShoppingInHand'),
                            partsShoppingItems.filter(
                              (i) => i.status === 'in_hand',
                            ).length,
                          ],
                        ] as [string, number][]
                      ).map(([k, v]) => (
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
                          {t('watchFullList')}
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
                        {t('watchSave')}
                      </button>
                      <button
                        onClick={() => setEditingNotes(false)}
                        className='text-xs font-mono text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer p-0'
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {watch.notes ? (
                      <div
                        className='prose text-sm max-w-none'
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(watch.notes ?? ''),
                        }}
                      />
                    ) : (
                      <p className='font-mono text-xs italic text-muted-foreground/50'>
                        {t('watchNoNotes')}
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
                        {watch.notes ? t('watchEditNotes') : t('watchAddNotes')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Delete watch */}
          <section className='flex justify-end'>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  disabled={deleteWatch.isPending}
                  size='sm'
                  variant='link'
                >
                  <Trash2Icon />
                  {t('watchDeleteAction')}
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-sm'>
                <DialogHeader>
                  <DialogTitle className='font-bold text-lg'>
                    {t('watchDeleteQuestion')}
                  </DialogTitle>
                  <DialogDescription>
                    {t('watchDeleteWarning')}
                  </DialogDescription>
                </DialogHeader>
                <Label className='text-sm'>{t('watchDeleteType')}</Label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                />
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant='outline'>{t('cancel')}</Button>
                  </DialogClose>
                  <Button
                    disabled={confirmText !== t('delete').toLocaleUpperCase()}
                    onClick={performDelete}
                  >
                    {t('delete')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
