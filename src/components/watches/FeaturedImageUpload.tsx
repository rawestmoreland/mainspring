import { useRef } from 'react';
import { ImagePlusIcon, PencilIcon } from 'lucide-react';

import { cn } from '#/lib/helpers';
import { useUploadFeaturedImage } from '#/hooks/watches';

type FeaturedImageUploadProps = {
  watchId: string;
  imageUrl?: string;
  className?: string;
};

export function FeaturedImageUpload({ watchId, imageUrl, className }: FeaturedImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadFeaturedImage(watchId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    upload.mutate(file);
    e.target.value = '';
  };

  return (
    <div className={cn('relative group', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        aria-label="Upload featured image"
      />

      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt="Featured"
            className="w-full aspect-video object-cover rounded-md border border-border"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className={cn(
              'absolute inset-0 flex items-center justify-center rounded-md',
              'bg-black/0 group-hover:bg-black/50 transition-all cursor-pointer border-none',
              upload.isPending && 'bg-black/50',
            )}
            aria-label="Change featured image"
          >
            <span
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-black/70 text-white text-xs font-mono',
                'opacity-0 group-hover:opacity-100 transition-opacity',
                upload.isPending && 'opacity-100',
              )}
            >
              <PencilIcon className="size-3" />
              {upload.isPending ? 'Uploading…' : 'Change image'}
            </span>
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className={cn(
            'w-full aspect-video rounded-md border border-dashed border-border',
            'bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-600 transition-colors',
            'flex flex-col items-center justify-center gap-2 cursor-pointer',
            upload.isPending && 'opacity-60 cursor-not-allowed',
          )}
          aria-label="Upload featured image"
        >
          <ImagePlusIcon className="size-5 text-muted-foreground" />
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            {upload.isPending ? 'Uploading…' : 'Add featured image'}
          </span>
        </button>
      )}

      {upload.isError && (
        <p className="mt-1 text-xs text-red-400 font-mono">Upload failed. Please try again.</p>
      )}
    </div>
  );
}
