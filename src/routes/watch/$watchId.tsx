import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns/format';
import { capitalize } from 'lodash-es';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { StagePill } from '#/components/primitives/StagePill';
import { StageTag } from '#/components/primitives/StageTag';
import { Lightbox } from '#/components/watches/Lightbox';
import { STAGE_META } from '#/lib/mocks/meta';
import { fmt, fmtPct, profit, roi, cn } from '#/lib/helpers';
import type {
  UserProfile,
  Watch,
  WatchPhoto,
  WatchStage,
  RepairPost,
  TimegrapherReading,
} from '#/types';
import { useGoogleAnalytics } from 'tanstack-router-ga4';

export const Route = createFileRoute('/watch/$watchId')({
  component: PublicWatchDetailPage,
});

const TG_POSITIONS = ['du', 'dd', 'cu', 'cd', 'cl', 'cr'] as const;

function tgMeanRate(r: TimegrapherReading): number | null {
  const vals = TG_POSITIONS.map(
    (k) => r[`${k}_rate` as keyof TimegrapherReading] as number | undefined,
  ).filter((v): v is number => v !== undefined && v !== null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function tgAvgAmp(r: TimegrapherReading): number | null {
  const vals = TG_POSITIONS.map(
    (k) => r[`${k}_amp` as keyof TimegrapherReading] as number | undefined,
  ).filter((v): v is number => v !== undefined && v !== null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function tgAvgBe(r: TimegrapherReading): number | null {
  const vals = TG_POSITIONS.map(
    (k) => r[`${k}_be` as keyof TimegrapherReading] as number | undefined,
  ).filter((v): v is number => v !== undefined && v !== null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function tgRateClass(rate: number | null | undefined): string {
  if (rate == null) return 'text-muted-foreground';
  const abs = Math.abs(rate);
  if (abs <= 3) return 'text-green-400';
  if (abs <= 6) return 'text-amber-400';
  return 'text-red-400';
}

function fmtTgRate(r: number | null | undefined): string {
  if (r == null) return '—';
  return (r >= 0 ? '+' : '') + r.toFixed(1);
}

function fmtTgNum(n: number | null | undefined, decimals = 0): string {
  if (n == null) return '—';
  return n.toFixed(decimals);
}

function avgOf(values: (number | null)[]): number | null {
  const defined = values.filter((v): v is number => v !== null);
  return defined.length
    ? defined.reduce((a, b) => a + b, 0) / defined.length
    : null;
}

type RawPhoto = {
  id: string;
  collectionId: string;
  stage: WatchStage;
  caption: string;
  image: string;
};
type RawPartUsed = {
  qty_used: number;
  expand?: { inventory_item?: { unit_cost: number } };
};
type RawWatchRecord = {
  expand?: {
    watch_photos_via_watch?: RawPhoto[];
    parts_used_via_watch?: RawPartUsed[];
  };
} & Record<string, unknown>;

function PublicWatchDetailPage() {
  const ga4 = useGoogleAnalytics();
  const ctx = Route.useRouteContext() as { tenant?: UserProfile | null };
  const { watchId } = Route.useParams();

  const [stageFilter, setStageFilter] = useState<string>('all');
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState<{
    photos: WatchPhoto[];
    index: number;
  } | null>(null);

  const pbUrl = import.meta.env.VITE_POCKETBASE_URL as string;
  const assetUrl = import.meta.env.VITE_ASSET_URL as string;

  const { data: watch, isLoading } = useQuery<Watch | null>({
    queryKey: ['public', 'watch', watchId],
    queryFn: async () => {
      const res = await fetch(
        `${pbUrl}/api/collections/watches/records/${watchId}?expand=watch_photos_via_watch,parts_used_via_watch.inventory_item`,
      );
      if (!res.ok) return null;
      const r = (await res.json()) as RawWatchRecord;
      const photos: WatchPhoto[] = (r.expand?.watch_photos_via_watch ?? []).map(
        (p: RawPhoto) => ({
          id: p.id,
          collectionId: p.collectionId,
          stage: p.stage,
          caption: p.caption,
          image: `${assetUrl}/${p.collectionId}/${p.id}/${p.image}`,
        }),
      );
      const parts_cost = (r.expand?.parts_used_via_watch ?? []).reduce(
        (sum: number, p: RawPartUsed) =>
          sum + (p.qty_used ?? 0) * (p.expand?.inventory_item?.unit_cost ?? 0),
        0,
      );
      return { ...r, photos, parts_cost } as Watch;
    },
    enabled: !!ctx.tenant,
  });

  const { data: posts } = useQuery<RepairPost[]>({
    queryKey: ['public', 'watch-posts', watchId],
    queryFn: async () => {
      const res = await fetch(
        `${pbUrl}/api/collections/repair_posts/records?filter=watch%3D%22${watchId}%22&sort=-session_date&perPage=100`,
      );
      if (!res.ok) return [];
      return ((await res.json()) as { items?: RepairPost[] }).items ?? [];
    },
    enabled: !!ctx.tenant,
  });

  const { data: tgReadings } = useQuery<TimegrapherReading[]>({
    queryKey: ['public', 'watch-timegrapher', watchId],
    queryFn: async () => {
      const res = await fetch(
        `${pbUrl}/api/collections/timegrapher_readings/records?filter=watch%3D%22${watchId}%22&sort=-created&perPage=200`,
      );
      if (!res.ok) return [];
      return (
        ((await res.json()) as { items?: TimegrapherReading[] }).items ?? []
      );
    },
    enabled: !!ctx.tenant,
  });

  if (!ctx.tenant) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <p className='font-mono text-sm text-muted-foreground'>
          Page not found.
        </p>
      </div>
    );
  }

  const tenant = ctx.tenant;

  const photos = watch?.photos ?? [];
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

  const p = watch ? profit(watch) : null;
  const r = watch ? roi(watch) : null;

  const tgAvgRate = tgReadings?.length
    ? avgOf(tgReadings.map(tgMeanRate))
    : null;
  const tgAvgAmplitude = tgReadings?.length
    ? avgOf(tgReadings.map(tgAvgAmp))
    : null;
  const tgAvgBeatError = tgReadings?.length
    ? avgOf(tgReadings.map(tgAvgBe))
    : null;

  return (
    <div className='min-h-screen'>
      {/* Nav */}
      <header className='fixed top-0 inset-x-0 z-50 h-14 flex items-center gap-3 px-5 border-b border-border bg-background/90 backdrop-blur-md'>
        <span className='font-serif font-bold text-foreground'>Hairspring</span>
        <span className='text-border'>·</span>
        <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
          {tenant.display_name || tenant.subdomain}
        </span>
      </header>

      <div className='max-w-3xl mx-auto px-5 pt-24 pb-16 space-y-6'>
        {/* Back link */}
        <Link
          to='/'
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground no-underline'
        >
          ← Back to profile
        </Link>

        {isLoading && (
          <div className='text-sm text-muted-foreground font-mono'>
            Loading…
          </div>
        )}

        {!isLoading && !watch && (
          <div className='text-sm text-red-400 font-mono'>Watch not found.</div>
        )}

        {watch && (
          <>
            {/* Header */}
            <div>
              <h1 className='text-2xl font-serif font-semibold text-foreground'>
                {watch.make} {watch.model}
              </h1>
              <div className='mt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-muted-foreground'>
                {watch.reference && <span>{watch.reference}</span>}
                {watch.reference && watch.year && (
                  <span className='text-muted-foreground/60'>·</span>
                )}
                {watch.year && <span>{watch.year}</span>}
                <span className='text-muted-foreground/60'>·</span>
                <StatusBadge status={watch.status} />
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
                        setLightbox({
                          photos: displayedPhotos,
                          index: activeIdx,
                        })
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
                          'shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-all cursor-pointer bg-transparent p-0',
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
              </div>

              {/* RIGHT: Details panel */}
              <div className='flex-1 space-y-5 min-w-0'>
                {/* Details */}
                <section className='rounded-xl border border-border bg-card overflow-hidden'>
                  <div className='px-4 py-2.5 border-b border-border'>
                    <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                      Details
                    </span>
                  </div>
                  {(
                    [
                      [
                        'Condition',
                        capitalize(watch.condition_bought?.replace('_', ' ')) ??
                          '—',
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
                          <span
                            className={
                              p >= 0 ? 'text-green-400' : 'text-red-400'
                            }
                          >
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
                              parseFloat(r) >= 0
                                ? 'text-green-400'
                                : 'text-red-400'
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
                      [
                        'Sold',
                        watch.sold_date
                          ? format(watch.sold_date, 'MMM d, yyyy')
                          : '—',
                      ],
                    ] as [string, React.ReactNode][]
                  ).map(([k, v]) => (
                    <div
                      key={k}
                      className='flex justify-between items-center gap-4 px-4 py-2.5 border-b border-border last:border-0'
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

                {/* Repair Log */}
                <section className='rounded-xl border border-border bg-card overflow-hidden'>
                  <div className='px-4 py-2.5 border-b border-border'>
                    <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                      Repair Log
                    </span>
                  </div>
                  {!posts?.length ? (
                    <div className='text-center py-6 text-xs font-mono text-muted-foreground'>
                      No repair sessions yet.
                    </div>
                  ) : (
                    <ul className='divide-y divide-border'>
                      {posts.map((post) => (
                        <li key={post.id}>
                          <Link
                            to='/post/$postId'
                            params={{ postId: post.id }}
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
                  )}
                </section>

                {/* Timegrapher */}
                {tgReadings && tgReadings.length > 0 && (
                  <section className='rounded-xl border border-border bg-card overflow-hidden'>
                    <div className='px-4 py-2.5 border-b border-border'>
                      <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
                        Timegrapher
                      </span>
                    </div>
                    {(
                      [
                        [
                          'Avg Rate',
                          <span className={tgRateClass(tgAvgRate)}>
                            {fmtTgRate(tgAvgRate)} s/d
                          </span>,
                        ],
                        [
                          'Avg Amplitude',
                          tgAvgAmplitude !== null
                            ? `${fmtTgNum(tgAvgAmplitude)}°`
                            : '—',
                        ],
                        [
                          'Avg Beat Error',
                          tgAvgBeatError !== null
                            ? `${fmtTgNum(tgAvgBeatError, 1)} ms`
                            : '—',
                        ],
                        ['Sessions', tgReadings.length],
                      ] as [string, React.ReactNode][]
                    ).map(([k, v]) => (
                      <div
                        key={k}
                        className='flex justify-between items-center gap-4 px-4 py-2.5 border-b border-border last:border-0'
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
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <footer className='border-t border-border py-6'>
        <div className='max-w-3xl mx-auto px-5'>
          <a
            href={'https://hairspring.app'}
            target='_blank'
            rel='noopener noreferrer'
            onClick={() => {
              ga4.event('click_hairspring_attribution', {
                category: 'Navigation',
                label: 'Hairspring Attribution Link',
              });
            }}
          >
            <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
              Powered by Hairspring
            </span>
          </a>
        </div>
      </footer>

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
