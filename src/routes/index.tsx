import { useMemo } from 'react';
import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from '#/components/primitives/StatusBadge';
import { SectionLabel } from '#/components/primitives/SectionLabel';
import { PublicProfileSkeleton } from '#/components/skeletons';
import type { UserProfile, Watch, RepairPost } from '#/types';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    if (typeof window !== 'undefined') {
      const pb = (await import('#/lib/pocketbase')).default;
      if (pb.authStore.isValid) {
        throw redirect({ to: '/dashboard' });
      }
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
  const pbUrl = import.meta.env.VITE_POCKETBASE_URL;

  const { data: watches, isLoading: watchesLoading } = useQuery<Watch[]>({
    queryKey: ['public', 'watches', tenant.user],
    queryFn: async () => {
      const res = await fetch(
        `${pbUrl}/api/collections/watches/records?filter=user%3D%22${tenant.user}%22&sort=-created&perPage=100`,
      );
      if (!res.ok) return [];
      return ((await res.json()) as { items?: Watch[] }).items ?? [];
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

  if (watchesLoading || postsLoading) return <PublicProfileSkeleton />;

  const initials = (tenant.display_name || tenant.subdomain || '?')
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();

  return (
    <div className='min-h-screen'>
      {/* Nav — mirrors the AppShell header */}
      <header className='fixed top-0 inset-x-0 z-50 h-14 flex items-center gap-3 px-5 border-b border-border bg-background/90 backdrop-blur-md'>
        <span className='font-serif font-bold text-foreground'>Hairspring</span>
        <span className='text-border'>·</span>
        <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
          {tenant.display_name || tenant.subdomain}
        </span>
      </header>

      <div className='max-w-3xl mx-auto px-5 pt-24 pb-16'>
        {/* Profile header */}
        <div className='flex items-center gap-4 mb-8 pb-7 border-b border-border'>
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
            <div className='flex items-center gap-2 mt-1.5'>
              <span className='font-mono text-[10px] text-muted-foreground'>
                {watches?.length ?? 0} project{watches?.length !== 1 ? 's' : ''}
              </span>
              <span className='text-border'>·</span>
              <span className='font-mono text-[10px] text-muted-foreground'>
                {posts?.length ?? 0} repair log{posts?.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Watch projects */}
        <div className='mb-3.5'>
          <SectionLabel>Watch Projects</SectionLabel>
        </div>

        {!watches?.length ? (
          <p className='text-sm text-muted-foreground'>No projects yet.</p>
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
          <span className='font-mono text-[10px] uppercase tracking-widest text-muted-foreground'>
            Powered by Hairspring
          </span>
        </div>
      </footer>
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
  return (
    <div className='bg-card border border-border rounded overflow-hidden'>
      {/* Watch header row */}
      <Link
        to='/watch/$watchId'
        params={{ watchId: w.id }}
        className='flex items-start justify-between gap-3 px-3.5 py-3 border-b border-border bg-muted/40 hover:bg-muted/60 transition-colors no-underline'
      >
        <div>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='font-serif font-semibold text-foreground text-sm'>
              {w.make} {w.model}
            </span>
            <StatusBadge status={w.status} />
          </div>
          {meta && (
            <span className='font-mono text-[10px] text-muted-foreground mt-0.5 block'>
              {meta}
            </span>
          )}
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

// ─── Landing page ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    symbol: '◈',
    title: 'Watch Projects',
    desc: 'Log every movement on your bench. Status, service history, reference details, and photos — all in one place.',
  },
  {
    symbol: '◷',
    title: 'Repair Logs',
    desc: 'Document each bench session with notes, time spent, and what you actually did. Build a searchable history of your work.',
  },
  {
    symbol: '⊡',
    title: 'Parts Inventory',
    desc: "Know what's in your drawers before you order more. Track stems, crystals, mainsprings, and anything else you keep in stock.",
  },
  {
    symbol: '⚙',
    title: 'Tool Log',
    desc: 'Catalogue your bench setup from your staking set to your movement holder. Know exactly what you have.',
  },
  {
    symbol: '◎',
    title: 'Public Profile',
    desc: 'Share your work with the community. Your own subdomain with your repair posts and watch portfolio.',
  },
  {
    symbol: '⊞',
    title: 'Bench Overview',
    desc: 'All your active projects, recent sessions, and low-stock parts at a glance. Your whole hobby in one dashboard.',
  },
] as const;

const STATS = [
  { value: '12+', label: 'watches tracked' },
  { value: '80+', label: 'parts catalogued' },
  { value: '40+', label: 'bench hours recorded' },
  { value: 'free', label: 'to start' },
] as const;

function LandingPage() {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      <style>{`
        @keyframes ms-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ms-ring-pulse {
          0%, 100% { opacity: 0.06; transform: scale(1); }
          50%       { opacity: 0.14; transform: scale(1.04); }
        }
        .ms-fade-up-1 { animation: ms-fade-up 0.6s ease both 0.05s; }
        .ms-fade-up-2 { animation: ms-fade-up 0.6s ease both 0.15s; }
        .ms-fade-up-3 { animation: ms-fade-up 0.6s ease both 0.25s; }
        .ms-fade-up-4 { animation: ms-fade-up 0.6s ease both 0.35s; }
        .ms-ring-a    { animation: ms-ring-pulse 6s ease-in-out infinite; }
        .ms-ring-b    { animation: ms-ring-pulse 6s ease-in-out infinite 2s; }
        .ms-ring-c    { animation: ms-ring-pulse 6s ease-in-out infinite 4s; }
      `}</style>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className='fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-md border-b border-border'>
        <div className='max-w-6xl mx-auto px-5 h-14 flex items-center justify-between'>
          <span className='font-serif text-lg font-bold text-primary tracking-tight'>
            Hairspring
          </span>
          <div className='flex items-center gap-3'>
            <Link
              to='/login'
              className='font-mono text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5'
            >
              Sign in
            </Link>
            <Link
              to='/signup'
              className='font-mono text-xs bg-primary text-primary-foreground font-semibold px-4 py-1.5 rounded hover:bg-primary/90 transition-colors'
            >
              Waitlist
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className='relative flex flex-col items-center justify-center text-center pt-40 pb-28 px-5 overflow-hidden'>
        {/* Decorative dial rings */}
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
          <div className='ms-ring-a absolute w-175 h-175 rounded-full border border-primary' />
          <div className='ms-ring-b absolute w-125 h-125 rounded-full border border-primary' />
          <div className='ms-ring-c absolute w-80 h-80 rounded-full border border-primary' />
        </div>
        {/* Radial fade overlay */}
        <div className='pointer-events-none absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-background/60 to-background' />

        <div className='relative z-10 max-w-3xl mx-auto'>
          <p className='ms-fade-up-1 font-mono text-xs uppercase tracking-[0.2em] text-primary mb-5'>
            For the hobbyist watchmaker
          </p>
          <h1 className='ms-fade-up-2 font-serif font-bold text-foreground leading-tight text-4xl sm:text-5xl lg:text-6xl mb-6'>
            Six watches in pieces.
            <br />
            <span className='text-primary'>Zero spreadsheets.</span>
          </h1>
          <p className='ms-fade-up-3 text-muted-foreground text-lg max-w-xl mx-auto mb-10 leading-relaxed'>
            Hairspring keeps track of every project on your bench — movement
            details, parts on hand, repair notes, and photos. Built for the
            people who actually love this stuff.
          </p>
          <div className='ms-fade-up-4 flex flex-col sm:flex-row items-center justify-center gap-3'>
            <Link
              to='/signup'
              className='font-mono text-sm bg-primary text-primary-foreground font-bold px-7 py-3 rounded hover:bg-primary/90 transition-colors w-full sm:w-auto text-center'
            >
              Join the waitlist →
            </Link>
            <Link
              to='/login'
              className='font-mono text-sm border border-border text-muted-foreground px-7 py-3 rounded hover:border-foreground/40 hover:text-foreground transition-colors w-full sm:w-auto text-center'
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div className='bg-card border-y border-border'>
        <div className='max-w-6xl mx-auto px-5 py-5 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-border'>
          {STATS.map((s) => (
            <div key={s.label} className='flex flex-col items-center sm:px-8'>
              <span className='font-mono text-2xl font-bold text-primary'>
                {s.value}
              </span>
              <span className='font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-1'>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className='max-w-6xl mx-auto px-5 py-20'>
        <div className='mb-12 text-center'>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3'>
            Everything you need
          </p>
          <h2 className='font-serif font-bold text-foreground text-3xl sm:text-4xl'>
            For the hobbyist who takes the craft seriously.
          </h2>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className='bg-card border border-border rounded-lg p-6 group hover:border-primary/30 transition-colors'
            >
              <div className='flex items-center gap-3 mb-3'>
                <span className='font-mono text-lg text-primary group-hover:scale-110 transition-transform inline-block'>
                  {f.symbol}
                </span>
                <span className='font-serif font-semibold text-foreground text-base'>
                  {f.title}
                </span>
              </div>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pitch quote ─────────────────────────────────────────────────── */}
      <div className='max-w-3xl mx-auto px-5 my-8'>
        <div className='bg-card border-l-2 border-primary pl-8 pr-8 py-8'>
          <p className='font-serif text-xl sm:text-2xl text-foreground leading-relaxed italic'>
            &ldquo;Built for people who&apos;d rather be at the bench than on a
            spreadsheet &mdash; and who have more movements in ziplock bags than
            they&apos;d like to admit.&rdquo;
          </p>
          <p className='font-mono text-xs text-muted-foreground mt-5 uppercase tracking-widest'>
            &mdash; Hairspring
          </p>
        </div>
      </div>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className='max-w-6xl mx-auto px-5 py-20'>
        <div className='mb-12 text-center'>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3'>
            Simple by design
          </p>
          <h2 className='font-serif font-bold text-foreground text-3xl sm:text-4xl'>
            Three steps to a cleaner bench.
          </h2>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto'>
          {[
            {
              n: '01',
              title: 'Add a project',
              desc: "Log the watch: make, model, movement, reference, and what you're trying to accomplish. Attach photos straight from your phone.",
            },
            {
              n: '02',
              title: 'Document the work',
              desc: 'Write up each bench session, record parts used, and photograph the movement as you go. Every job, searchable later.',
            },
            {
              n: '03',
              title: 'Build your archive',
              desc: 'Watch your repair history grow. Refer back to old notes, track patterns across similar movements, and share your best work.',
            },
          ].map((step) => (
            <div key={step.n} className='flex flex-col gap-3'>
              <span className='font-mono text-4xl font-bold text-muted-foreground leading-none'>
                {step.n}
              </span>
              <div className='w-8 h-px bg-primary' />
              <h3 className='font-serif font-semibold text-foreground text-lg'>
                {step.title}
              </h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA block ───────────────────────────────────────────────────── */}
      <div className='px-5 my-8'>
        <div className='bg-card rounded-2xl p-10 sm:p-14 mx-auto max-w-2xl text-center border border-border'>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-primary mb-4'>
            Free to start
          </p>
          <h2 className='font-serif font-bold text-foreground text-3xl sm:text-4xl mb-3'>
            Ready to bring order to the bench?
          </h2>
          <p className='text-muted-foreground text-base mb-8'>
            Free to use. No credit card required.
          </p>
          <Link
            to='/signup'
            className='inline-block font-mono text-sm bg-primary text-primary-foreground font-bold px-10 py-3.5 rounded hover:bg-primary/90 transition-colors'
          >
            Join the waitlist →
          </Link>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className='max-w-6xl mx-auto px-5 py-10 mt-8 border-t border-border'>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-3'>
          <div className='flex items-center gap-4'>
            <span className='font-serif font-bold text-muted-foreground text-sm'>
              Hairspring
            </span>
            <span className='font-mono text-xs text-muted-foreground'>
              &copy; {new Date().getFullYear()} · Built for bench hobbyists.
            </span>
          </div>
          <div className='flex items-center gap-5'>
            <Link
              to='/login'
              className='font-mono text-xs text-muted-foreground hover:text-foreground transition-colors'
            >
              Sign in
            </Link>
            <Link
              to='/signup'
              className='font-mono text-xs text-muted-foreground hover:text-foreground transition-colors'
            >
              Waitlist
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
