import { useState, useRef } from 'react';
import type { WatchStage } from '#/types';
import { cn } from '#/lib/helpers';
import { STAGE_META } from '#/lib/mocks/meta';
import { SectionLabel } from '#/components/primitives/SectionLabel';
import { Btn } from '#/components/primitives/Button';

export type PendingPhoto = {
  id: number;
  file: File;
  stage: WatchStage;
  url: string;
  caption: string;
};

type UploadZoneProps = {
  onUpload: (files: PendingPhoto[]) => void;
  /** Photos already saved for this watch. Used to enforce the free-tier limit. */
  currentCount?: number;
  /** Maximum photos allowed. Omit for unlimited (Pro). */
  limit?: number;
};

export function UploadZone({ onUpload, currentCount = 0, limit }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [stage, setStage] = useState<WatchStage>('before');
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [clampWarning, setClampWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const slotsLeft = limit !== undefined
    ? Math.max(0, limit - currentCount - pending.length)
    : Infinity;

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setClampWarning(null);

    const incoming = Array.from(files);
    const canAdd = slotsLeft === Infinity ? incoming.length : slotsLeft;
    const accepted = incoming.slice(0, canAdd);
    const dropped = incoming.length - accepted.length;

    if (dropped > 0) {
      setClampWarning(
        dropped === incoming.length
          ? `No slots remaining — delete an existing photo or upgrade to Pro to add more.`
          : `${dropped} photo${dropped !== 1 ? 's' : ''} removed — only ${canAdd} slot${canAdd !== 1 ? 's' : ''} remaining.`,
      );
    }

    if (accepted.length === 0) return;

    const arr: PendingPhoto[] = accepted.map((f) => ({
      id: Math.random(),
      file: f,
      stage,
      url: URL.createObjectURL(f),
      caption: f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
    }));
    setPending((p) => [...p, ...arr]);
  };

  const save = () => {
    if (!pending.length) return;
    onUpload(pending);
    setPending([]);
    setClampWarning(null);
  };

  const stageMeta = STAGE_META[stage];
  const stageTextClass =
    stageMeta.className.split(' ').find((c) => c.startsWith('text-')) ??
    'text-muted-foreground';

  const isAtLimit = slotsLeft === 0;

  return (
    <div className='mt-4'>
      {/* Stage selector */}
      <div className='flex items-center justify-between mb-2.5 flex-wrap gap-2'>
        <SectionLabel>Add Photos</SectionLabel>
        <div className='flex gap-1.5 flex-wrap'>
          {(
            Object.entries(STAGE_META) as [
              WatchStage,
              (typeof STAGE_META)[WatchStage],
            ][]
          ).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setStage(k)}
              className={cn(
                'px-2.5 py-1 rounded-full font-mono text-[10px] border tracking-wide transition-all cursor-pointer',
                stage === k
                  ? cn(v.className, 'opacity-100')
                  : 'bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-ring',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => !isAtLimit && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isAtLimit) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          'border-2 border-dashed rounded-lg p-5 text-center transition-all',
          isAtLimit
            ? 'border-border opacity-50 cursor-not-allowed'
            : 'cursor-pointer hover:border-ring/70 hover:bg-accent/20',
          dragOver && !isAtLimit && 'border-ring bg-accent/30',
        )}
      >
        <div className='text-2xl mb-1.5'>📷</div>
        <div className='text-xs text-muted-foreground'>
          {isAtLimit ? (
            <span>Photo limit reached</span>
          ) : (
            <>
              <span className='text-primary font-medium'>Click to upload</span>{' '}
              or drag &amp; drop
            </>
          )}
        </div>
        <div className='text-[11px] text-muted-foreground/80 mt-1'>
          {!isAtLimit && (
            <>
              Tagging as{' '}
              <span className={stageTextClass}>{stageMeta.label}</span> · JPG,
              PNG, HEIC, WEBP
            </>
          )}
          {limit !== undefined && (
            <span className={cn('block mt-0.5', slotsLeft <= 1 && 'text-amber-400/80')}>
              {slotsLeft === Infinity ? '' : `${slotsLeft} slot${slotsLeft !== 1 ? 's' : ''} remaining`}
            </span>
          )}
        </div>
        <input
          ref={inputRef}
          type='file'
          accept='image/*'
          multiple
          className='hidden'
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Clamp warning */}
      {clampWarning && (
        <p className='mt-2 font-mono text-[11px] text-amber-400'>
          {clampWarning}
        </p>
      )}

      {/* Pending previews */}
      {pending.length > 0 && (
        <div>
          <div className='flex gap-2 flex-wrap mt-2.5'>
            {pending.map((f) => (
              <div
                key={f.id}
                className='relative w-14 h-14 rounded overflow-hidden border border-border shrink-0'
              >
                <img
                  src={f.url}
                  alt={f.caption}
                  className='w-full h-full object-cover'
                />
                <button
                  onClick={() => {
                    setPending((p) => p.filter((x) => x.id !== f.id));
                    setClampWarning(null);
                  }}
                  className='absolute top-0.5 right-0.5 bg-black/70 text-white text-[11px] leading-none px-1 py-0.5 rounded cursor-pointer border-none'
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <Btn sm onClick={save} className='mt-2.5'>
            Save {pending.length} photo{pending.length !== 1 ? 's' : ''}
          </Btn>
        </div>
      )}
    </div>
  );
}
