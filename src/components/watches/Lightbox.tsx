import { useState } from 'react';
import type { WatchPhoto } from '#/types';
import { StageTag } from '#/components/primitives/StageTag';

type LightboxProps = {
  photos: WatchPhoto[];
  startIndex: number;
  onClose: () => void;
};

export function Lightbox({ photos, startIndex, onClose }: LightboxProps) {
  const [idx, setIdx] = useState(startIndex);
  const ph = photos[idx];

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i - 1 + photos.length) % photos.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i + 1) % photos.length);
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-2000"
      onClick={onClose}
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-muted-foreground hover:text-foreground text-3xl leading-none bg-transparent border-none cursor-pointer"
        >
          ×
        </button>

        {/* Prev */}
        {photos.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-[-56px] top-1/2 -translate-y-1/2 bg-white/8 hover:bg-white/15 text-white text-2xl px-3.5 py-2.5 rounded border-none cursor-pointer transition-colors"
          >
            ‹
          </button>
        )}

        <img
          src={ph.url}
          alt={ph.caption}
          className="max-w-[88vw] max-h-[80vh] object-contain rounded block"
        />

        {/* Next */}
        {photos.length > 1 && (
          <button
            onClick={next}
            className="absolute right-[-56px] top-1/2 -translate-y-1/2 bg-white/8 hover:bg-white/15 text-white text-2xl px-3.5 py-2.5 rounded border-none cursor-pointer transition-colors"
          >
            ›
          </button>
        )}

        {/* Caption */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <StageTag stage={ph.stage} />
          <span className="text-muted-foreground text-sm">{ph.caption}</span>
        </div>

        {/* Counter */}
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
          {idx + 1} / {photos.length}
        </div>
      </div>
    </div>
  );
}
