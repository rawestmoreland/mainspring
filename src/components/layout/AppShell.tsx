import { Link, useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { cn, fmt, profit } from '#/lib/helpers';
import { GOAL, GOAL_LABEL, NAV_PAGES } from '#/lib/constants';
import { useWatches } from '#/hooks/watches';

const PAGE_SUBTITLES: Record<string, string> = {
  '/': 'PROFIT & LOSS OVERVIEW',
  '/watches': 'ALL WATCH RECORDS',
  '/inventory': 'SPARE PARTS STOCK',
  '/equipment': 'TOOLS & CAPITAL EXPENDITURE',
};

export function AppShell({ children }: { children: ReactNode }) {
  const { data: watches, isLoading: isWatchesLoading } = useWatches();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (isWatchesLoading || !watches) {
    return null;
  }

  const sold = watches.filter((w) => w.status === 'sold');
  const totalProfit = sold.reduce((s, w) => s + (profit(w) ?? 0), 0);
  const goalPct = Math.min(100, (totalProfit / GOAL) * 100).toFixed(1);

  const currentPage = NAV_PAGES.find((p) => p.path === pathname);
  const subtitle = PAGE_SUBTITLES[pathname] ?? '';

  return (
    <div className='flex min-h-screen bg-background text-foreground'>
      {/* ── Sidebar ── */}
      <aside className='w-[220px] shrink-0 bg-card border-r border-border flex flex-col py-7 sticky top-0 h-screen'>
        {/* Logo */}
        <div className='px-6 pb-7 border-b border-border mb-5'>
          <h1 className='font-serif text-lg font-bold text-primary leading-tight'>
            Mainspring
          </h1>
          <p className='font-mono text-[10px] text-muted-foreground tracking-widest uppercase mt-1'>
            Watch Flip Tracker
          </p>
        </div>

        {/* Nav */}
        <nav className='flex-1'>
          {NAV_PAGES.map((p) => {
            const isActive = pathname === p.path;
            return (
              <Link
                key={p.id}
                to={p.path}
                className={cn(
                  'w-full flex items-center gap-2.5 px-6 py-2.5 text-[13px] border-l-2 transition-all',
                  isActive
                    ? 'text-primary border-l-primary bg-primary/10 font-medium'
                    : 'text-muted-foreground border-l-transparent hover:text-foreground hover:bg-muted/60',
                )}
              >
                <span className='text-[15px] opacity-80'>{p.icon}</span>
                {p.label}
              </Link>
            );
          })}
        </nav>

        {/* Goal card */}
        <div className='px-5 pt-5 border-t border-border'>
          <div className='bg-primary/10 border border-primary/25 rounded-md p-3'>
            <div className='font-mono text-[9px] uppercase tracking-widest text-primary/90 mb-1.5'>
              Next Watch Goal
            </div>
            <div className='font-serif text-sm font-semibold text-primary'>
              {GOAL_LABEL}
            </div>
            <div className='mt-2 bg-muted rounded-full h-1 overflow-hidden'>
              <div
                className='h-full bg-primary rounded-full transition-all'
                style={{ width: `${goalPct}%` }}
              />
            </div>
            <div className='font-mono text-[10px] text-muted-foreground mt-1.5'>
              {fmt(totalProfit)} / {fmt(GOAL)} · {goalPct}%
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className='flex-1 overflow-y-auto min-w-0'>
        {/* Page header */}
        <div className='flex items-end justify-between px-9 pt-8 pb-5 border-b border-border'>
          <div>
            <h2 className='font-serif text-2xl font-bold text-foreground'>
              {currentPage?.label ?? 'Mainspring'}
            </h2>
            <p className='font-mono text-[11px] text-muted-foreground tracking-widest mt-1'>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Page content */}
        <div className='px-9 py-7'>{children}</div>
      </main>
    </div>
  );
}
