import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePost } from '#/hooks/posts';
import { useUser } from '#/hooks/user';
import TiptapEditor from '#/components/TipTap';

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
      images: [],
    });
    navigate({
      to: '/watches/$watchId/posts/$postId',
      params: { watchId, postId: post.id },
    });
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
                value={field.value}
                onChange={field.onChange}
                minHeight='200px'
                toolbarConfig={{
                  headings: [true, true, true],
                  bold: true,
                  italic: true,
                  strike: true,
                  bulletList: true,
                  orderedList: true,
                  blockquote: true,
                  undo: true,
                  redo: true,
                }}
              />
            )}
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
