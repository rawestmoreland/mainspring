import { createFileRoute, Link } from '@tanstack/react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { marked } from 'marked';
import { format } from 'date-fns/format';
import {
  useGetPostById,
  useUpdatePost,
  useDeletePostImage,
} from '#/hooks/posts';
import { useUser } from '#/hooks/user';
import { MarkdownEditor } from '#/components/posts/MarkdownEditor';

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
  const { watchId, postId } = Route.useParams();
  const { data: post, isLoading } = useGetPostById(postId);
  const { data: user } = useUser();
  const updatePost = useUpdatePost(watchId, postId);
  const deleteImage = useDeletePostImage(watchId, postId);
  const [editing, setEditing] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: post
      ? { title: post.title, session_date: post.session_date, body: post.body }
      : undefined,
  });

  const onSubmit = async (data: FormData) => {
    await updatePost.mutateAsync({ data, newImages });
    setNewImages([]);
    setEditing(false);
  };

  const handleCancel = () => {
    reset();
    setNewImages([]);
    setEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setNewImages((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  if (isLoading) {
    return (
      <div className='text-sm font-mono text-muted-foreground'>Loading…</div>
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
          ← Back to Repair Log
        </Link>
        <div className='text-sm text-red-400 font-mono'>Post not found.</div>
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
          ← Back to Repair Log
        </Link>
      </div>

      {editing ? (
        /* ─── Edit mode ─── */
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='space-y-1.5'>
              <label className='text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80'>
                Title
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
                Session Date
              </label>
              <input
                {...register('session_date')}
                type='date'
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring'
              />
            </div>
          </div>

          {/* Existing image URLs panel */}
          {post.imageUrls.length > 0 && (
            <div className='space-y-2 rounded-md border border-border bg-card px-4 py-3'>
              <p className='text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80'>
                Attached images — click to copy embed snippet
              </p>
              <ul className='space-y-1.5'>
                {post.images.map((filename, i) => {
                  const url = post.imageUrls[i];
                  const snippet = `![${filename}](${url})`;
                  return (
                    <li key={filename}>
                      <button
                        type='button'
                        onClick={() => copyToClipboard(snippet)}
                        className='w-full text-left rounded px-2 py-1.5 bg-background border border-border text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors truncate'
                      >
                        {copied === snippet ? '✓ Copied!' : snippet}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className='space-y-1.5'>
            <label className='text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80'>
              Notes
            </label>
            <Controller
              name='body'
              control={control}
              render={({ field }) => (
                <MarkdownEditor value={field.value} onChange={field.onChange} />
              )}
            />
          </div>

          {/* Add more images */}
          <div className='space-y-2'>
            <label className='text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80'>
              Add More Images
            </label>
            <label className='inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-card px-4 py-2 text-xs font-mono text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors'>
              + Add images
              <input
                type='file'
                multiple
                accept='image/*'
                onChange={handleFileChange}
                className='sr-only'
              />
            </label>
            {newImages.length > 0 && (
              <div className='flex flex-wrap gap-2 mt-2'>
                {newImages.map((f, i) => (
                  <div key={i} className='relative group'>
                    <img
                      src={URL.createObjectURL(f)}
                      alt={f.name}
                      className='h-16 w-16 rounded-md object-cover border border-border'
                    />
                    <button
                      type='button'
                      onClick={() =>
                        setNewImages((prev) => prev.filter((_, j) => j !== i))
                      }
                      className='absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-black/80 text-white/90 text-xs hover:text-red-400'
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className='flex gap-3'>
            <button
              type='submit'
              disabled={updatePost.isPending}
              className='inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-mono text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity'
            >
              {updatePost.isPending ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              type='button'
              onClick={handleCancel}
              className='inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors'
            >
              Cancel
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
            {user && (
              <button
                onClick={() => setEditing(true)}
                className='shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors'
              >
                Edit
              </button>
            )}
          </section>

          {/* Body */}
          {post.body ? (
            <div
              className='prose max-w-none'
              dangerouslySetInnerHTML={{ __html: marked(post.body) as string }}
            />
          ) : (
            <p className='text-sm text-muted-foreground italic'>
              No notes written yet.
            </p>
          )}

          {/* Image gallery */}
          {post.imageUrls.length > 0 && (
            <section className='space-y-3'>
              <div className='text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80'>
                Attachments ({post.imageUrls.length})
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
                        aria-label='Delete image'
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
