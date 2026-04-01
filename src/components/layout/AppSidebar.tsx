import { useState, useRef, useCallback } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { cn, fmt, profit } from '#/lib/helpers';
import { GOAL, GOAL_LABEL, NAV_PAGES } from '#/lib/constants';
import { useWatches } from '#/hooks/watches';
import { useLogin, useLogout, useUser } from '#/hooks/user';
import { Button } from '#/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog';
import { Field, FieldError, FieldGroup } from '#/components/ui/field';
import { Label } from '#/components/ui/label';
import { Input } from '#/components/ui/input';
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
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

type LoginType = z.infer<typeof loginSchema>;

export function AppSidebar() {
  const { data: watches } = useWatches();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isMobile, setOpenMobile } = useSidebar();

  const { data: user } = useUser();
  const { mutateAsync: loginMutation, isPending: loginPending } = useLogin();
  const { mutateAsync: logoutMutation } = useLogout();

  const loginForm = useForm<LoginType>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginType) => {
    await loginMutation(data);
  };

  const goalClickCount = useRef(0);
  const [unlocked, setUnlocked] = useState(false);

  const handleGoalClick = useCallback(() => {
    if (unlocked) return;
    goalClickCount.current += 1;
    if (goalClickCount.current >= 5) setUnlocked(true);
  }, [unlocked]);

  const sold = (watches ?? []).filter((w) => w.status === 'sold');
  const totalProfit = sold.reduce((s, w) => s + (profit(w) ?? 0), 0);
  const goalPct = Math.min(100, (totalProfit / GOAL) * 100).toFixed(1);

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

      {/* Footer: goal card + auth */}
      <SidebarFooter className='gap-3 px-4 py-4 border-t border-sidebar-border'>
        {/* Goal card — click 5× to unlock login */}
        <div
          className='bg-primary/10 border border-primary/25 rounded-md p-3 select-none cursor-default'
          onClick={handleGoalClick}
        >
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

        {/* Auth */}
        {user ? (
          <Button
            variant='outline'
            size='sm'
            className='w-full'
            onClick={() => logoutMutation()}
          >
            Logout
          </Button>
        ) : unlocked ? (
          <Dialog>
            <form id='login-form' onSubmit={loginForm.handleSubmit(onSubmit)}>
              <DialogTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full'
                  disabled={loginPending}
                >
                  🔒 Login
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Login</DialogTitle>
                  <DialogDescription>
                    Login to your account to continue.
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Controller
                    name='email'
                    control={loginForm.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <Label htmlFor='email'>Email</Label>
                        <Input
                          id='email'
                          {...field}
                          aria-invalid={fieldState.invalid}
                          placeholder='Enter your email'
                          autoComplete='off'
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name='password'
                    control={loginForm.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <Label htmlFor='password'>Password</Label>
                        <Input
                          id='password'
                          {...field}
                          type='password'
                          aria-invalid={fieldState.invalid}
                          placeholder='Enter your password'
                          autoComplete='off'
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant='outline' disabled={loginPending}>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type='submit' form='login-form'>
                    Login
                  </Button>
                </DialogFooter>
              </DialogContent>
            </form>
          </Dialog>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
