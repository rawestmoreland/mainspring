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
};

export function UploadZone({ onUpload }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [stage, setStage] = useState<WatchStage>('before');
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const arr: PendingPhoto[] = Array.from(files).map((f) => ({
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
  };

  const stageMeta = STAGE_META[stage];
  const stageTextClass = stageMeta.className
    .split(' ')
    .find((c) => c.startsWith('text-')) ?? 'text-zinc-400';

  return (
    <div className="mt-4">
      {/* Stage selector */}
      <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
        <SectionLabel>Add Photos</SectionLabel>
        <div className="flex gap-1.5 flex-wrap">
          {(Object.entries(STAGE_META) as [WatchStage, typeof STAGE_META[WatchStage]][]).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setStage(k)}
              className={cn(
                'px-2.5 py-1 rounded-full font-mono text-[10px] border tracking-wide transition-all cursor-pointer',
                stage === k
                  ? cn(v.className, 'opacity-100')
                  : 'bg-transparent text-zinc-500 border-zinc-700 hover:text-zinc-300',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        className={cn(
          'border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all',
          dragOver
            ? 'border-amber-600/60 bg-amber-500/10'
            : 'border-zinc-700 hover:border-amber-700/50 hover:bg-amber-500/5',
        )}
      >
        <div className="text-2xl mb-1.5">📷</div>
        <div className="text-xs text-zinc-400">
          <span className="text-amber-500 font-medium">Click to upload</span> or drag &amp; drop
        </div>
        <div className="text-[11px] text-zinc-600 mt-1">
          Tagging as{' '}
          <span className={stageTextClass}>{stageMeta.label}</span>
          {' '}· JPG, PNG, HEIC, WEBP
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Pending previews */}
      {pending.length > 0 && (
        <div>
          <div className="flex gap-2 flex-wrap mt-2.5">
            {pending.map((f) => (
              <div
                key={f.id}
                className="relative w-14 h-14 rounded overflow-hidden border border-zinc-700 shrink-0"
              >
                <img src={f.url} alt={f.caption} className="w-full h-full object-cover" />
                <button
                  onClick={() => setPending((p) => p.filter((x) => x.id !== f.id))}
                  className="absolute top-0.5 right-0.5 bg-black/70 text-white text-[11px] leading-none px-1 py-0.5 rounded cursor-pointer border-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <Btn sm onClick={save} className="mt-2.5">
            Save {pending.length} photo{pending.length !== 1 ? 's' : ''}
          </Btn>
        </div>
      )}
    </div>
  );
}
