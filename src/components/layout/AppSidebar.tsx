import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '#/lib/helpers';
import { NAV_PAGES } from '#/lib/constants';
import { useUser, useLogout } from '#/hooks/user';
import { Button } from '#/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '#/components/ui/sidebar';

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isMobile, setOpenMobile } = useSidebar();

  const { data: user } = useUser();
  const { mutateAsync: logoutMutation } = useLogout();

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '??';

  return (
    <Sidebar variant='inset'>
      {/* Logo */}
      <SidebarHeader className='px-4 py-5 border-b border-sidebar-border'>
        <h1 className='font-serif text-lg font-bold text-primary leading-tight'>
          Mainspring
        </h1>
        <p className='font-mono text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5'>
          Watch Flip Tracker
        </p>
      </SidebarHeader>

      {/* Primary nav */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className='font-mono text-[10px] tracking-widest uppercase'>
            Navigation
          </SidebarGroupLabel>
          <SidebarMenu>
            {NAV_PAGES.map((p) => {
              const isActive = pathname === p.path;
              return (
                <SidebarMenuItem key={p.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={cn(
                      'gap-2.5 text-[13px]',
                      isActive
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground',
                    )}
                  >
                    <Link
                      to={p.path}
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <span className='text-[15px] opacity-80'>{p.icon}</span>
                      {p.label}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: user identity + auth actions */}
      <SidebarFooter className='gap-2 px-4 py-4 border-t border-sidebar-border'>
        {user ? (
          <>
            <div className='flex items-center gap-2.5 min-w-0'>
              <div className='shrink-0 w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-mono text-[10px] font-semibold text-primary'>
                {initials}
              </div>
              <span className='font-mono text-xs text-muted-foreground truncate'>
                {user.email}
              </span>
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                className='flex-1 text-xs'
                asChild
              >
                <Link to='/settings/profile'>Settings</Link>
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='text-xs'
                onClick={() => logoutMutation()}
              >
                Logout
              </Button>
            </div>
          </>
        ) : (
          <Button variant='outline' size='sm' className='w-full' asChild>
            <Link to='/login'>Login</Link>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
