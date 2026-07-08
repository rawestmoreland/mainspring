/* eslint-disable i18next/no-literal-string */
import { useMemo } from 'react';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { createIsomorphicFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { SectionLabel } from '#/components/primitives/SectionLabel';
import { PublicProfileSkeleton } from '#/components/skeletons';
import { LandingPage } from '#/components/landing/LandingPage';
import type { UserProfile, Watch, RepairPost } from '#/types';
import { useGoogleAnalytics } from 'tanstack-router-ga4';

const SUPPORTED_LANGS = new Set(['en', 'de', 'fr']);

function detectLangFromHeader(header: string): string {
  for (const part of header.split(',')) {
    const lang = part.trim().split(';')[0].split('-')[0].toLowerCase();
    if (SUPPORTED_LANGS.has(lang)) return lang;
  }
  return 'en';
}

const getAcceptLanguage = createIsomorphicFn()
  .client(() => navigator.language.split('-')[0].toLowerCase())
  .server(async () => {
    const { getRequestHeader } = await import('@tanstack/react-start/server');
    return detectLangFromHeader(getRequestHeader('accept-language') ?? '');
  });

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    const { tenant } = context as { tenant: UserProfile | null };
    if (!tenant) {
      const lang = await getAcceptLanguage();
      const resolved = SUPPORTED_LANGS.has(lang) ? lang : 'en';
      throw redirect({
        to: '/$lang',
        params: { lang: resolved },
        replace: true,
      });
    }
  },
  component: IndexPage,
});

function IndexPage() {
  const ctx = Route.useRouteContext() as { tenant?: UserProfile | null };
  if (ctx.tenant) return <PublicProfile tenant={ctx.tenant} />;
  return <LandingPage />;
}

// ─── Public profile (subdomain visitors) ────────────────────────────────────

