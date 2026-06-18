import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns/format';
import { useGetPostsByWatch, useDeletePost } from '#/hooks/posts';
import { useGetWatchById } from '#/hooks/watches';
import { useUser } from '#/hooks/user';
import { useSubscription } from '#/hooks/subscription';

export const Route = createFileRoute('/watches/$watchId/posts/')({
  component: RepairLogPage,
});

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function RepairLogPage() {
  const { t } = useTranslation();
  const { watchId } = Route.useParams();
  const { data: watch } = useGetWatchById(watchId);
  const { data: posts, isLoading } = useGetPostsByWatch(watchId);
  const { data: user } = useUser();
  const { isPro } = useSubscription();
  const deletePost = useDeletePost(watchId);
  const isFrozen = !!watch?.is_frozen && !isPro;

  return (
    <div className='space-y-8'>
      {/* Back link */}
      <div>
        <Link
          to='/watches/$watchId'
          params={{ watchId }}
          className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground'
        >
          {watch ? `← ${watch.make} ${watch.model}` : t('backToWatch')}
        </Link>
      </div>

      {/* Header */}
      <section className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-serif font-semibold text-foreground'>
            {t('repairLogTitle')}
          </h1>
          {watch && (
            <p className='mt-1 text-xs font-mono text-muted-foreground'>
              {watch.make} {watch.model} · {watch.reference}
            </p>
          )}
        </div>
        {user && !isFrozen && (
          <Link
            to='/watches/$watchId/posts/new'
            params={{ watchId }}
            className='inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-mono text-primary-foreground hover:opacity-90 transition-opacity no-underline'
          >
            {t('repairLogNewSession')}
          </Link>
        )}
      </section>

      {/* Post list */}
      {isLoading ? (
        <div className='text-sm font-mono text-muted-foreground'>{t('loading')}</div>
      ) : !posts || posts.length === 0 ? (
        <div className='text-center py-12 text-xs font-mono text-muted-foreground border border-dashed border-border rounded-md space-y-2'>
          <p>{t('repairLogEmpty')}</p>
          {user && !isFrozen && (
            <Link
              to='/watches/$watchId/posts/new'
              params={{ watchId }}
              className='text-primary'
            >
              {t('repairLogLogFirst')}
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
                        {stripHtml(post.body)}
                      </p>
                    )}
                    {post.images.length > 0 && (
                      <p className='mt-1.5 text-[11px] font-mono text-muted-foreground/70'>
                        {t('repairLogImageCount', { count: post.images.length })}
                      </p>
                    )}
                  </Link>
                </div>
                {user && (
                  <button
                    onClick={() => deletePost.mutate(post.id)}
                    disabled={deletePost.isPending}
                    className='shrink-0 hidden group-hover:flex items-center justify-center w-6 h-6 rounded text-muted-foreground hover:text-red-400 transition-colors text-sm'
                    aria-label={t('repairLogDeletePost')}
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
