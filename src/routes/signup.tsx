import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { UserApi } from '#/lib/api/user';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Label } from '#/components/ui/label';
import { Field, FieldError, FieldGroup } from '#/components/ui/field';

const schema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters').max(256),
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute('/signup')({ component: SignupPage });

function SignupPage() {
  const navigate = useNavigate();
  const { mutateAsync: signup, isPending, error } = useMutation({
    mutationFn: ({ email, password, display_name }: FormData) =>
      UserApi.signup(email, password, display_name),
  });

  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { display_name: '', email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    await signup(data);
    navigate({ to: '/', replace: true });
  };

  return (
    <div className='min-h-screen bg-zinc-950 flex items-center justify-center p-4'>
      <div className='w-full max-w-sm'>
        <div className='mb-8 text-center'>
          <h1 className='font-serif text-2xl font-bold text-primary mb-1'>
            Hairspring
          </h1>
          <p className='font-mono text-xs text-muted-foreground tracking-widest uppercase'>
            Create your account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <FieldGroup>
            <Controller
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
            />
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
            <p className='text-sm text-red-400'>
              {(error as Error).message ?? 'Signup failed. Please try again.'}
            </p>
          )}

          <Button type='submit' className='w-full' disabled={isPending}>
            {isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

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
