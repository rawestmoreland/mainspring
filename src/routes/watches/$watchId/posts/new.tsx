import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useCreatePost } from '#/hooks/posts';
import { useUser } from '#/hooks/user';
import { MarkdownEditor } from '#/components/posts/MarkdownEditor';

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
  const [images, setImages] = useState<File[]>([]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', session_date: '', body: '' },
  });

  const onSubmit = async (data: FormData) => {
    const post = await createPost.mutateAsync({
      data: { watch: watchId, ...data },
      images,
    });
    navigate({
      to: '/watches/$watchId/posts/$postId',
      params: { watchId, postId: post.id },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setImages((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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

        {/* Images */}
        <div className='space-y-2'>
          <label className='text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80'>
            Attach Images
          </label>
          <p className='text-[11px] font-mono text-muted-foreground'>
            Images upload when you save. You can embed them in the body after saving.
          </p>
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
          {images.length > 0 && (
            <div className='flex flex-wrap gap-2 mt-2'>
              {images.map((f, i) => (
                <div key={i} className='relative group'>
                  <img
                    src={URL.createObjectURL(f)}
                    alt={f.name}
                    className='h-16 w-16 rounded-md object-cover border border-border'
                  />
                  <button
                    type='button'
                    onClick={() => removeImage(i)}
                    className='absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-black/80 text-white/90 text-xs hover:text-red-400'
                  >
                    ×
                  </button>
                  <span className='mt-0.5 block text-[10px] font-mono text-muted-foreground truncate max-w-[64px]'>
                    {f.name}
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
