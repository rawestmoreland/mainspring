import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGetWatchById } from '#/hooks/watches';
import type { WatchStage } from '#/types';
import { STAGE_META } from '#/lib/mocks/meta';

const STAGE_ORDER: WatchStage[] = ['before', 'during', 'after', 'listing'];

type Props = {
  watchId: string;
  onInsert: (embed: string) => void;
};

export function WatchPhotoPicker({ watchId, onInsert }: Props) {
  const { t } = useTranslation();
  const { data: watch, isLoading } = useGetWatchById(watchId);
  const [recentlyInserted, setRecentlyInserted] = useState<Set<string>>(
    new Set(),
  );

  const photos = watch?.photos ?? [];
  const grouped = STAGE_ORDER.map((stage) => ({
    stage,
    photos: photos.filter((ph) => ph.stage === stage),
  })).filter((g) => g.photos.length > 0);

  const handleInsert = (photoId: string, imageUrl: string, caption: string, stage: WatchStage) => {
    const alt = caption || STAGE_META[stage].label;
    onInsert(`![${alt}](${imageUrl})`);
    setRecentlyInserted((prev) => new Set(prev).add(photoId));
    setTimeout(() => {
      setRecentlyInserted((prev) => {
        const next = new Set(prev);
        next.delete(photoId);
        return next;
      });
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className='text-[11px] font-mono text-muted-foreground'>
        {t('markdownLoadingPhotos')}
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <label className='text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80'>
        {t('markdownInsertPhotosLabel')}
      </label>
      {grouped.length === 0 ? (
        <div className='rounded-md border border-dashed border-border px-4 py-3 text-[11px] font-mono text-muted-foreground'>
          {t('markdownNoPhotos')}
        </div>
      ) : (
        <div className='rounded-md border border-border bg-card px-3 py-3 space-y-3'>
          {grouped.map(({ stage, photos: stagePhs }) => (
            <div key={stage}>
              <div className='text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 mb-1.5'>
                {STAGE_META[stage].label}
              </div>
              <div className='flex flex-wrap gap-2'>
                {stagePhs.map((ph) => {
                  const inserted = recentlyInserted.has(ph.id);
                  return (
                    <button
                      key={ph.id}
                      type='button'
                      onClick={() => handleInsert(ph.id, ph.image, ph.caption, ph.stage)}
                      title={inserted ? t('markdownPhotosInserted') : (ph.caption || t('markdownPhotosInsert', { stage: STAGE_META[ph.stage].label }))}
                      className={`relative group overflow-hidden rounded border w-14 h-14 shrink-0 transition-all ${
                        inserted
                          ? 'border-primary ring-1 ring-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <img
                        src={`${ph.image}?thumb=200x200`}
                        alt={ph.caption || ph.stage}
                        className='h-full w-full object-cover'
                        loading='lazy'
                      />
                      <div
                        className={`absolute inset-0 flex items-center justify-center text-[10px] font-mono transition-opacity ${
                          inserted
                            ? 'bg-primary/80 text-primary-foreground opacity-100'
                            : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {/* eslint-disable-next-line i18next/no-literal-string */}
                        {inserted ? '✓' : '+'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <p className='text-[10px] font-mono text-muted-foreground/60'>
            {t('markdownClickToInsert')}
          </p>
        </div>
      )}
    </div>
  );
}
