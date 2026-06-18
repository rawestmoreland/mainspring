import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import HSBrass from '#/lib/assets/hairspring-mark-brass.svg';
import { useAuth } from '#/hooks/auth';
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
import { useState } from 'react';
import { Input } from '../ui/input';
import { Field, FieldLabel } from '../ui/field';
import pb from '#/lib/pocketbase';
import { impersonateUser } from '#/server/impersonate';
import { markImpersonating } from '#/hooks/impersonation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ParseKeys } from 'i18next';

const impersonateSchema = z.object({
  targetUserId: z.string().min(1, 'User ID is required'),
});
type ImpersonateFormData = z.infer<typeof impersonateSchema>;

export function AppSidebar() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [impersonateOpen, setImpersonateOpen] = useState(false);
  const [impersonateError, setImpersonateError] = useState<string | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isMobile, setOpenMobile } = useSidebar();

  const navigate = useNavigate();
  const { data: user } = useUser();
  const { profile } = useAuth();
  const { mutateAsync: logoutMutation } = useLogout();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ImpersonateFormData>({
    resolver: zodResolver(impersonateSchema),
  });

  const onImpersonate = handleSubmit(async ({ targetUserId }) => {
    setImpersonateError(null);
    try {
      const result = await impersonateUser({
        data: { token: pb.authStore.token, targetUserId },
      });
      pb.authStore.save(result.token, result.record);
      markImpersonating();
      setImpersonateOpen(false);
      reset();
      navigate({ to: '/dashboard' });
      queryClient.refetchQueries();
    } catch (e) {
      setImpersonateError(
        e instanceof Error ? e.message : 'Impersonation failed',
      );
    }
  });

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : '??';

  return (
    <Sidebar variant='inset'>
      {/* Logo */}
      <SidebarHeader className='px-4 py-5 border-b border-sidebar-border'>
        <div className='flex space-x-2'>
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <img alt='Hairspring' src={HSBrass} className='size-6' />
          {/* eslint-disable-next-line i18next/no-literal-string */}
          <h1 className='font-serif text-lg font-bold text-foreground leading-tight'>Hairspring</h1>
        </div>
        <p className='font-mono text-[10px] text-muted-foreground tracking-widest uppercase mt-0.5'>
          {t('appSubtitle')}
        </p>
      </SidebarHeader>

      {/* Primary nav */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className='font-mono text-[10px] tracking-widest uppercase'>
            {t('navigation')}
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
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground',
                    )}
                  >
                    <Link
                      to={p.path}
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <span className='text-[15px] opacity-80'>{p.icon}</span>
                      {t(p.label as ParseKeys)}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
            {profile?.is_admin && (
              <SidebarMenuItem>
                <Dialog
                  open={impersonateOpen}
                  onOpenChange={setImpersonateOpen}
                >
                  <DialogTrigger asChild>
                    <SidebarMenuButton
                      className={cn(
                        'gap-2.5 text-[13px] text-muted-foreground',
                      )}
                    >
                      {t('sidebarImpersonate')}
                    </SidebarMenuButton>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={onImpersonate}>
                      <DialogHeader>
                        <DialogTitle>{t('sidebarImpersonateUser')}</DialogTitle>
                        <DialogDescription>
                          {t('sidebarImpersonateDesc')}
                        </DialogDescription>
                      </DialogHeader>
                      <Field className='my-4'>
                        <FieldLabel>{t('sidebarUserId')}</FieldLabel>
                        <Input
                          id='targetUserId'
                          placeholder={t('sidebarUserId')}
                          // eslint-disable-next-line i18next/no-literal-string
                          {...register('targetUserId')}
                        />
                        {errors.targetUserId && (
                          <p className='text-xs text-red-400 mt-1'>
                            {errors.targetUserId.message}
                          </p>
                        )}
                      </Field>
                      {impersonateError && (
                        <p className='text-xs text-red-400 mb-2'>
                          {impersonateError}
                        </p>
                      )}
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button
                            variant='outline'
                            type='button'
                            onClick={() => reset()}
                          >
                            {t('cancel')}
                          </Button>
                        </DialogClose>
                        <Button type='submit' disabled={isSubmitting}>
                          {isSubmitting ? t('sidebarImpersonating') : t('sidebarImpersonate')}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: user identity + auth actions */}
      <SidebarFooter className='gap-2 px-4 py-4 border-t border-sidebar-border'>
        {user ? (
          <>
            <div className='flex items-center gap-2.5 min-w-0'>
              <div className='shrink-0 w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-mono text-[10px] font-semibold text-ink'>
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
                <Link to='/settings/profile'>{t('settings')}</Link>
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='text-xs'
                onClick={() =>
                  logoutMutation().then(() => navigate({ to: '/login' }))
                }
              >
                {t('logout')}
              </Button>
            </div>
          </>
        ) : (
          <Button variant='outline' size='sm' className='w-full' asChild>
            <Link to='/login'>{t('login')}</Link>
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
