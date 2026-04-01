import { HeadContent, Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { AppShell } from '#/components/layout/AppShell';
import { WatchesProvider } from '#/context/watches';
import '../styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '#/components/ui/tooltip';

export const Route = createRootRoute({ component: RootComponent });

const queryClient = new QueryClient();

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WatchesProvider>
          <AppShell>
            <HeadContent />
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
  );
}
