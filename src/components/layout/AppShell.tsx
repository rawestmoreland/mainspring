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
import { ImpersonationBanner } from './ImpersonationBanner';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from 'react-i18next';
import type { ParseKeys } from 'i18next';

const PAGE_SUBTITLE_KEYS: Record<string, ParseKeys> = {
  '/dashboard': 'subtitleDashboard',
  '/watches': 'subtitleWatches',
  '/inventory': 'subtitleInventory',
  '/equipment': 'subtitleEquipment',
  '/settings/profile': 'subtitleProfile',
  '/pro': 'subtitlePro',
  '/wishlist': 'subtitleWishlist',
};

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isPro } = useSubscription();
  const currentPage = NAV_PAGES.find((p) => p.path === pathname);
  const subtitleKey =
    PAGE_SUBTITLE_KEYS[pathname] ??
    (pathname.endsWith('/timegrapher')
      ? 'subtitleTimegrapher'
      : pathname.endsWith('/shopping-list')
        ? 'subtitleShoppingList'
        : pathname.endsWith('/time')
          ? 'subtitleTimeTracker'
          : '');
  const subtitle = subtitleKey ? t(subtitleKey) : '';

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <ImpersonationBanner />
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
                  {/* eslint-disable-next-line i18next/no-literal-string */}
                  <BreadcrumbPage className='font-serif font-semibold text-foreground'>{t(currentPage?.label as ParseKeys) ?? 'Hairspring'}</BreadcrumbPage>
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
          <div className='flex items-center gap-3'>
            <LanguageSelector />
            {/* eslint-disable-next-line i18next/no-literal-string */}
            {isPro && (<span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] tracking-widest border border-amber-500/40 bg-amber-500/10 text-[#6d4512] uppercase shadow-[0_0_8px_rgba(245,158,11,0.15)]'><svg width='8' height='8' viewBox='0 0 8 8' fill='currentColor' className='shrink-0'><path d='M4 0L5.2 2.8L8 3.1L6 5.1L6.5 8L4 6.6L1.5 8L2 5.1L0 3.1L2.8 2.8Z' /></svg>Pro</span>)}
          </div>
        </header>
        <div className='flex flex-1 flex-col px-4 py-5 md:px-9 md:py-7'>
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
