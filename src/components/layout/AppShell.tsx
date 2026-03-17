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
    <div className='flex min-h-screen bg-zinc-950 text-zinc-100'>
      {/* ── Sidebar ── */}
      <aside className='w-[220px] shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col py-7 sticky top-0 h-screen'>
        {/* Logo */}
        <div className='px-6 pb-7 border-b border-zinc-800 mb-5'>
          <h1 className='font-serif text-lg font-bold text-amber-500 leading-tight'>
            Mainspring
          </h1>
          <p className='font-mono text-[10px] text-zinc-500 tracking-widest uppercase mt-1'>
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
                    ? 'text-amber-400 border-l-amber-500 bg-amber-500/10 font-medium'
                    : 'text-zinc-500 border-l-transparent hover:text-zinc-200 hover:bg-white/3',
                )}
              >
                <span className='text-[15px] opacity-80'>{p.icon}</span>
                {p.label}
              </Link>
            );
          })}
        </nav>

        {/* Goal card */}
        <div className='px-5 pt-5 border-t border-zinc-800'>
          <div className='bg-amber-500/10 border border-amber-700/40 rounded-md p-3'>
            <div className='font-mono text-[9px] uppercase tracking-widest text-amber-700 mb-1.5'>
              Next Watch Goal
            </div>
            <div className='font-serif text-sm font-semibold text-amber-400'>
              {GOAL_LABEL}
            </div>
            <div className='mt-2 bg-zinc-800 rounded-full h-1 overflow-hidden'>
              <div
                className='h-full bg-amber-500 rounded-full transition-all'
                style={{ width: `${goalPct}%` }}
              />
            </div>
            <div className='font-mono text-[10px] text-zinc-500 mt-1.5'>
              {fmt(totalProfit)} / {fmt(GOAL)} · {goalPct}%
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className='flex-1 overflow-y-auto min-w-0'>
        {/* Page header */}
        <div className='flex items-end justify-between px-9 pt-8 pb-5 border-b border-zinc-800'>
          <div>
            <h2 className='font-serif text-2xl font-bold text-zinc-100'>
              {currentPage?.label ?? 'Mainspring'}
            </h2>
            <p className='font-mono text-[11px] text-zinc-500 tracking-widest mt-1'>
              {subtitle}
            </p>
          </div>
          {(pathname === '/' || pathname === '/watches') && (
            <button className='rounded font-semibold tracking-wide transition-opacity hover:opacity-80 cursor-pointer bg-amber-600 text-zinc-950 px-4 py-2 text-xs'>
              + Add Watch
            </button>
          )}
        </div>

        {/* Page content */}
        <div className='px-9 py-7'>{children}</div>
      </main>
    </div>
  );
}
