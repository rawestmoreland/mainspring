import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { Field, FieldError, FieldGroup } from '#/components/ui/field';
import { useJoinWaitlist } from '#/hooks/waitlist';

const schema = z.object({
  // display_name: z
  //   .string()
  //   .min(2, 'Display name must be at least 2 characters')
  //   .max(256),
  email: z.email('Enter a valid email'),
  // password: z.string().min(8, 'Password must be at least 8 characters'),
});
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute('/signup')({ component: SignupPage });

function SignupPage() {
  const navigate = useNavigate();

  const { mutateAsync: joinWaitlist, isPending, error } = useJoinWaitlist();

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
    },
    // defaultValues: { display_name: '', email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    await joinWaitlist(data.email);
    navigate({ to: '/', replace: true });
  };

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <div className='w-full max-w-sm'>
        <div className='mb-8 text-center'>
          <h1 className='font-serif text-2xl font-bold text-primary mb-5'>
            Hairspring Waitlist
          </h1>
          <p className='font-mono text-xs text-muted-foreground tracking-widest uppercase'>
            Hairspring is opening to the public soon. Join the waitlist to be
            notified when you can officially create an account. New accounts get{' '}
            <span className='text-foreground'>14 days of Pro free</span> — every
            Pro feature, no credit card required to start.
          </p>
        </div>

        <div className='bg-card border border-border rounded-xl shadow-sm p-6'>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <FieldGroup>
              {/* <Controller
                name='display_name'
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Label htmlFor='display_name'>Display name</Label>
                    <Input
                      id='display_name'
                      autoComplete='name'
                      autoFocus
                      placeholder='Your name'
                      {...field}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              /> */}
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
              {/* <Controller
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
              /> */}
            </FieldGroup>

            {error && (
              <p className='text-sm text-destructive'>
                {(error as Error).message ??
                  'Request failed. Please try again.'}
              </p>
            )}

            <Button type='submit' className='w-full' disabled={isPending}>
              {isPending ? 'Joining waitlist...' : 'Join waitlist'}
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
