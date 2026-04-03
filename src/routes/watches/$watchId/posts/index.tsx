import { createFileRoute, Link } from '@tanstack/react-router';
import { format } from 'date-fns/format';
import { useGetPostsByWatch, useDeletePost } from '#/hooks/posts';
import { useGetWatchById } from '#/hooks/watches';
import { useUser } from '#/hooks/user';

export const Route = createFileRoute('/watches/$watchId/posts/')({
  component: RepairLogPage,
});

function stripMarkdown(text: string): string {
  return text.replace(/[#*`_~\[\]()>!]/g, '').replace(/\n+/g, ' ').trim();
}

function RepairLogPage() {
  const { watchId } = Route.useParams();
  const { data: watch } = useGetWatchById(watchId);
  const { data: posts, isLoading } = useGetPostsByWatch(watchId);
  const { data: user } = useUser();
  const deletePost = useDeletePost(watchId);

  return (
    <div className='space-y-8'>
      {/* Back link */}
      <div>
        <Link
          to='/watches/$watchId'
          params={{ watchId }}
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          ← {watch ? `${watch.make} ${watch.model}` : 'Back to Watch'}
        </Link>
      </div>

      {/* Header */}
      <section className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-serif font-semibold text-foreground'>
            Repair Log
          </h1>
          {watch && (
            <p className='mt-1 text-xs font-mono text-muted-foreground'>
              {watch.make} {watch.model} · {watch.reference}
            </p>
          )}
        </div>
        {user && (
          <Link
            to='/watches/$watchId/posts/new'
            params={{ watchId }}
            className='inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-mono text-primary-foreground hover:opacity-90 transition-opacity no-underline'
          >
            + New session
          </Link>
        )}
      </section>

      {/* Post list */}
      {isLoading ? (
        <div className='text-sm font-mono text-muted-foreground'>Loading…</div>
      ) : !posts || posts.length === 0 ? (
        <div className='text-center py-12 text-xs font-mono text-muted-foreground border border-dashed border-border rounded-md space-y-2'>
          <p>No repair sessions logged yet.</p>
          {user && (
            <Link
              to='/watches/$watchId/posts/new'
              params={{ watchId }}
              className='text-primary'
            >
              Log the first one →
            </Link>
          )}
        </div>
      ) : (
        <ul className='space-y-3'>
          {posts.map((post) => (
            <li key={post.id}>
              <div className='group flex items-start gap-3 rounded-md border border-border bg-card px-4 py-3 hover:bg-accent/10 transition-colors'>
                <div className='flex-1 min-w-0'>
                  <Link
                    to='/watches/$watchId/posts/$postId'
                    params={{ watchId, postId: post.id }}
                    className='block no-underline'
                  >
                    <div className='flex items-baseline justify-between gap-4'>
                      <span className='text-sm font-semibold text-foreground group-hover:text-primary transition-colors'>
                        {post.title}
                      </span>
                      <span className='shrink-0 text-[11px] font-mono text-muted-foreground'>
                        {post.session_date
                          ? format(new Date(post.session_date), 'MMM d, yyyy')
                          : '—'}
                      </span>
                    </div>
                    {post.body && (
                      <p className='mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed'>
                        {stripMarkdown(post.body)}
                      </p>
                    )}
                    {post.images.length > 0 && (
                      <p className='mt-1.5 text-[11px] font-mono text-muted-foreground/70'>
                        {post.images.length} image{post.images.length !== 1 ? 's' : ''} attached
                      </p>
                    )}
                  </Link>
                </div>
                {user && (
                  <button
                    onClick={() => deletePost.mutate(post.id)}
                    disabled={deletePost.isPending}
                    className='shrink-0 hidden group-hover:flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-red-400 transition-colors text-sm'
                    aria-label='Delete post'
                  >
                    ×
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
