import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from '#/components/primitives/StatusBadge';
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

  const { data: watches } = useQuery<Watch[]>({
    queryKey: ['public', 'watches', tenant.user],
    queryFn: async () => {
      const res = await fetch(
        `${pbUrl}/api/collections/watches/records?filter=user%3D%22${tenant.user}%22&sort=-created&perPage=100`,
      );
      if (!res.ok) return [];
      return ((await res.json()) as { items?: Watch[] }).items ?? [];
    },
  });

  const { data: posts } = useQuery<RepairPost[]>({
    queryKey: ['public', 'posts', tenant.user],
    queryFn: async () => {
      const res = await fetch(
        `${pbUrl}/api/collections/repair_posts/records?filter=user%3D%22${tenant.user}%22&sort=-session_date&perPage=50`,
      );
      if (!res.ok) return [];
      return ((await res.json()) as { items?: RepairPost[] }).items ?? [];
    },
  });

  return (
    <div className='space-y-10'>
      <section>
        <h2 className='font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4'>
          Watch Projects
        </h2>
        {watches?.length ? (
          <div className='grid gap-3 sm:grid-cols-2'>
            {watches.map((w) => (
              <div
                key={w.id}
                className='bg-card border border-border rounded-md px-4 py-3'
              >
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-medium text-sm text-foreground'>
                    {w.make} {w.model}
                  </span>
                  <StatusBadge status={w.status} />
                </div>
                {w.reference && (
                  <span className='font-mono text-[11px] text-muted-foreground'>
                    {w.reference}
                    {w.year ? ` · ${w.year}` : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>No projects yet.</p>
        )}
      </section>

      <section>
        <h2 className='font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4'>
          Repair Posts
        </h2>
        {posts?.length ? (
          <div className='space-y-3'>
            {posts.map((p) => (
              <div
                key={p.id}
                className='bg-card border border-border rounded-md px-4 py-3'
              >
                <div className='font-medium text-sm text-foreground'>
                  {p.title}
                </div>
                {p.session_date && (
                  <div className='font-mono text-[11px] text-muted-foreground mt-0.5'>
                    {new Date(p.session_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>No posts yet.</p>
        )}
      </section>
    </div>
  );
}

// ─── Landing page ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    symbol: '◈',
    title: 'Flip Ledger',
    desc: 'Log every watch: purchase price, parts cost, and sale price. Your P&L is always one click away.',
  },
  {
    symbol: '◷',
    title: 'Bench Time Tracker',
    desc: 'Log hours per project. See exactly what your labor is worth — and whether the flip was actually worth your time.',
  },
  {
    symbol: '⊡',
    title: 'Parts Inventory',
    desc: 'Track spare parts stock, quantities, and unit costs. Stop over-buying crystals and crowns you already have.',
  },
  {
    symbol: '⚙',
    title: 'Equipment Log',
    desc: 'Amortize your tool investment against your earnings. Know your real cost basis, down to the demagnetizer.',
  },
  {
    symbol: '◎',
    title: 'Public Profile',
    desc: 'Share your repair posts and watch portfolio publicly. Your own subdomain, your own corner of the watch internet.',
  },
  {
    symbol: '⊞',
    title: 'ROI Dashboard',
    desc: 'Total profit, average ROI, capital deployed, hours spent — the full picture of your operation at a glance.',
  },
] as const;

const STATS = [
  { value: '147+', label: 'watches tracked' },
  { value: '23%', label: 'avg. ROI logged' },
  { value: '4,200+', label: 'bench hours recorded' },
  { value: 'free', label: 'to start' },
] as const;

function LandingPage() {
  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-100'>
      <style>{`
        @keyframes ms-fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ms-ring-pulse {
          0%, 100% { opacity: 0.04; transform: scale(1); }
          50%       { opacity: 0.08; transform: scale(1.04); }
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
      <nav className='fixed top-0 inset-x-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800'>
        <div className='max-w-6xl mx-auto px-5 h-14 flex items-center justify-between'>
          <span className='font-serif text-lg font-bold text-amber-400 tracking-tight'>
            Hairspring
          </span>
          <div className='flex items-center gap-3'>
            <Link
              to='/login'
              className='font-mono text-xs text-zinc-400 hover:text-zinc-100 transition-colors px-3 py-1.5'
            >
              Sign in
            </Link>
            <Link
              to='/signup'
              className='font-mono text-xs bg-amber-400 text-zinc-950 font-semibold px-4 py-1.5 rounded hover:bg-amber-300 transition-colors'
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className='relative flex flex-col items-center justify-center text-center pt-40 pb-28 px-5 overflow-hidden'>
        {/* Decorative dial rings */}
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
          <div className='ms-ring-a absolute w-175 h-175 rounded-full border border-amber-400' />
          <div className='ms-ring-b absolute w-125 h-125 rounded-full border border-amber-400' />
          <div className='ms-ring-c absolute w-80 h-80 rounded-full border border-amber-400' />
        </div>
        {/* Radial fade overlay */}
        <div className='pointer-events-none absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-zinc-950/60 to-zinc-950' />

        <div className='relative z-10 max-w-3xl mx-auto'>
          <p className='ms-fade-up-1 font-mono text-xs uppercase tracking-[0.2em] text-amber-400 mb-5'>
            The watch flipper&apos;s ledger
          </p>
          <h1 className='ms-fade-up-2 font-serif font-bold text-white leading-tight text-4xl sm:text-5xl lg:text-6xl mb-6'>
            Know exactly what your
            <br />
            <span className='text-amber-400'>bench time</span> is worth.
          </h1>
          <p className='ms-fade-up-3 text-zinc-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed'>
            Hairspring tracks every dollar and every hour across your watch
            projects — from acquisition to sale. Finally, a ledger built for
            people who flip watches, not spreadsheets.
          </p>
          <div className='ms-fade-up-4 flex flex-col sm:flex-row items-center justify-center gap-3'>
            <Link
              to='/signup'
              className='font-mono text-sm bg-amber-400 text-zinc-950 font-bold px-7 py-3 rounded hover:bg-amber-300 transition-colors w-full sm:w-auto text-center'
            >
              Start tracking free →
            </Link>
            <Link
              to='/login'
              className='font-mono text-sm border border-zinc-700 text-zinc-300 px-7 py-3 rounded hover:border-zinc-500 hover:text-zinc-100 transition-colors w-full sm:w-auto text-center'
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div className='bg-zinc-900 border-y border-zinc-800'>
        <div className='max-w-6xl mx-auto px-5 py-5 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-0 sm:divide-x sm:divide-zinc-800'>
          {STATS.map((s) => (
            <div key={s.label} className='flex flex-col items-center sm:px-8'>
              <span className='font-mono text-2xl font-bold text-amber-400'>
                {s.value}
              </span>
              <span className='font-mono text-[11px] uppercase tracking-widest text-zinc-400 mt-1'>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className='max-w-6xl mx-auto px-5 py-20'>
        <div className='mb-12 text-center'>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3'>
            Everything you need
          </p>
          <h2 className='font-serif font-bold text-white text-3xl sm:text-4xl'>
            Built for the bench, not the boardroom.
          </h2>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className='bg-zinc-900 border border-zinc-800 rounded-lg p-6 group hover:border-zinc-700 transition-colors'
            >
              <div className='flex items-center gap-3 mb-3'>
                <span className='font-mono text-lg text-amber-400 group-hover:scale-110 transition-transform inline-block'>
                  {f.symbol}
                </span>
                <span className='font-serif font-semibold text-white text-base'>
                  {f.title}
                </span>
              </div>
              <p className='text-zinc-400 text-sm leading-relaxed'>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pitch quote ─────────────────────────────────────────────────── */}
      <div className='max-w-3xl mx-auto px-5 my-8'>
        <div className='bg-zinc-900 border-l-2 border-amber-400 pl-8 pr-8 py-8'>
          <p className='font-serif text-xl sm:text-2xl text-zinc-100 leading-relaxed italic'>
            &ldquo;Built for people who love watches and want to treat the hobby
            like a business &mdash; without the spreadsheet hell.&rdquo;
          </p>
          <p className='font-mono text-xs text-zinc-400 mt-5 uppercase tracking-widest'>
            &mdash; Hairspring
          </p>
        </div>
      </div>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className='max-w-6xl mx-auto px-5 py-20'>
        <div className='mb-12 text-center'>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 mb-3'>
            Simple by design
          </p>
          <h2 className='font-serif font-bold text-white text-3xl sm:text-4xl'>
            From acquisition to exit in three steps.
          </h2>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto'>
          {[
            {
              n: '01',
              title: 'Log the buy',
              desc: 'Add a watch with purchase price, reference, and year. Attach photos straight from your phone.',
            },
            {
              n: '02',
              title: 'Track the work',
              desc: 'Record bench hours, parts used, and repair notes as you go. Every dollar and minute accounted for.',
            },
            {
              n: '03',
              title: 'Close the flip',
              desc: 'Mark it sold. Hairspring instantly shows you net profit, ROI, and your effective hourly rate.',
            },
          ].map((step) => (
            <div key={step.n} className='flex flex-col gap-3'>
              <span className='font-mono text-4xl font-bold text-zinc-600 leading-none'>
                {step.n}
              </span>
              <div className='w-8 h-px bg-amber-400' />
              <h3 className='font-serif font-semibold text-white text-lg'>
                {step.title}
              </h3>
              <p className='text-zinc-400 text-sm leading-relaxed'>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA block ───────────────────────────────────────────────────── */}
      <div className='px-5 my-8'>
        <div className='bg-zinc-900 rounded-2xl p-10 sm:p-14 mx-auto max-w-2xl text-center border border-zinc-800'>
          <p className='font-mono text-xs uppercase tracking-[0.2em] text-amber-400 mb-4'>
            Get started today
          </p>
          <h2 className='font-serif font-bold text-white text-3xl sm:text-4xl mb-3'>
            Ready to track your first flip?
          </h2>
          <p className='text-zinc-400 text-base mb-8'>
            Free to use. No credit card required.
          </p>
          <Link
            to='/signup'
            className='inline-block font-mono text-sm bg-amber-400 text-zinc-950 font-bold px-10 py-3.5 rounded hover:bg-amber-300 transition-colors'
          >
            Create your account →
          </Link>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className='max-w-6xl mx-auto px-5 py-10 mt-8 border-t border-zinc-900'>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-3'>
          <div className='flex items-center gap-4'>
            <span className='font-serif font-bold text-zinc-400 text-sm'>
              Hairspring
            </span>
            <span className='font-mono text-xs text-zinc-500'>
              &copy; {new Date().getFullYear()} · Built for watch people.
            </span>
          </div>
          <div className='flex items-center gap-5'>
            <Link
              to='/login'
              className='font-mono text-xs text-zinc-400 hover:text-zinc-200 transition-colors'
            >
              Sign in
            </Link>
            <Link
              to='/signup'
              className='font-mono text-xs text-zinc-400 hover:text-zinc-200 transition-colors'
            >
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
