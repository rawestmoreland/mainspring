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
  onUpdatePhotos?: (id: string, photos: WatchPhoto[]) => void;
};

export function WatchModal({ watch: init, onClose, onUpdatePhotos }: WatchModalProps) {
  const [watch, setWatch] = useState(init);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState<{ photos: WatchPhoto[]; index: number } | null>(null);

  const p = profit(watch);
  const r = roi(watch);

  const displayedPhotos =
    stageFilter === 'all'
      ? watch.photos
      : watch.photos.filter((ph) => ph.stage === stageFilter);

  const activePhoto = displayedPhotos[activeIdx] ?? null;

  const handleStageFilter = (s: string) => {
    setStageFilter((f) => (f === s ? 'all' : s));
    setActiveIdx(0);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((i) => (i - 1 + displayedPhotos.length) % displayedPhotos.length);
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((i) => (i + 1) % displayedPhotos.length);
  };

  const handleUpload = (files: PendingPhoto[]) => {
    const added: WatchPhoto[] = files.map((f, i) => ({
      id: `${Date.now()}-${i}`,
      collectionId: '',
      stage: f.stage,
      caption: f.caption,
      image: f.url,
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
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-1000 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-xl w-[980px] max-w-full max-h-[92vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-xl font-bold text-foreground">{watch.make} {watch.model}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[11px] text-muted-foreground">{watch.reference}</span>
              <span className="text-muted-foreground/60">·</span>
              <span className="font-mono text-[11px] text-muted-foreground">{watch.year}</span>
              <span className="text-muted-foreground/60">·</span>
              <StatusBadge status={watch.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl leading-none bg-transparent border-none cursor-pointer mt-0.5"
          >
            ×
          </button>
        </div>

        {/* Body: two-column on md+, stacked on mobile */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">

          {/* LEFT: Photo panel */}
          <div className="md:w-[46%] shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-border md:overflow-y-auto">

            {/* Stage filter */}
            <div className="px-5 pt-3.5 pb-3 border-b border-border flex flex-wrap gap-1.5 shrink-0">
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
              <div className="relative w-full aspect-[4/3] bg-zinc-950 overflow-hidden group shrink-0">
                <img
                  src={activePhoto.image}
                  alt={activePhoto.caption}
                  className="w-full h-full object-contain cursor-zoom-in"
                  onClick={() => setLightbox({ photos: displayedPhotos, index: activeIdx })}
                />

                {displayedPhotos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/55 hover:bg-black/75 text-white text-xl px-3 py-2 rounded-lg border-none cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/55 hover:bg-black/75 text-white text-xl px-3 py-2 rounded-lg border-none cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                    >
                      ›
                    </button>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white/70 font-mono text-[10px] px-2 py-0.5 rounded-full">
                      {activeIdx + 1} / {displayedPhotos.length}
                    </div>
                  </>
                )}

                <div className="absolute top-2 left-2">
                  <StageTag stage={activePhoto.stage} />
                </div>

                {activePhoto.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 to-transparent px-3 pb-2.5 pt-6 text-[11px] text-white/85 opacity-0 group-hover:opacity-100 transition-opacity leading-tight">
                    {activePhoto.caption}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full aspect-[4/3] flex items-center justify-center text-muted-foreground font-mono text-xs bg-zinc-950 shrink-0">
                No photos for this stage
              </div>
            )}

            {/* Thumbnail strip */}
            {displayedPhotos.length > 1 && (
              <div className="shrink-0 flex gap-1.5 px-4 py-3 border-t border-border overflow-x-auto">
                {displayedPhotos.map((ph, i) => (
                  <button
                    key={ph.id}
                    onClick={() => setActiveIdx(i)}
                    className={cn(
                      'shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-all cursor-pointer bg-transparent p-0',
                      i === activeIdx
                        ? 'border-amber-500 opacity-100'
                        : 'border-border opacity-60 hover:opacity-100 hover:border-border/80',
                    )}
                  >
                    <img src={ph.image} alt={ph.caption} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Upload zone */}
            <div className="shrink-0 px-5 pt-4 pb-5 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>Restoration Photos ({watch.photos.length})</SectionLabel>
              </div>
              <UploadZone onUpload={handleUpload} />
            </div>
          </div>

          {/* RIGHT: Details panel */}
          <div className="flex-1 flex flex-col md:overflow-y-auto">

            {/* Stats table */}
            <div className="px-6 pt-5 pb-4">
              <SectionLabel>Details</SectionLabel>
              <div className="mt-3 border border-border rounded-lg overflow-hidden">
                {statRows.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between items-center px-4 py-2.5 border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">{k}</span>
                    <span className="font-mono text-[11.5px] text-foreground">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {watch.notes && (
              <div className="px-6 pb-5">
                <SectionLabel>Notes</SectionLabel>
                <div className="mt-3 bg-white/[0.025] rounded-lg border border-border px-4 py-3">
                  <p className="text-sm text-muted-foreground italic leading-relaxed">"{watch.notes}"</p>
                </div>
              </div>
            )}
          </div>
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
