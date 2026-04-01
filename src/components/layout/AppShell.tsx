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

const PAGE_SUBTITLES: Record<string, string> = {
  '/': 'PROFIT & LOSS OVERVIEW',
  '/watches': 'ALL WATCH RECORDS',
  '/inventory': 'SPARE PARTS STOCK',
  '/equipment': 'TOOLS & CAPITAL EXPENDITURE',
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const currentPage = NAV_PAGES.find((p) => p.path === pathname);
  const subtitle = PAGE_SUBTITLES[pathname] ?? '';

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className='flex h-14 shrink-0 items-center gap-2 border-b border-border px-4'>
          <SidebarTrigger className='-ml-1' />
          <Separator
            orientation='vertical'
            className='mr-2 !self-center data-[orientation=vertical]:h-4'
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className='font-serif font-semibold text-foreground'>
                  {currentPage?.label ?? 'Mainspring'}
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
        </header>
        <div className='flex flex-1 flex-col px-4 py-5 md:px-9 md:py-7'>{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
