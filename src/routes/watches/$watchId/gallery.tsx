import { useState, useEffect, useCallback } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
  useGetWatchById,
  useDeleteWatchPhoto,
  useUploadWatchPhotos,
} from '#/hooks/watches';
import { useUser } from '#/hooks/user';
import { StageTag } from '#/components/primitives/StageTag';
import { UploadZone } from '#/components/watches/UploadZone';
import type { PendingPhoto } from '#/components/watches/UploadZone';
import type { WatchStage } from '#/types';

export const Route = createFileRoute('/watches/$watchId/gallery')({
  component: GalleryPage,
});

const STAGES: (WatchStage | 'all')[] = [
  'all',
  'before',
  'during',
  'after',
  'listing',
];
const STAGE_LABELS: Record<WatchStage | 'all', string> = {
  all: 'All',
  before: 'Before',
  during: 'During',
  after: 'After',
  listing: 'Listing',
};

function GalleryPage() {
  const { watchId } = Route.useParams();
  const { data: watch, isLoading } = useGetWatchById(watchId);
  const { data: user } = useUser();
  const deletePhoto = useDeleteWatchPhoto(watchId);
  const uploadPhotos = useUploadWatchPhotos(watchId);

  const [stageFilter, setStageFilter] = useState<WatchStage | 'all'>('all');
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleUpload = (pending: PendingPhoto[]) => {
    uploadPhotos.mutate(
      pending.map((p) => ({ file: p.file, stage: p.stage, caption: p.caption })),
    );
  };

  const allPhotos = watch?.photos ?? [];
  const filtered =
    stageFilter === 'all'
      ? allPhotos
      : allPhotos.filter((p) => p.stage === stageFilter);
  const featured = filtered[featuredIdx] ?? null;

  useEffect(() => {
    setFeaturedIdx(0);
  }, [stageFilter]);

  const prev = useCallback(() => {
    setFeaturedIdx((i) => (i - 1 + filtered.length) % filtered.length);
  }, [filtered.length]);

  const next = useCallback(() => {
    setFeaturedIdx((i) => (i + 1) % filtered.length);
  }, [filtered.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  if (isLoading) {
    return (
      <div className='text-sm text-muted-foreground font-mono'>Loading…</div>
    );
  }

  if (!watch) {
    return (
      <div className='space-y-3'>
        <Link
          to='/watches'
          className='text-xs font-mono text-muted-foreground hover:text-foreground no-underline'
        >
          ← Back to Watches
        </Link>
        <div className='text-sm text-red-400 font-mono'>Watch not found.</div>
      </div>
    );
  }

  return (
    <div className='space-y-5'>
      {/* Header row */}
      <div className='flex items-center justify-between'>
        <Link
          to='/watches/$watchId'
          params={{ watchId }}
          className='inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground no-underline'
        >
          ←{' '}
          <span className='text-foreground/80'>
            {watch.make} {watch.model}
          </span>
        </Link>
        {user && <UploadZone onUpload={handleUpload} />}
      </div>

      {allPhotos.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-32 border border-dashed border-border rounded-lg gap-3'>
          <div className='text-4xl text-muted-foreground/20'>⬜</div>
          <p className='text-xs font-mono text-muted-foreground'>
            No photos yet.
          </p>
        </div>
      ) : (
        <>
          {/* Stage filter pills */}
          <div className='flex items-center gap-2 flex-wrap'>
            {STAGES.map((s) => {
              const count =
                s === 'all'
                  ? allPhotos.length
                  : allPhotos.filter((p) => p.stage === s).length;
              if (s !== 'all' && count === 0) return null;
              return (
                <button
                  key={s}
                  onClick={() => setStageFilter(s)}
                  className={`px-3 py-1 text-[11px] font-mono rounded-full border transition-colors ${
                    stageFilter === s
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-zinc-600'
                  }`}
                >
                  {STAGE_LABELS[s]}
                  <span className='ml-1.5 opacity-60'>{count}</span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className='text-center py-16 text-xs font-mono text-muted-foreground'>
              No photos in this stage.
            </div>
          ) : (
            <>
              {/* Featured image */}
              {featured && (
                <div className='relative group overflow-hidden rounded-lg border border-border bg-zinc-950'>
                  <img
                    src={featured.image}
                    alt={featured.caption}
                    onClick={() => setLightboxOpen(true)}
                    className='w-full object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-[1.01]'
                    style={{
                      height: 'clamp(320px, 62vh, 780px)',
                      objectFit: 'cover',
                    }}
                  />

                  {/* Vignette overlay */}
                  <div className='absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20 pointer-events-none' />

                  {/* Stage tag */}
                  <div className='absolute top-4 left-4'>
                    <StageTag stage={featured.stage} />
                  </div>

                  {/* Counter */}
                  <div className='absolute top-4 right-4 font-mono text-[11px] text-white/70 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full'>
                    {featuredIdx + 1} / {filtered.length}
                  </div>

                  {/* Caption */}
                  {featured.caption && (
                    <div className='absolute inset-x-0 bottom-0 px-5 pb-4 pt-10 pointer-events-none'>
                      <p className='text-white/90 text-sm font-mono leading-snug'>
                        {featured.caption}
                      </p>
                    </div>
                  )}

                  {/* Prev arrow */}
                  {filtered.length > 1 && (
                    <button
                      onClick={prev}
                      className='absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white text-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm border border-white/10'
                    >
                      ‹
                    </button>
                  )}

                  {/* Next arrow */}
                  {filtered.length > 1 && (
                    <button
                      onClick={next}
                      className='absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white text-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm border border-white/10'
                    >
                      ›
                    </button>
                  )}

                  {/* Delete */}
                  {user && (
                    <button
                      onClick={() => {
                        deletePhoto.mutate(featured.id);
                        setFeaturedIdx((i) =>
                          Math.min(i, Math.max(0, filtered.length - 2)),
                        );
                      }}
                      disabled={deletePhoto.isPending}
                      className='absolute bottom-4 right-4 hidden group-hover:flex items-center justify-center w-7 h-7 rounded bg-black/70 text-white/80 hover:text-red-400 hover:bg-black/90 transition-colors text-base border border-white/10'
                      aria-label='Delete photo'
                    >
                      ×
                    </button>
                  )}
                </div>
              )}

              {/* Filmstrip */}
              {filtered.length > 1 && (
                <div className='flex gap-2 overflow-x-auto py-0.5 px-0.5 -mx-0.5'>
                  {filtered.map((ph, i) => (
                    <button
                      key={ph.id}
                      onClick={() => setFeaturedIdx(i)}
                      className={`flex-none relative rounded overflow-hidden border-2 transition-all duration-150 ${
                        i === featuredIdx
                          ? 'border-primary opacity-100 ring-2 ring-primary/30'
                          : 'border-transparent opacity-45 hover:opacity-80 hover:border-zinc-600'
                      }`}
                      style={{ width: 76, height: 76 }}
                    >
                      <img
                        src={ph.image}
                        alt={ph.caption}
                        className='w-full h-full object-cover'
                        loading='lazy'
                      />
                      {i === featuredIdx && (
                        <div className='absolute inset-0 ring-inset ring-1 ring-primary/40 rounded' />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightboxOpen && featured && (
        <div
          className='fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[2000]'
          onClick={() => setLightboxOpen(false)}
        >
          <div className='relative' onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxOpen(false)}
              className='absolute -top-10 right-0 text-zinc-500 hover:text-white text-3xl leading-none'
            >
              ×
            </button>

            {filtered.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className='absolute left-[-60px] top-1/2 -translate-y-1/2 bg-white/8 hover:bg-white/15 text-white text-2xl px-4 py-3 rounded transition-colors'
              >
                ‹
              </button>
            )}

            <img
              src={featured.image}
              alt={featured.caption}
              className='max-w-[88vw] max-h-[85vh] object-contain rounded block'
            />

            {filtered.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className='absolute right-[-60px] top-1/2 -translate-y-1/2 bg-white/8 hover:bg-white/15 text-white text-2xl px-4 py-3 rounded transition-colors'
              >
                ›
              </button>
            )}

            <div className='flex items-center justify-center gap-2.5 mt-4'>
              <StageTag stage={featured.stage} />
              {featured.caption && (
                <span className='text-zinc-400 text-sm font-mono'>
                  {featured.caption}
                </span>
              )}
            </div>

            <div className='absolute -bottom-7 left-1/2 -translate-x-1/2 font-mono text-[11px] text-zinc-600 whitespace-nowrap'>
              {featuredIdx + 1} / {filtered.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
