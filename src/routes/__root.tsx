import { useEffect, type ReactNode } from 'react';
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  redirect,
  useRouterState,
} from '@tanstack/react-router';
import { createIsomorphicFn } from '@tanstack/react-start';
import { PostHogProvider } from '@posthog/react';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '#/components/layout/AppShell';
import { NotFoundPage } from '#/components/NotFoundPage';
import { TooltipProvider } from '#/components/ui/tooltip';
import { GoogleAnalytics } from 'tanstack-router-ga4';
import { resolveTenant } from '#/middleware/tenant';
import type { UserProfile } from '#/types';
import '../styles.css';
import { Toaster } from 'sonner';
import dmMonoUrl from '@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2?url';
import playfairUrl from '@fontsource/playfair-display/files/playfair-display-latin-600-normal.woff2?url';
import loraUrl from '@fontsource/lora/files/lora-latin-400-normal.woff2?url';

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
  }
}

type RouterContext = { queryClient: QueryClient };

const PUBLIC_PATHS = new Set([
  '/',
  '/login',
  '/signup',
  '/privacy-policy',
  '/terms-of-service',
]);

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.has(pathname) ||
    pathname.startsWith('/watch/') ||
    pathname.startsWith('/post/')
  );
}

function isSubdomainPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/watch/') ||
    pathname.startsWith('/post/')
  );
}

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

    // On a public subdomain, only allow subdomain-specific paths.
    // Return a flag rather than throw so RootComponent retains tenant context
    // and can render a shell-free 404 without the AppShell wrapping it.
    if (tenant !== null && !isSubdomainPath(location.pathname)) {
      return { tenant, subdomainNotFound: true };
    }

    // Client-side auth guard: only enforce on the main domain (no tenant).
    // Public subdomain routes are accessible without authentication.
    if (typeof window !== 'undefined' && tenant === null) {
      const pb = (await import('#/lib/pocketbase')).default;
      if (!isPublicPath(location.pathname) && !pb.authStore.isValid) {
        throw redirect({ to: '/login', search: { from: location.pathname } });
      }
    }

    return { tenant, subdomainNotFound: false };
  },
  notFoundComponent: NotFoundPage,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Hairspring' },
    ],
    links: [
      {
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href: dmMonoUrl,
        crossOrigin: 'anonymous',
      },
      {
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href: playfairUrl,
        crossOrigin: 'anonymous',
      },
      {
        rel: 'preload',
        as: 'font',
        type: 'font/woff2',
        href: loraUrl,
        crossOrigin: 'anonymous',
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { queryClient, tenant, subdomainNotFound } =
    Route.useRouteContext() as {
      queryClient: QueryClient;
      tenant: UserProfile | null;
      subdomainNotFound: boolean;
    };
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPublicRoute = isPublicPath(pathname);

  if (subdomainNotFound) {
    return (
      <RootDocument>
        <NotFoundPage />
      </RootDocument>
    );
  }

  if (tenant) {
    // Public subdomain: render without sidebar/auth shell.
    // PublicProfile owns its own layout entirely.
    return (
      <RootDocument>
        <QueryClientProvider client={queryClient}>
          <Outlet />
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
          <AppShell>
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
        </TooltipProvider>
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  const gaId =
    import.meta.env.VITE_PUBLIC_GA4_MEASUREMENT_ID ||
    process.env.VITE_PUBLIC_GA4_MEASUREMENT_ID;
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.createLemonSqueezy?.();
    }
  }, []);
  return (
    <html lang='en' className='light'>
      <head>
        <HeadContent />
      </head>
      <body>
        <PostHogProvider
          apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN!}
          options={{
            api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
            defaults: '2025-05-24',
            capture_exceptions: true,
            debug: import.meta.env.DEV,
          }}
        >
          {children}
        </PostHogProvider>
        <Toaster />
        {gaId && <GoogleAnalytics measurementId={gaId} />}
        <script src='https://app.lemonsqueezy.com/js/lemon.js' defer></script>
        <Scripts />
      </body>
    </html>
  );
}
