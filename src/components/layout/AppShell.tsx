import { useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { NAV_PAGES } from '#/lib/constants';
import { AppSidebar } from './AppSidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '#/components/ui/breadcrumb';
import { Separator } from '#/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '#/components/ui/sidebar';
import { useSubscription } from '#/hooks/subscription';

const PAGE_SUBTITLES: Record<string, string> = {
  '/dashboard': 'PROFIT & LOSS OVERVIEW',
  '/watches': 'ALL WATCH RECORDS',
  '/inventory': 'SPARE PARTS STOCK',
  '/equipment': 'TOOLS & CAPITAL EXPENDITURE',
  '/settings/profile': 'YOUR PUBLIC PROFILE',
  '/pro': 'UPGRADE YOUR PLAN',
  '/wishlist': 'ACQUISITION TARGETS',
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isPro } = useSubscription();
  const currentPage = NAV_PAGES.find((p) => p.path === pathname);
  const subtitle =
    PAGE_SUBTITLES[pathname] ??
    (pathname.endsWith('/timegrapher')
      ? 'TIMEGRAPHER LOG'
      : pathname.endsWith('/shopping-list')
        ? 'PARTS SHOPPING LIST'
        : '');

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className='flex justify-between border-border px-4 border-b items-center'>
          <div className='flex h-14 shrink-0 items-center gap-2'>
            <SidebarTrigger className='-ml-1' />
            <Separator
              orientation='vertical'
              className='mr-2 self-center! data-[orientation=vertical]:h-4'
            />
            <Breadcrumb>
              <BreadcrumbList className='flex items-baseline'>
                <BreadcrumbItem>
                  <BreadcrumbPage className='font-serif font-semibold text-foreground'>
                    {currentPage?.label ?? 'Hairspring'}
                  </BreadcrumbPage>
                </BreadcrumbItem>
                {subtitle && (
                  <BreadcrumbItem>
                    <span className='font-mono text-[10px] text-muted-foreground tracking-widest ml-2'>
                      {subtitle}
                    </span>
                  </BreadcrumbItem>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          {isPro && (
            <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] tracking-widest border border-amber-500/40 bg-amber-500/10 text-amber-400 uppercase shadow-[0_0_8px_rgba(245,158,11,0.15)]'>
              <svg
                width='8'
                height='8'
                viewBox='0 0 8 8'
                fill='currentColor'
                className='shrink-0'
              >
                <path d='M4 0L5.2 2.8L8 3.1L6 5.1L6.5 8L4 6.6L1.5 8L2 5.1L0 3.1L2.8 2.8Z' />
              </svg>
              Pro
            </span>
          )}
        </header>
        <div className='flex flex-1 flex-col px-4 py-5 md:px-9 md:py-7'>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
