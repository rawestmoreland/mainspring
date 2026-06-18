import DOMPurify from 'dompurify';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns/format';
import type { UserProfile, RepairPost } from '#/types';
import { useGoogleAnalytics } from 'tanstack-router-ga4';

export const Route = createFileRoute('/post/$postId')({
  component: PublicPostDetailPage,
});

function PublicPostDetailPage() {
  const { t } = useTranslation();
  const ga4 = useGoogleAnalytics();
  const ctx = Route.useRouteContext() as { tenant?: UserProfile | null };
  const { postId } = Route.useParams();

  const pbUrl = import.meta.env.VITE_PUBLIC_POCKETBASE_URL as string;
  const assetUrl = import.meta.env.VITE_PUBLIC_ASSET_URL as string;

  const { data: post, isLoading } = useQuery<RepairPost | null>({
    queryKey: ['public', 'post', postId],
    queryFn: async () => {
      const res = await fetch(
        `${pbUrl}/api/collections/repair_posts/records/${postId}`,
      );
      if (!res.ok) return null;
      const r = (await res.json()) as {
        collectionId: string;
        id: string;
        images?: string[];
      } & Record<string, unknown>;
      const imageUrls: string[] = (r.images ?? []).map(
        (filename: string) =>
          `${assetUrl}/${r.collectionId}/${r.id}/${filename}`,
      );
      return { ...r, imageUrls } as unknown as RepairPost;
    },
    enabled: !!ctx.tenant,
  });

  if (!ctx.tenant) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <p className='font-mono text-sm text-muted-foreground'>
          {t('pageNotFound')}
        </p>
      </div>
    );
  }

  const tenant = ctx.tenant;

  return (
    <div className='min-h-screen'>
      {/* Nav */}
      <header className='fixed top-0 inset-x-0 z-50 h-14 flex items-center gap-3 px-5 border-b border-border bg-background/90 backdrop-blur-md'>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <span className='font-serif font-bold text-foreground'>Hairspring</span>
        <span className='text-border'>·</span>
        <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
          {tenant.display_name || tenant.subdomain}
        </span>
      </header>

      <div className='max-w-3xl mx-auto px-5 pt-24 pb-16 space-y-6'>
        {/* Back link */}
        {post?.watch ? (
          <Link
            to='/watch/$watchId'
            params={{ watchId: post.watch }}
            className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground no-underline'
          >
            {t('backToWatch')}
          </Link>
        ) : (
          <Link
            to='/'
            className='inline-flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground no-underline'
          >
            {t('backToProfile')}
          </Link>
        )}

        {isLoading && (
          <div className='text-sm text-muted-foreground font-mono'>
            {t('loading')}
          </div>
        )}

        {!isLoading && !post && (
          <div className='text-sm text-red-400 font-mono'>{t('postNotFound')}</div>
        )}

        {post && (
          <>
            {/* Header */}
            <div className='pb-5 border-b border-border'>
              <h1 className='text-2xl font-serif font-semibold text-foreground mb-1'>
                {post.title}
              </h1>
              {post.session_date && (
                <span className='font-mono text-[11px] text-muted-foreground'>
                  {format(new Date(post.session_date), 'MMMM d, yyyy')}
                </span>
              )}
            </div>

            {/* Body */}
            {post.body && (
              <div
                className='prose max-w-none'
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.body) }}
              />
            )}

            {/* Image grid */}
            {(post.imageUrls ?? []).length > 0 && (
              <div className='grid grid-cols-3 gap-2 pt-2'>
                {post.imageUrls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='block overflow-hidden rounded-lg'
                  >
                    <img
                      src={`${url}?thumb=600x450`}
                      alt=''
                      className='w-full aspect-4/3 object-cover hover:opacity-90 transition-opacity'
                      loading='lazy'
                    />
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <footer className='border-t border-border py-6'>
        <div className='max-w-3xl mx-auto px-5'>
          <a
            href={'https://hairspring.app'}
            target='_blank'
            rel='noopener noreferrer'
            onClick={() => {
              ga4.event('click_hairspring_attribution', {
                category: 'Navigation',
                label: 'Hairspring Attribution Link',
              });
            }}
          >
            {/* eslint-disable-next-line i18next/no-literal-string */}
            <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
              Powered by Hairspring
            </span>
          </a>
        </div>
      </footer>
    </div>
  );
}
