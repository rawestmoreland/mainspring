import type { WatchPhoto } from '#/types';

type ThumbStripProps = {
  photos: WatchPhoto[];
  onClick?: () => void;
};

export function ThumbStrip({ photos, onClick }: ThumbStripProps) {
  if (!photos || photos.length === 0) {
    return null;
  }

  const visible = photos.slice(0, 2);
  const extra = photos.length - 2;

  return (
    <div
      className='flex gap-1'
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {visible.map((ph) => (
        <img
          key={ph.id}
          src={ph.url}
          alt=''
          className='w-9 h-9 rounded object-cover border border-border shrink-0'
        />
      ))}
      {extra > 0 && (
        <div className='w-9 h-9 rounded bg-muted border border-border flex items-center justify-center font-mono text-[9px] text-muted-foreground shrink-0'>
          +{extra}
        </div>
      )}
      {photos.length === 0 && (
        <div className='w-9 h-9 rounded bg-muted border border-dashed border-border flex items-center justify-center text-muted-foreground text-sm hover:border-ring hover:text-primary transition-colors'>
          +
        </div>
      )}
    </div>
  );
}
