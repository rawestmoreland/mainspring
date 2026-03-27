import { Link, useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { cn, fmt, profit } from '#/lib/helpers';
import { GOAL, GOAL_LABEL, NAV_PAGES } from '#/lib/constants';
import { useWatches } from '#/hooks/watches';
import { useLogin, useLogout, useUser } from '#/hooks/user';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Field, FieldError, FieldGroup } from '../ui/field';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

const PAGE_SUBTITLES: Record<string, string> = {
  '/': 'PROFIT & LOSS OVERVIEW',
  '/watches': 'ALL WATCH RECORDS',
  '/inventory': 'SPARE PARTS STOCK',
  '/equipment': 'TOOLS & CAPITAL EXPENDITURE',
};

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

type LoginType = z.infer<typeof loginSchema>;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: watches, isLoading: isWatchesLoading } = useWatches();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: user, isLoading: isUserLoading } = useUser();
  const { mutateAsync: loginMutation, isPending: loginPending } = useLogin();
  const { mutateAsync: logoutMutation } = useLogout();

  const loginForm = useForm<LoginType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginType) => {
    await loginMutation(data);
  };

  if (isWatchesLoading || !watches || isUserLoading) {
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
        {!user ? (
          <div className='px-6 pb-7'>
            <Dialog>
              <form id='login-form' onSubmit={loginForm.handleSubmit(onSubmit)}>
                <DialogTrigger asChild>
                  <Button disabled={loginPending}>🔒</Button>
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
                    <Field>
                      <Button type='submit' form='login-form'>
                        Login
                      </Button>
                    </Field>
                  </DialogFooter>
                </DialogContent>
              </form>
            </Dialog>
          </div>
        ) : (
          <div className='px-6 pb-7'>
            <Button variant='outline' onClick={() => logoutMutation()}>
              Logout
            </Button>
          </div>
        )}

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
