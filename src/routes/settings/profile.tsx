import { createFileRoute } from '@tanstack/react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import pb from '#/lib/pocketbase';
import { useAuth } from '#/hooks/auth';
import type { UserProfile } from '#/types';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { Field, FieldError, FieldGroup } from '#/components/ui/field';

export const Route = createFileRoute('/settings/profile')({
  component: ProfileSettingsPage,
});

const SUBDOMAIN_RE = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;

const schema = z.object({
  display_name: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(256),
  bio: z.string().max(2000).optional(),
  subdomain: z
    .string()
    .refine(
      (v) => v === '' || SUBDOMAIN_RE.test(v),
      'Subdomain must be 3–63 lowercase letters, numbers, or hyphens, starting and ending with a letter or number',
    )
    .optional(),
  is_public: z.boolean(),
});
type FormData = z.infer<typeof schema>;

function ProfileSettingsPage() {
  const { user, profile, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const [subdomainStatus, setSubdomainStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle');

  const { mutateAsync: save, isPending, error } = useMutation({
    mutationFn: async (data: FormData) => {
      if (!profile?.id) return;
      await pb.collection('user_profiles').update(profile.id, {
        display_name: data.display_name,
        bio: data.bio ?? '',
        subdomain: data.subdomain ?? '',
        is_public: data.is_public,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
    },
  });

  const { control, handleSubmit, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: profile?.display_name ?? '',
      bio: profile?.bio ?? '',
      subdomain: profile?.subdomain ?? '',
      is_public: profile?.is_public ?? false,
    },
  });

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setValue('display_name', profile.display_name);
      setValue('bio', profile.bio ?? '');
      setValue('subdomain', profile.subdomain ?? '');
      setValue('is_public', profile.is_public);
    }
  }, [profile, setValue]);

  const subdomainValue = watch('subdomain');
  const isPublic = watch('is_public');

  // Debounced subdomain availability check
  useEffect(() => {
    if (!subdomainValue) {
      setSubdomainStatus('idle');
      return;
    }
    if (!SUBDOMAIN_RE.test(subdomainValue)) {
      setSubdomainStatus('invalid');
      return;
    }
    if (subdomainValue === profile?.subdomain) {
      setSubdomainStatus('available');
      return;
    }

    setSubdomainStatus('checking');
    const timer = setTimeout(async () => {
      try {
        await pb
          .collection('user_profiles')
          .getFirstListItem<UserProfile>(
            `subdomain = "${subdomainValue}" && id != "${profile?.id ?? ''}"`,
          );
        setSubdomainStatus('taken');
      } catch {
        setSubdomainStatus('available');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [subdomainValue, profile?.subdomain, profile?.id]);

  if (isLoading) return <div className='text-muted-foreground text-sm'>Loading…</div>;
  if (!user) return null;

  return (
    <div className='max-w-lg'>
      <form onSubmit={handleSubmit((d) => save(d))} className='space-y-5'>
        <FieldGroup>
          <Controller
            name='display_name'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor='display_name'>Display name</Label>
                <Input id='display_name' {...field} />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name='bio'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor='bio'>Bio</Label>
                <Input id='bio' {...field} placeholder='A few words about you…' />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name='subdomain'
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || subdomainStatus === 'taken' || subdomainStatus === 'invalid'}>
                <Label htmlFor='subdomain'>
                  Subdomain
                  <span className='ml-1.5 font-mono text-[10px] text-muted-foreground'>
                    your-name.hairspring.app
                  </span>
                </Label>
                <div className='flex items-center gap-2'>
                  <Input
                    id='subdomain'
                    {...field}
                    placeholder='your-name'
                    className='font-mono text-sm'
                  />
                  <span className='font-mono text-[11px] text-muted-foreground whitespace-nowrap'>
                    {subdomainStatus === 'checking' && 'checking…'}
                    {subdomainStatus === 'available' && (
                      <span className='text-green-400'>✓ available</span>
                    )}
                    {subdomainStatus === 'taken' && (
                      <span className='text-red-400'>✗ taken</span>
                    )}
                    {subdomainStatus === 'invalid' && (
                      <span className='text-amber-400'>invalid format</span>
                    )}
                  </span>
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
                <p className='font-mono text-[10px] text-muted-foreground mt-1'>
                  Lowercase letters, numbers, and hyphens only (3–63 chars). Setting a subdomain
                  enables your public profile page.
                </p>
              </Field>
            )}
          />

          <div className='flex items-center gap-3'>
            <Controller
              name='is_public'
              control={control}
              render={({ field }) => (
                <button
                  type='button'
                  role='switch'
                  aria-checked={field.value}
                  disabled={!subdomainValue || subdomainStatus !== 'available'}
                  onClick={() => field.onChange(!field.value)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    field.value ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg transition-transform ${
                      field.value ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              )}
            />
            <div>
              <Label className='cursor-pointer'>Public profile</Label>
              <p className='font-mono text-[10px] text-muted-foreground'>
                {isPublic
                  ? `Your profile is visible at ${subdomainValue}.hairspring.app`
                  : 'Set a subdomain first to enable your public profile'}
              </p>
            </div>
          </div>
        </FieldGroup>

        {error && (
          <p className='text-sm text-red-400'>
            {(error as Error).message ?? 'Save failed. Please try again.'}
          </p>
        )}

        <Button type='submit' disabled={isPending || subdomainStatus === 'taken'}>
          {isPending ? 'Saving…' : 'Save profile'}
        </Button>
      </form>
    </div>
  );
}
