import { useState } from 'react';
import type { Watch, WatchPhoto } from '#/types';
import { cn, fmt, fmtPct, profit, roi } from '#/lib/helpers';
import { STAGE_META } from '#/lib/mocks/meta';
import { HOURLY_RATE } from '#/lib/constants';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { StagePill } from '#/components/primitives/StagePill';
import { StageTag } from '#/components/primitives/StageTag';
import { SectionLabel } from '#/components/primitives/SectionLabel';
import { Lightbox } from '#/components/watches/Lightbox';
import { UploadZone, type PendingPhoto } from '#/components/watches/UploadZone';

type WatchModalProps = {
  watch: Watch;
  onClose: () => void;
  onUpdatePhotos?: (id: number, photos: WatchPhoto[]) => void;
};

export function WatchModal({ watch: init, onClose, onUpdatePhotos }: WatchModalProps) {
  const [watch, setWatch] = useState(init);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [lightbox, setLightbox] = useState<{ photos: WatchPhoto[]; index: number } | null>(null);

  const p = profit(watch);
  const r = roi(watch);

  const displayedPhotos =
    stageFilter === 'all'
      ? watch.photos
      : watch.photos.filter((ph) => ph.stage === stageFilter);

  const handleUpload = (files: PendingPhoto[]) => {
    const added: WatchPhoto[] = files.map((f, i) => ({
      id: Date.now() + i,
      stage: f.stage,
      caption: f.caption,
      url: f.url,
    }));
    const updated = { ...watch, photos: [...watch.photos, ...added] };
    setWatch(updated);
    onUpdatePhotos?.(watch.id, updated.photos);
  };

  const statRows: [string, React.ReactNode][] = [
    ['Condition',      watch.condition_bought.replace('_', ' ')],
    ['Purchase Price', fmt(watch.bought_price)],
    ['Parts Cost',     fmt(watch.parts_cost)],
    ['Total Invested', fmt(watch.bought_price + watch.parts_cost)],
    ['Sale Price',     fmt(watch.sold_price)],
    ['Profit',
      p !== null ? (
        <span className={p >= 0 ? 'text-green-400' : 'text-red-400'}>{fmt(p)}</span>
      ) : '—',
    ],
    ['ROI',
      r !== null ? (
        <span className={parseFloat(r) >= 0 ? 'text-green-400' : 'text-red-400'}>{fmtPct(r)}</span>
      ) : '—',
    ],
    ['Hours Spent',   `${watch.hours_spent} hrs`],
    ['Imputed Labor', fmt(watch.hours_spent * HOURLY_RATE)],
    ['Acquired',      watch.bought_date],
    ['Sold',          watch.sold_date ?? '—'],
  ];

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-[840px] max-w-[96vw] max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">{watch.make} {watch.model}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[11px] text-zinc-500">{watch.reference}</span>
              <span className="text-zinc-700">·</span>
              <span className="font-mono text-[11px] text-zinc-500">{watch.year}</span>
              <span className="text-zinc-700">·</span>
              <StatusBadge status={watch.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-100 text-2xl leading-none bg-transparent border-none cursor-pointer mt-0.5"
          >
            ×
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 border-b border-zinc-800">
          {statRows.map(([k, v], i) => (
            <div
              key={k}
              className={cn(
                'flex justify-between items-center px-7 py-2 border-b border-zinc-800 last:border-0',
                i % 2 === 0 ? 'border-r border-zinc-800' : '',
              )}
            >
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-500">{k}</span>
              <span className="font-mono text-[11.5px] text-zinc-200">{v}</span>
            </div>
          ))}
          {watch.notes && (
            <div className="col-span-2 px-7 py-3 border-t border-zinc-800">
              <p className="text-sm text-zinc-400 italic leading-relaxed">"{watch.notes}"</p>
            </div>
          )}
        </div>

        {/* Gallery */}
        <div className="px-7 py-5">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <SectionLabel>Restoration Photos ({watch.photos.length})</SectionLabel>
            <div className="flex gap-1.5 flex-wrap">
              {Object.keys(STAGE_META).map((s) => (
                <StagePill
                  key={s}
                  stage={s}
                  active={stageFilter === s}
                  onClick={() => setStageFilter((f) => (f === s ? 'all' : s))}
                />
              ))}
            </div>
          </div>

          {/* Photo grid */}
          {displayedPhotos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {displayedPhotos.map((ph, i) => (
                <div
                  key={ph.id}
                  onClick={() => setLightbox({ photos: displayedPhotos, index: i })}
                  className="relative rounded-md overflow-hidden cursor-pointer aspect-[4/3] bg-zinc-800 border border-zinc-800 group"
                >
                  <img
                    src={ph.url}
                    alt={ph.caption}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2">
                    <StageTag stage={ph.stage} />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2.5 pb-2 pt-5 text-[11px] text-white/85 opacity-0 group-hover:opacity-100 transition-opacity leading-tight">
                    {ph.caption}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-7 text-zinc-600 font-mono text-xs mb-5">
              No photos for this stage yet
            </div>
          )}

          <UploadZone onUpload={handleUpload} />
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