function PublicProfile({ tenant }: { tenant: UserProfile }) {
  const pbUrl = import.meta.env.VITE_PUBLIC_POCKETBASE_URL;

  const ga4 = useGoogleAnalytics();

  const { data: watches, isLoading: watchesLoading } = useQuery<Watch[]>({
    queryKey: ['public', 'watches', tenant.user],
    queryFn: async () => {
      const res = await fetch(
        `${pbUrl}/api/collections/watches/records?filter=user%3D%22${tenant.user}%22&sort=-created&perPage=100&expand=timegrapher_readings_via_watch`,
      );
      if (!res.ok) return [];
      const data = ((await res.json()) as { items?: Watch[] }).items ?? [];
      return data.map((w) => ({
        ...w,
        featured_image_url: w.featured_image
          ? `${pbUrl}/api/files/watches/${w.id}/${w.featured_image}`
          : undefined,
      }));
    },
  });

  const { data: posts, isLoading: postsLoading } = useQuery<RepairPost[]>({
    queryKey: ['public', 'posts', tenant.user],
    queryFn: async () => {
      const res = await fetch(
        `${pbUrl}/api/collections/repair_posts/records?filter=user%3D%22${tenant.user}%22&sort=-session_date&perPage=50`,
      );
      if (!res.ok) return [];
      return ((await res.json()) as { items?: RepairPost[] }).items ?? [];
    },
  });

  const postsByWatch = useMemo(() => {
    const map: Record<string, RepairPost[]> = {};
    (posts ?? []).forEach((p) => {
      const key = p.watch ?? '__none__';
      (map[key] ??= []).push(p);
    });
    return map;
  }, [posts]);

  const totalHours = useMemo(
    () => (watches ?? []).reduce((sum, w) => sum + (w.hours_spent ?? 0), 0),
    [watches],
  );

  if (watchesLoading || postsLoading) return <PublicProfileSkeleton />;

  const initials = (tenant.display_name || tenant.subdomain || '?')
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();

  return (
    <div className='min-h-screen pb-20'>
      {/* Nav */}
      <header className='fixed top-0 inset-x-0 z-50 h-14 flex items-center gap-3 px-5 border-b border-border bg-background/90 backdrop-blur-md'>
        <a
          href='https://hairspring.app'
          className='font-serif font-bold text-foreground'
          onClick={() => {
            ga4.event('click_hairspring_logo', {
              category: 'Navigation',
              label: 'Hairspring Logo',
            });
          }}
        >
          Hairspring
        </a>
        <span className='text-border'>·</span>
        <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
          {tenant.display_name || tenant.subdomain}
        </span>
      </header>

      <div className='max-w-3xl mx-auto px-5 pt-24 pb-16'>
        {/* Profile header */}
        <div className='flex items-center gap-4 mb-6'>
          <div className='w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0'>
            <span className='font-mono text-sm font-bold text-primary'>
              {initials}
            </span>
          </div>
          <div>
            <h1 className='font-serif text-xl font-bold text-foreground'>
              {tenant.display_name || tenant.subdomain}
            </h1>
            {tenant.bio && (
              <p className='text-sm text-muted-foreground mt-0.5 leading-relaxed'>
                {tenant.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className='flex flex-wrap gap-6 mb-8 pb-7 border-b border-border'>
          <StatItem
            value={watches?.length ?? 0}
            label={watches?.length === 1 ? 'watch' : 'watches'}
          />
          <StatItem
            value={posts?.length ?? 0}
            label={posts?.length === 1 ? 'repair session' : 'repair sessions'}
          />
          {totalHours > 0 && (
            <StatItem value={Math.round(totalHours)} label='hours logged' />
          )}
        </div>

        {/* Watch projects */}
        <div className='mb-4'>
          <SectionLabel>Watch Projects</SectionLabel>
        </div>

        {!watches?.length ? (
          <p className='text-sm text-muted-foreground'>No projects yet.</p>
        ) : tenant.gallery_view ? (
          <GalleryView watches={watches} postsByWatch={postsByWatch} />
        ) : (
          <div className='space-y-3'>
            {watches.map((w) => (
              <WatchProjectCard
                key={w.id}
                watch={w}
                posts={postsByWatch[w.id] ?? []}
              />
            ))}
          </div>
        )}

        {/* Repair posts not linked to any watch */}
        {(postsByWatch['__none__'] ?? []).length > 0 && (
          <div className='mt-8'>
            <div className='mb-3.5'>
              <SectionLabel>Other Repair Logs</SectionLabel>
            </div>
            <div className='bg-card border border-border rounded overflow-hidden'>
              {postsByWatch['__none__'].map((p) => (
                <PostRow key={p.id} post={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className='border-t border-border py-6'>
        <div className='max-w-3xl mx-auto px-5'>
          <a
            href='https://hairspring.app'
            target='_blank'
            rel='noopener noreferrer'
            onClick={() => {
              ga4.event('click_hairspring_attribution', {
                category: 'Navigation',
                label: 'Hairspring Attribution Link',
              });
            }}
          >
            <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
              Powered by Hairspring
            </span>
          </a>
        </div>
      </footer>

      {/* Sticky sign-up CTA */}
      <div className='fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border px-5 py-3 flex items-center justify-between gap-4'>
        <div className='min-w-0'>
          <p className='font-serif text-sm font-semibold text-foreground'>
            Track your own watch projects
          </p>
          <p className='font-mono text-[10px] text-muted-foreground truncate'>
            Repair logs · Timegrapher data · Collection management
          </p>
        </div>
        <a
          href='https://hairspring.app'
          className='shrink-0 bg-primary text-primary-foreground font-mono text-xs font-semibold px-4 py-2 rounded hover:bg-primary/90 transition-colors whitespace-nowrap'
          onClick={() => {
            ga4.event('click_cta_sticky_banner', {
              category: 'CTA',
              label: 'Sticky CTA Banner',
            });
          }}
        >
          Get started →
        </a>
      </div>
    </div>
  );
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='font-mono text-2xl font-bold text-foreground tabular-nums leading-none'>
        {value}
      </span>
      <span className='font-mono text-[9px] uppercase tracking-widest text-muted-foreground'>
        {label}
      </span>
    </div>
  );
}

function GalleryView({
  watches,
  postsByWatch,
}: {
  watches: Watch[];
  postsByWatch: Record<string, RepairPost[]>;
}) {
  return (
    <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
      {watches.map((w) => {
        const postCount = (postsByWatch[w.id] ?? []).length;
        const meta = [w.reference, w.year].filter(Boolean).join(' · ');
        return (
          <Link
            key={w.id}
            to='/watch/$watchId'
            params={{ watchId: w.id }}
            className='group block rounded overflow-hidden border border-border bg-card hover:border-primary/40 transition-colors no-underline'
          >
            <div className='aspect-[4/3] relative overflow-hidden bg-zinc-800'>
              {w.featured_image_url ? (
                <img
                  src={w.featured_image_url}
                  alt={`${w.make} ${w.model}`}
                  className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                />
              ) : (
                <div className='w-full h-full flex items-center justify-center'>
                  <span className='font-mono text-3xl font-bold text-zinc-600 select-none'>
                    {w.make[0]?.toUpperCase()}
                    {w.model[0]?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className='p-3'>
              <div className='flex items-start justify-between gap-2 mb-1'>
                <p className='font-serif font-semibold text-sm text-foreground leading-tight'>
                  {w.make} {w.model}
                </p>
                <StatusBadge status={w.status} />
              </div>
              {meta && (
                <p className='font-mono text-[10px] text-muted-foreground'>
                  {meta}
                </p>
              )}
              {postCount > 0 && (
                <p className='font-mono text-[10px] text-muted-foreground mt-1.5'>
                  {postCount} repair log{postCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function WatchProjectCard({
  watch: w,
  posts,
}: {
  watch: Watch;
  posts: RepairPost[];
}) {
  const meta = [w.reference, w.year].filter(Boolean).join(' · ');
  const lastPost = posts[0];

  return (
    <div className='bg-card border border-border rounded overflow-hidden'>
      {/* Watch header row */}
      <Link
        to='/watch/$watchId'
        params={{ watchId: w.id }}
        className='flex items-start gap-3 px-3.5 py-3 border-b border-border hover:bg-muted/40 transition-colors no-underline'
      >
        {/* Thumbnail */}
        <div className='w-12 h-12 rounded overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center'>
          {w.featured_image_url ? (
            <img
              src={w.featured_image_url}
              alt={`${w.make} ${w.model}`}
              className='w-full h-full object-cover'
            />
          ) : (
            <span className='font-mono text-sm font-bold text-zinc-600 select-none'>
              {w.make[0]?.toUpperCase()}
              {w.model[0]?.toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className='flex-1 min-w-0'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='font-serif font-semibold text-foreground text-sm'>
              {w.make} {w.model}
            </span>
            <StatusBadge status={w.status} />
          </div>
          <div className='flex flex-wrap items-center gap-1.5 mt-0.5'>
            {meta && (
              <span className='font-mono text-[10px] text-muted-foreground'>
                {meta}
              </span>
            )}
            {meta && lastPost && (
              <span className='text-border text-[10px]'>·</span>
            )}
            {lastPost && (
              <span className='font-mono text-[10px] text-muted-foreground'>
                Last activity{' '}
                {new Date(lastPost.session_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>

        {posts.length > 0 && (
          <span className='font-mono text-[10px] text-muted-foreground shrink-0 pt-0.5'>
            {posts.length} log{posts.length !== 1 ? 's' : ''}
          </span>
        )}
      </Link>

      {/* Repair posts */}
      {posts.length > 0 ? (
        posts.map((p) => <PostRow key={p.id} post={p} />)
      ) : (
        <div className='px-3.5 py-2.5 text-xs text-muted-foreground italic'>
          No repair logs yet.
        </div>
      )}
    </div>
  );
}

function PostRow({ post: p }: { post: RepairPost }) {
  return (
    <Link
      to='/post/$postId'
      params={{ postId: p.id }}
      className='flex justify-between items-start gap-3 px-3.5 py-2.5 border-b border-border last:border-0 text-sm hover:bg-muted/40 transition-colors no-underline'
    >
      <span className='text-foreground'>{p.title}</span>
      {p.session_date && (
        <span className='font-mono text-xs text-muted-foreground shrink-0'>
          {new Date(p.session_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      )}
    </Link>
  );
}
