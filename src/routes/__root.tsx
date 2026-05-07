import type { ReactNode } from 'react';
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  redirect,
  useRouterState,
} from '@tanstack/react-router';
import { createIsomorphicFn } from '@tanstack/react-start';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '#/components/layout/AppShell';
import { WatchesProvider } from '#/context/watches';
import { TooltipProvider } from '#/components/ui/tooltip';
import { GoogleAnalytics } from 'tanstack-router-ga4';
import { resolveTenant } from '#/middleware/tenant';
import type { UserProfile } from '#/types';
import '../styles.css';

type RouterContext = { queryClient: QueryClient };

const PUBLIC_PATHS = new Set(['/', '/login', '/signup']);

const getHost = createIsomorphicFn()
  .client(() => window.location.host)
  .server(async () => {
    const { getRequestHeader } = await import('@tanstack/react-start/server');
    return getRequestHeader('host') ?? '';
  });

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async ({ location }) => {
    const host = await getHost();
    let tenant: UserProfile | null = null;

    if (host) {
      tenant = await resolveTenant(host);
    }

    // Client-side auth guard: only enforce on the main domain (no tenant).
    // Public subdomain routes are accessible without authentication.
    if (typeof window !== 'undefined' && tenant === null) {
      const pb = (await import('#/lib/pocketbase')).default;
      if (!PUBLIC_PATHS.has(location.pathname) && !pb.authStore.isValid) {
        throw redirect({ to: '/login', search: { from: location.pathname } });
      }
    }

    return { tenant };
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Hairspring' },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { queryClient, tenant } = Route.useRouteContext() as {
    queryClient: QueryClient;
    tenant: UserProfile | null;
  };
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPublicRoute = PUBLIC_PATHS.has(pathname);

  if (tenant) {
    // Public subdomain: render without sidebar/auth shell
    return (
      <RootDocument>
        <QueryClientProvider client={queryClient}>
          <div className='min-h-screen bg-zinc-950'>
            <header className='border-b border-border px-6 py-5'>
              <h1 className='font-serif text-xl font-bold text-primary'>
                {tenant.display_name}
              </h1>
              {tenant.bio && (
                <p className='text-sm text-muted-foreground mt-1'>
                  {tenant.bio}
                </p>
              )}
            </header>
            <main className='px-6 py-7 max-w-4xl mx-auto'>
              <Outlet />
            </main>
          </div>
        </QueryClientProvider>
      </RootDocument>
    );
  }

  if (isPublicRoute) {
    return (
      <RootDocument>
        <QueryClientProvider client={queryClient}>
          <Outlet />
        </QueryClientProvider>
      </RootDocument>
    );
  }

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WatchesProvider>
            <AppShell>
              <GoogleAnalytics measurementId='G-7TWPVSWCR2' />
              <Outlet />
            </AppShell>
            <TanStackDevtools
              config={{ position: 'bottom-right' }}
              plugins={[
                {
                  name: 'TanStack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          </WatchesProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang='en' className='light'>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
