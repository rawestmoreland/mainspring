import DOMPurify from 'dompurify';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useState } from 'react';
import { format } from 'date-fns/format';
import {
  useGetPostById,
  useUpdatePost,
  useDeletePostImage,
} from '#/hooks/posts';
import { useSubscription } from '#/hooks/subscription';
import { useUser } from '#/hooks/user';
import { useGetWatchById } from '#/hooks/watches';

import { PostsApi } from '#/lib/api/posts';
import TiptapEditor, { type TiptapEditorRef } from '#/components/TipTap';
import type { WatchPhoto, WatchStage } from '#/types';

export const Route = createFileRoute('/watches/$watchId/posts/$postId')({
  component: PostPage,
});

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  session_date: z.string().trim().min(1, 'Session date is required'),
  body: z.string(),
});
type FormData = z.infer<typeof schema>;

function PostPage() {
  const { t } = useTranslation();
  const { watchId, postId } = Route.useParams();
  const { data: post, isLoading } = useGetPostById(postId);
  const { data: watch } = useGetWatchById(watchId);
  const { data: user } = useUser();
  const { isPro } = useSubscription();
  const isFrozen = !!watch?.is_frozen && !isPro;
  const updatePost = useUpdatePost(watchId, postId);
  const deleteImage = useDeletePostImage(watchId, postId);
  const [editing, setEditing] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);
  const editorRef = useRef<TiptapEditorRef>(null);
  const pendingImagesRef = useRef<Map<string, File>>(new Map());

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: post
      ? {
          title: post.title,
          // Slice to YYYY-MM-DD in case PocketBase returns a full datetime string
          session_date: post.session_date.slice(0, 10),
          body: post.body,
        }
      : undefined,
  });

  const handleImageUpload = async (file: File): Promise<string> => {
    const blobUrl = URL.createObjectURL(file);
    pendingImagesRef.current.set(blobUrl, file);
    return blobUrl;
  };

  const onSubmit = async (data: FormData) => {
    const pendingEntries = Array.from(pendingImagesRef.current.entries());
    const imageFiles = pendingEntries.map(([, file]) => file);

    const updatedPost = await updatePost.mutateAsync({
      data,
      newImages: imageFiles,
    });

    // Rewrite body HTML: replace local blob URLs with real PocketBase URLs
    if (pendingEntries.length > 0 && updatedPost.imageUrls.length > 0) {
      let updatedBody = data.body;
      const existingCount = updatedPost.images.length - pendingEntries.length;
      pendingEntries.forEach(([blobUrl], i) => {
        if (updatedPost.imageUrls[existingCount + i]) {
          updatedBody = updatedBody
            .split(blobUrl)
            .join(updatedPost.imageUrls[existingCount + i]);
        }
      });
      if (updatedBody !== data.body) {
        await PostsApi.updatePost(updatedPost.id, { body: updatedBody }, []);
      }
    }

    pendingEntries.forEach(([blobUrl]) => URL.revokeObjectURL(blobUrl));
    pendingImagesRef.current.clear();

    setPhotosOpen(false);
    setEditing(false);
  };

  const handleCancel = () => {
    pendingImagesRef.current.forEach((_, blobUrl) =>
      URL.revokeObjectURL(blobUrl),
    );
    pendingImagesRef.current.clear();
    reset();
    setPhotosOpen(false);
    setEditing(false);
  };

  if (isLoading) {
    return (
      <div className='text-sm font-mono text-muted-foreground'>{t('loading')}</div>
    );
  }

  if (!post) {
    return (
      <div className='space-y-3'>
        <Link
          to='/watches/$watchId/posts'
          params={{ watchId }}
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          {t('backToRepairLog')}
        </Link>
        <div className='text-sm text-red-400 font-mono'>{t('postNotFound')}</div>
      </div>
    );
  }

  return (
    <div className='space-y-8 max-w-4xl'>
      {/* Back link */}
      <div>
        <Link
          to='/watches/$watchId/posts'
          params={{ watchId }}
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          {t('backToRepairLog')}
        </Link>
      </div>

      {editing ? (
        /* ─── Edit mode ─── */
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='space-y-1.5'>
              <label className='text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80'>
                {t('repairLogSessionTitle')}
              </label>
              <input
                {...register('title')}
                type='text'
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring'
              />
              {errors.title && (
                <p className='text-[11px] text-red-400'>
                  {errors.title.message}
                </p>
              )}
            </div>
            <div className='space-y-1.5'>
              <label className='text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80'>
                {t('repairLogSessionDate')}
              </label>
              <input
                {...register('session_date')}
                type='date'
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring'
              />
            </div>
          </div>

          {/* Body */}
          <div className='space-y-1.5'>
            <label className='text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80'>
              {t('repairLogNotes')}
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
                {t('repairLogPhotoUploadsRequire')}{' '}
                <Link
                  to='/pro'
                  className='text-amber-500 hover:text-amber-400 underline underline-offset-2'
                >
                  {t('repairLogProSubscription')}
                </Link>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                {'.'}
              </p>
            )}
            <WatchPhotoPicker
              photos={watch?.photos ?? []}
              open={photosOpen}
              onToggle={() => setPhotosOpen((o) => !o)}
              onInsert={(url) => editorRef.current?.insertImage(url)}
            />
          </div>

          <div className='flex gap-3'>
            <button
              type='submit'
              disabled={updatePost.isPending}
              className='inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-mono text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity'
            >
              {updatePost.isPending ? t('repairLogSaving') : t('repairLogSaveChanges')}
            </button>
            <button
              type='button'
              onClick={handleCancel}
              className='inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors'
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      ) : (
        /* ─── Read mode ─── */
        <div className='space-y-6'>
          <section className='flex items-start justify-between gap-4'>
            <div>
              <h1 className='text-2xl font-serif font-semibold text-foreground'>
                {post.title}
              </h1>
              <p className='mt-1 text-xs font-mono text-muted-foreground'>
                {post.session_date
                  ? format(new Date(post.session_date), 'MMMM d, yyyy')
                  : '—'}
              </p>
            </div>
            {user && !isFrozen && (
              <button
                onClick={() => setEditing(true)}
                className='shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors'
              >
                {t('repairLogEdit')}
              </button>
            )}
          </section>

          {/* Body */}
          {post.body ? (
            <div
              className='prose max-w-none'
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(post.body),
              }}
            />
          ) : (
            <p className='text-sm text-muted-foreground italic'>
              {t('repairLogNoNotes')}
            </p>
          )}

          {/* Image gallery */}
          {post.imageUrls.length > 0 && (
            <section className='space-y-3'>
              <div className='text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80'>
                {t('repairLogAttachments', { count: post.imageUrls.length })}
              </div>
              <div className='grid grid-cols-3 gap-3'>
                {post.images.map((filename, i) => (
                  <figure
                    key={filename}
                    className='group relative overflow-hidden rounded-md border border-border bg-card aspect-4/3'
                  >
                    <a
                      href={post.imageUrls[i]}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='block h-full w-full'
                    >
                      <img
                        src={`${post.imageUrls[i]}?thumb=600x450`}
                        alt={filename}
                        className='h-full w-full object-cover cursor-zoom-in'
                        loading='lazy'
                      />
                    </a>
                    {user && (
                      <button
                        onClick={() => deleteImage.mutate(filename)}
                        disabled={deleteImage.isPending}
                        className='absolute top-1.5 right-1.5 hidden group-hover:flex items-center justify-center w-6 h-6 rounded bg-black/70 text-white/80 hover:text-red-400 hover:bg-black/90 transition-colors'
                        aria-label={t('repairLogDeleteImage')}
                      >
                        ×
                      </button>
                    )}
                  </figure>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

const STAGE_ORDER: WatchStage[] = ['before', 'during', 'after', 'listing'];

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
  const { t } = useTranslation();
  const stageLabels: Record<WatchStage, string> = {
    before: t('stageBefore'),
    during: t('stageDuring'),
    after: t('stageAfter'),
    listing: t('stageListing'),
  };
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
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <span>{open ? '▾' : '▸'}</span>
        {t('markdownInsertFromPhotos', { count: photos.length })}
      </button>
      {open && (
        <div className='rounded-md border border-border bg-card px-3 py-3 space-y-3'>
          {grouped.map(({ stage, photos: stagePhs }) => (
            <div key={stage}>
              <div className='text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 mb-1.5'>
                {stageLabels[stage]}
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
                          ? t('markdownPhotosInserted')
                          : ph.caption || t('markdownPhotosInsert', { stage: stageLabels[ph.stage] })
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
            {t('markdownClickToInsert2')}
          </p>
        </div>
      )}
    </div>
  );
}
