import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useCreatePost } from '#/hooks/posts';
import { useUser } from '#/hooks/user';
import { PostsApi } from '#/lib/api/posts';
import { MarkdownEditor } from '#/components/posts/MarkdownEditor';
import { WatchPhotoPicker } from '#/components/posts/WatchPhotoPicker';

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
  const navigate = useNavigate();
  const createPost = useCreatePost(watchId);
  const [stagedImages, setStagedImages] = useState<{ file: File; blobUrl: string }[]>([]);

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', session_date: '', body: '' },
  });

  const onSubmit = async (data: FormData) => {
    const post = await createPost.mutateAsync({
      data: { watch: watchId, ...data },
      images: stagedImages.map((s) => s.file),
    });

    // Replace blob URLs with real server URLs in the body
    let finalBody = data.body;
    stagedImages.forEach((staged, i) => {
      if (post.imageUrls[i]) {
        finalBody = finalBody.split(staged.blobUrl).join(post.imageUrls[i]);
      }
    });
    if (finalBody !== data.body) {
      await PostsApi.updatePost(post.id, { body: finalBody }, []);
    }

    navigate({
      to: '/watches/$watchId/posts/$postId',
      params: { watchId, postId: post.id },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newStaged = files.map((file) => ({ file, blobUrl: URL.createObjectURL(file) }));
    setStagedImages((prev) => [...prev, ...newStaged]);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setStagedImages((prev) => {
      URL.revokeObjectURL(prev[index].blobUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const insertImage = (staged: { file: File; blobUrl: string }) => {
    const current = getValues('body');
    const embed = `![${staged.file.name}](${staged.blobUrl})`;
    setValue('body', current ? `${current}\n\n${embed}` : embed);
  };

  if (!user) {
    return (
      <div className='text-sm font-mono text-muted-foreground'>
        You must be signed in to create repair sessions.
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
              <p className='text-[11px] text-red-400'>{errors.session_date.message}</p>
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
              <MarkdownEditor value={field.value} onChange={field.onChange} />
            )}
          />
        </div>

        {/* Watch photo picker */}
        <WatchPhotoPicker
          watchId={watchId}
          onInsert={(embed) => {
            const current = getValues('body');
            setValue('body', current ? `${current}\n\n${embed}` : embed);
          }}
        />

        {/* Images */}
        <div className='space-y-2'>
          <label className='text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80'>
            Attach Images
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
          {stagedImages.length > 0 && (
            <div className='flex flex-wrap gap-2 mt-2'>
              {stagedImages.map((staged, i) => (
                <div key={i} className='relative group flex flex-col items-center'>
                  <div className='relative'>
                    <img
                      src={staged.blobUrl}
                      alt={staged.file.name}
                      className='h-16 w-16 rounded-md object-cover border border-border'
                    />
                    {/* Insert button */}
                    <button
                      type='button'
                      onClick={() => insertImage(staged)}
                      title='Insert into body'
                      className='absolute inset-0 hidden group-hover:flex items-center justify-center rounded-md bg-black/60 text-white text-[10px] font-mono'
                    >
                      Insert
                    </button>
                    {/* Remove button */}
                    <button
                      type='button'
                      onClick={() => removeImage(i)}
                      className='absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-black/80 text-white/90 text-xs hover:text-red-400'
                    >
                      ×
                    </button>
                  </div>
                  <span className='mt-0.5 block text-[10px] font-mono text-muted-foreground truncate max-w-[64px]'>
                    {staged.file.name}
                  </span>
                </div>
              ))}
            </div>
          )}
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
