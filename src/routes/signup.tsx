import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePostHog } from '@posthog/react';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { Field, FieldError, FieldGroup } from '#/components/ui/field';
import { GoogleSignInButton } from '#/components/primitives/GoogleSignInButton';
import { AppleSignInButton } from '#/components/primitives/AppleSignInButton';
import { DiscordSignInButton } from '#/components/primitives/DiscordSignInButton';
// import { useJoinWaitlist } from '#/hooks/waitlist';
import { useSignup, useOauth2Login } from '#/hooks/user';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '#/hooks/auth';

const schema = z.object({
  display_name: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(256),
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute('/signup')({ component: SignupPage });

function SignupPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const posthog = usePostHog();

  // const { mutateAsync: joinWaitlist, isPending, error } = useJoinWaitlist();
  const { mutateAsync: signup, isPending, error } = useSignup();
  const { mutateAsync: oauthLogin, isPending: oauthPending } = useOauth2Login();

  const onOauthSubmit = async (provider: 'google' | 'apple' | 'discord') => {
    try {
      const result = await oauthLogin({ provider });
      posthog.identify(result.record.id, { email: result.record.email });
      posthog.capture('oauth_sign_in', { provider });
      navigate({ to: '/', replace: true });
    } catch {
      toast.error('Sign-in failed. Please try again.');
    }
  };

  const { control, handleSubmit, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { display_name: '', email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    const result = await signup({
      displayName: data.display_name,
      email: data.email,
      password: data.password,
    });
    posthog.identify(result.record.id, { email: result.record.email });
    posthog.capture('user_signed_up', { method: 'email' });
    navigate({ to: '/', replace: true });
  };

  const emailWatch = watch('email');

  useEffect(() => {
    if (!!emailWatch) {
      setValue('display_name', emailWatch.split('@')[0], { shouldDirty: true });
    } else {
      setValue('display_name', '', { shouldDirty: true });
    }
  }, [emailWatch]);

  useEffect(() => {
    if (!isLoading && !!user) {
      navigate({ to: '/dashboard', replace: true });
    }
  }, [user, isLoading]);

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <div className='w-full max-w-sm'>
        <div className='mb-8 text-center'>
          <h1 className='font-serif text-2xl font-bold text-primary mb-5'>
            Create an account
          </h1>
          {/* <p className='font-mono text-xs text-muted-foreground tracking-widest uppercase'>
            Hairspring is opening to the public soon. Join the waitlist to be
            notified when you can officially create an account. New accounts get{' '}
            <span className='text-foreground'>14 days of Pro free</span> — every
            Pro feature, no credit card required to start.
          </p> */}
        </div>

        <div className='bg-card border border-border rounded-xl shadow-sm p-6'>
          <div className='flex flex-col gap-2'>
            <GoogleSignInButton
              onClick={() => onOauthSubmit('google')}
              loading={oauthPending}
              label='Sign up with Google'
            />
            <AppleSignInButton
              onClick={() => onOauthSubmit('apple')}
              loading={oauthPending}
              label='Sign up with Apple'
            />
            <DiscordSignInButton
              onClick={() => onOauthSubmit('discord')}
              loading={oauthPending}
              label='Sign up with Discord'
            />
          </div>
          <div className='flex items-center my-4'>
            <div className='h-0.5 w-full border' />
            <span className='px-4 text-sm'>OR</span>
            <div className='h-0.5 w-full border' />
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <FieldGroup>
              <Controller
                name='email'
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='email'
                      autoComplete='email'
                      {...field}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name='password'
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Label htmlFor='password'>Password</Label>
                    <Input
                      id='password'
                      type='password'
                      autoComplete='new-password'
                      {...field}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            {error && (
              <p className='text-sm text-destructive'>
                {(error as Error).message ??
                  'Request failed. Please try again.'}
              </p>
            )}

            <Button type='submit' className='w-full' disabled={isPending}>
              {isPending ? 'Signing up...' : 'Sign up'}
            </Button>
          </form>
        </div>

        <p className='mt-6 text-center font-mono text-xs text-muted-foreground'>
          Already have an account?{' '}
          <Link to='/login' className='text-primary hover:underline'>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
