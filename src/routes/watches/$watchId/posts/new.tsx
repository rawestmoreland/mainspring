import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState } from 'react';
import { useCreatePost } from '#/hooks/posts';
import { useSubscription } from '#/hooks/subscription';
import { useUser } from '#/hooks/user';
import { useGetWatchById } from '#/hooks/watches';
import { PostsApi } from '#/lib/api/posts';
import TiptapEditor, { type TiptapEditorRef } from '#/components/TipTap';
import type { WatchPhoto, WatchStage } from '#/types';

export const Route = createFileRoute('/watches/$watchId/posts/new')({
  component: NewPostPage,
});

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  session_date: z.string().trim().min(1, 'Session date is required'),
  body: z.string(),
});
type FormData = z.infer<typeof schema>;

function NewPostPage() {
  const { watchId } = Route.useParams();
  const { data: user } = useUser();
  const { data: watch } = useGetWatchById(watchId);
  const navigate = useNavigate();
  const { isPro } = useSubscription();
  const createPost = useCreatePost(watchId);
  const editorRef = useRef<TiptapEditorRef>(null);
  const [photosOpen, setPhotosOpen] = useState(false);
  // Maps blob URL → File for images inserted while writing
  const pendingImagesRef = useRef<Map<string, File>>(new Map());

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', session_date: '', body: '' },
  });

  const handleImageUpload = async (file: File): Promise<string> => {
    const blobUrl = URL.createObjectURL(file);
    pendingImagesRef.current.set(blobUrl, file);
    return blobUrl;
  };

  const onSubmit = async (data: FormData) => {
    const pendingEntries = Array.from(pendingImagesRef.current.entries());
    const imageFiles = pendingEntries.map(([, file]) => file);

    const post = await createPost.mutateAsync({
      data: { watch: watchId, ...data },
      images: imageFiles,
    });

    // Rewrite body HTML: replace local blob URLs with real PocketBase URLs
    if (pendingEntries.length > 0 && post.imageUrls.length > 0) {
      let updatedBody = data.body;
      pendingEntries.forEach(([blobUrl], i) => {
        if (post.imageUrls[i]) {
          updatedBody = updatedBody.split(blobUrl).join(post.imageUrls[i]);
        }
      });
      if (updatedBody !== data.body) {
        await PostsApi.updatePost(post.id, { body: updatedBody }, []);
      }
    }

    pendingEntries.forEach(([blobUrl]) => URL.revokeObjectURL(blobUrl));
    pendingImagesRef.current.clear();

    navigate({
      to: '/watches/$watchId/posts/$postId',
      params: { watchId, postId: post.id },
    });
  };

  const isFrozen = !!watch?.is_frozen && !isPro;

  if (!user) {
    return (
      <div className='text-sm font-mono text-muted-foreground'>
        You must be signed in to create repair sessions.
      </div>
    );
  }

  if (isFrozen) {
    return (
      <div className='space-y-4'>
        <Link
          to='/watches/$watchId/posts'
          params={{ watchId }}
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          ← Back to Repair Log
        </Link>
        <div className='rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-5 flex items-start gap-3 max-w-lg'>
          <svg className='w-4 h-4 text-amber-400 mt-0.5 shrink-0' viewBox='0 0 16 16' fill='currentColor' aria-hidden='true'>
            <path d='M11.5 8h-1V5.5a2.5 2.5 0 0 0-5 0V8h-1A1.5 1.5 0 0 0 3 9.5v4A1.5 1.5 0 0 0 4.5 15h7A1.5 1.5 0 0 0 13 13.5v-4A1.5 1.5 0 0 0 11.5 8zM6 5.5a2 2 0 1 1 4 0V8H6V5.5z'/>
          </svg>
          <div>
            <p className='font-mono text-sm font-medium text-foreground'>This project is frozen</p>
            <p className='font-mono text-xs text-muted-foreground mt-1 leading-relaxed'>
              You&apos;ve reached the 2-project limit on the free plan. Repair sessions cannot be added to frozen projects.{' '}
              <Link to='/pro' className='text-amber-400 hover:text-amber-300'>Upgrade to Pro</Link>{' '}
              or archive another watch to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Back link */}
      <div>
        <Link
          to='/watches/$watchId/posts'
          params={{ watchId }}
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          ← Back to Repair Log
        </Link>
      </div>

      <h1 className='text-2xl font-serif font-semibold text-foreground'>
        New Repair Session
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6 max-w-4xl'>
        {/* Title + Date */}
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-1.5'>
            <label className='text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80'>
              Title
            </label>
            <input
              {...register('title')}
              type='text'
              placeholder='e.g. Movement service, crystal replacement…'
              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'
            />
            {errors.title && (
              <p className='text-[11px] text-red-400'>{errors.title.message}</p>
            )}
          </div>
          <div className='space-y-1.5'>
            <label className='text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80'>
              Session Date
            </label>
            <input
              {...register('session_date')}
              type='date'
              className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring'
            />
            {errors.session_date && (
              <p className='text-[11px] text-red-400'>
                {errors.session_date.message}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className='space-y-1.5'>
          <label className='text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80'>
            Notes
          </label>
          <Controller
            name='body'
            control={control}
            render={({ field }) => (
              <TiptapEditor
                ref={editorRef}
                value={field.value}
                onChange={field.onChange}
                onImageUpload={isPro ? handleImageUpload : undefined}
                minHeight='200px'
                toolbarConfig={{
                  headings: [true, true, true],
                  bold: true,
                  italic: true,
                  strike: true,
                  bulletList: true,
                  orderedList: true,
                  blockquote: true,
                  image: isPro,
                  undo: true,
                  redo: true,
                }}
              />
            )}
          />
          {!isPro && (
            <p className='text-[11px] font-mono text-muted-foreground/60'>
              Photo uploads require a{' '}
              <Link
                to='/pro'
                className='text-amber-500 hover:text-amber-400 underline underline-offset-2'
              >
                Pro subscription
              </Link>
              .
            </p>
          )}
          <WatchPhotoPicker
            photos={watch?.photos ?? []}
            open={photosOpen}
            onToggle={() => setPhotosOpen((o) => !o)}
            onInsert={(url) => editorRef.current?.insertImage(url)}
          />
        </div>

        {/* Submit */}
        <div className='flex gap-3'>
          <button
            type='submit'
            disabled={createPost.isPending}
            className='inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-mono text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity'
          >
            {createPost.isPending ? 'Saving…' : 'Save Session'}
          </button>
          <Link
            to='/watches/$watchId/posts'
            params={{ watchId }}
            className='inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors no-underline'
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

const STAGE_ORDER: WatchStage[] = ['before', 'during', 'after', 'listing'];
const STAGE_LABELS: Record<WatchStage, string> = {
  before: 'Before',
  during: 'During',
  after: 'After',
  listing: 'Listing',
};

function WatchPhotoPicker({
  photos,
  open,
  onToggle,
  onInsert,
}: {
  photos: WatchPhoto[];
  open: boolean;
  onToggle: () => void;
  onInsert: (url: string) => void;
}) {
  const [recentlyInserted, setRecentlyInserted] = useState<Set<string>>(
    new Set(),
  );

  const grouped = STAGE_ORDER.map((stage) => ({
    stage,
    photos: photos.filter((ph) => ph.stage === stage),
  })).filter((g) => g.photos.length > 0);

  const handleInsert = (ph: WatchPhoto) => {
    onInsert(ph.image);
    setRecentlyInserted((prev) => new Set(prev).add(ph.id));
    setTimeout(() => {
      setRecentlyInserted((prev) => {
        const next = new Set(prev);
        next.delete(ph.id);
        return next;
      });
    }, 1500);
  };

  if (photos.length === 0) return null;

  return (
    <div className='mt-2 space-y-1.5'>
      <button
        type='button'
        onClick={onToggle}
        className='flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80 hover:text-foreground transition-colors'
      >
        <span>{open ? '▾' : '▸'}</span>
        Insert from Watch Photos ({photos.length})
      </button>
      {open && (
        <div className='rounded-md border border-border bg-card px-3 py-3 space-y-3'>
          {grouped.map(({ stage, photos: stagePhs }) => (
            <div key={stage}>
              <div className='text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 mb-1.5'>
                {STAGE_LABELS[stage]}
              </div>
              <div className='flex flex-wrap gap-2'>
                {stagePhs.map((ph) => {
                  const inserted = recentlyInserted.has(ph.id);
                  return (
                    <button
                      key={ph.id}
                      type='button'
                      onClick={() => handleInsert(ph)}
                      title={
                        inserted
                          ? 'Inserted!'
                          : ph.caption ||
                            `Insert ${STAGE_LABELS[ph.stage]} photo`
                      }
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
                        {inserted ? '✓' : '+'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <p className='text-[10px] font-mono text-muted-foreground/60'>
            Click a photo to insert it into the notes.
          </p>
        </div>
      )}
    </div>
  );
}
