import type { WatchPhoto } from '#/types';

type ThumbStripProps = {
  photos: WatchPhoto[];
  onClick?: () => void;
};

export function ThumbStrip({ photos, onClick }: ThumbStripProps) {
  const visible = photos.slice(0, 2);
  const extra = photos.length - 2;

  return (
    <div
      className="flex gap-1"
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      {visible.map((ph) => (
        <img
          key={ph.id}
          src={ph.url}
          alt=""
          className="w-9 h-9 rounded object-cover border border-zinc-700 shrink-0"
        />
      ))}
      {extra > 0 && (
        <div className="w-9 h-9 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center font-mono text-[9px] text-zinc-500 shrink-0">
          +{extra}
        </div>
      )}
      {photos.length === 0 && (
        <div className="w-9 h-9 rounded bg-zinc-800 border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 text-sm hover:border-amber-700 hover:text-amber-500 transition-colors">
          +
        </div>
      )}
    </div>
  );
}
